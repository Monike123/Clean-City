

import { MapPin, CheckCircle, Clock, Calendar } from 'lucide-react';
import { useReports } from '../hooks/useReports';
import { format } from 'date-fns';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import type { WasteReportResponse } from '../types';

export default function Dashboard() {
    const { reports, stats, loading } = useReports();
    const [resolveModalOpen, setResolveModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<WasteReportResponse | null>(null);
    const [resolveNotes, setResolveNotes] = useState("");
    const [resolveProofFile, setResolveProofFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const openResolveModal = (report: WasteReportResponse) => {
        setSelectedReport(report);
        setResolveNotes("");
        setResolveProofFile(null);
        setResolveModalOpen(true);
    };

    const handleResolve = async () => {
        if (!selectedReport) return;
        setUploading(true);
        try {
            let proofUrl = null;
            if (resolveProofFile) {
                const fileExt = resolveProofFile.name.split('.').pop();
                const fileName = `${selectedReport.id}_resolve_${Math.random()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('reports')
                    .upload(fileName, resolveProofFile);

                if (uploadError) throw uploadError;
                // Get public URL
                const { data: publicUrlData } = supabase.storage.from('reports').getPublicUrl(fileName);
                proofUrl = publicUrlData.publicUrl;
            }

            const { error } = await supabase
                .from('reports')
                .update({
                    status: 'RESOLVED',
                    resolution_notes: resolveNotes,
                    resolution_proof_url: proofUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedReport.id);

            if (error) throw error;

            // Optimistic update via hook if possible, or refetch. 
            // The subscription in useReports should handle the list update automatically.

            setResolveModalOpen(false);
        } catch (error) {
            console.error("Error resolving report:", error);
            alert("Failed to resolve report. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <>
            <header className="bg-white border-b border-gray-200 px-8 py-4">
                <h1 className="text-2xl font-bold text-gray-800">Operational Command Center</h1>
            </header>
            <div className="p-8">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-medium">Total Reports</h3>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '...' : stats.total}</p>
                        <span className="text-green-600 text-xs font-medium mt-1 inline-flex items-center">
                            Live Data <span className="w-2 h-2 bg-green-500 rounded-full ml-1 animate-pulse"></span>
                        </span>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-medium">Pending Action</h3>
                        <p className="text-3xl font-bold text-orange-600 mt-2">{loading ? '...' : stats.pending}</p>
                        <span className="text-gray-500 text-xs mt-1 inline-block">Requires attention</span>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-medium">Resolved</h3>
                        <p className="text-3xl font-bold text-blue-600 mt-2">{loading ? '...' : stats.resolved}</p>
                        <span className="text-green-600 text-xs font-medium mt-1 inline-block">Completed cases</span>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-medium">High Risk</h3>
                        <p className="text-3xl font-bold text-red-600 mt-2">{loading ? '...' : stats.highRisk}</p>
                        <span className="text-red-500 text-xs font-medium mt-1 inline-block">Priority targets</span>
                    </div>
                </div>

                {/* Active Reports Grid */}
                <h2 className="text-lg font-bold text-gray-800 mb-4">Active Incidents</h2>
                {loading ? (
                    <div className="text-center py-20 text-gray-500">Loading incidents...</div>
                ) : reports.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-gray-100 text-gray-500">
                        No reports found. Good job! 🌍
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {reports.map((report) => (
                            <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                                {/* Image Header */}
                                <div className="h-40 bg-gray-100 relative">
                                    {(() => {
                                        const mediaFile = report.media_file;
                                        const mediaType = report.media_type || 'image/jpeg';
                                        let imgSrc = null;

                                        if (mediaFile) {
                                            // Debug log
                                            console.log(`Report ${report.id} media format:`,
                                                mediaFile.substring(0, 50) + '...');

                                            // Priority 1: Data URI (starts with data:)
                                            if (mediaFile.startsWith('data:')) {
                                                imgSrc = mediaFile;
                                            }
                                            // Priority 2: PostgreSQL bytea hex (decode to string, not binary!)
                                            else if (mediaFile.charCodeAt(0) === 92 && mediaFile.charCodeAt(1) === 120) { // \x
                                                try {
                                                    // Database stores data URI as hex - decode to string
                                                    const hexString = mediaFile.substring(2);
                                                    let decodedString = '';
                                                    for (let i = 0; i < hexString.length; i += 2) {
                                                        const hexByte = hexString.substr(i, 2);
                                                        decodedString += String.fromCharCode(parseInt(hexByte, 16));
                                                    }
                                                    imgSrc = decodedString; // This should be the data URI
                                                    console.log('Decoded bytea hex to:', decodedString.substring(0, 50));
                                                } catch (e) {
                                                    console.error('Bytea hex decoding error:', e);
                                                }
                                            }
                                            // Priority 3: HTTP URL
                                            else if (mediaFile.startsWith('http')) {
                                                imgSrc = mediaFile;
                                            }
                                            // Priority 4: Raw base64
                                            else if (mediaFile.length > 200) {
                                                imgSrc = `data:${mediaType};base64,${mediaFile}`;
                                            }
                                            // Priority 5: Storage path
                                            else {
                                                imgSrc = supabase.storage.from('reports').getPublicUrl(mediaFile).data.publicUrl;
                                            }
                                        }

                                        return imgSrc ? (
                                            <img
                                                src={imgSrc}
                                                alt="Waste Report"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    console.error('Image load error for report', report.id);
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <MapPin className="mb-1" />
                                            </div>
                                        );
                                    })()}
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        <span className={`px-2 py-1 text-xs font-bold rounded-lg shadow-sm border border-white/20 text-white ${report.severity === 'HIGH' || report.severity === 'CRITICAL' ? 'bg-red-500' :
                                            report.severity === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                                            }`}>
                                            {report.severity}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-semibold text-primary uppercase tracking-wider bg-green-50 px-2 py-1 rounded">
                                            {report.waste_category.replace('_', ' ')}
                                        </span>
                                        <span className="text-[10px] text-gray-400 flex items-center">
                                            <Calendar size={10} className="mr-1" />
                                            {format(new Date(report.created_at), 'MMM d, h:mm a')}
                                        </span>
                                    </div>

                                    <p className="text-sm font-medium text-gray-800 mb-1 line-clamp-2">
                                        {report.description || 'No description provided.'}
                                    </p>

                                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-50">
                                        <div className="text-xs text-gray-500 flex items-center">
                                            <Clock size={12} className="mr-1" />
                                            {report.status}
                                        </div>

                                        {report.status !== 'RESOLVED' ? (
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={() => openResolveModal(report)}
                                                className="bg-green-600 hover:bg-green-700 text-white text-xs"
                                            >
                                                <CheckCircle size={12} className="mr-1.5" />
                                                Resolve
                                            </Button>
                                        ) : (
                                            <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-lg flex items-center">
                                                <CheckCircle size={12} className="mr-1.5" />
                                                Done
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Resolve Modal */}
            <Dialog open={resolveModalOpen} onOpenChange={setResolveModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Resolve Report</DialogTitle>
                        <DialogDescription>Upload proof of completion and add notes to resolve this incident.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="proof">Proof of Completion (Optional)</Label>
                            <Input
                                id="proof"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setResolveProofFile(e.target.files ? e.target.files[0] : null)}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="resolve-notes">Notes</Label>
                            <Textarea
                                id="resolve-notes"
                                placeholder="Describe how it was resolved..."
                                value={resolveNotes}
                                onChange={(e) => setResolveNotes(e.target.value)}
                                className="mt-1"
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setResolveModalOpen(false)} disabled={uploading}>
                            Cancel
                        </Button>
                        <Button onClick={handleResolve} className="bg-green-600 hover:bg-green-700 text-white" disabled={uploading}>
                            {uploading ? 'Uploading...' : 'Mark as Resolved'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
