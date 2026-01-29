import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Checkbox } from "../components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../components/ui/dropdown-menu"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Textarea } from "../components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Eye, CheckCircle, Calendar, XCircle, ChevronDown, MapPin } from "lucide-react"
import { format } from "date-fns"
import type { WasteReportResponse } from "../types/index"

export default function ReportsManagementConsole() {
    const [reports, setReports] = useState<WasteReportResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedReports, setSelectedReports] = useState<string[]>([])
    const [activeModal, setActiveModal] = useState<"evidence" | "resolve" | "schedule" | "reject" | null>(null)
    const [currentReport, setCurrentReport] = useState<WasteReportResponse | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [severityFilter, setSeverityFilter] = useState<string>("all")

    // Resolve Modal State
    const [resolveProofFile, setResolveProofFile] = useState<File | null>(null)
    const [resolveNotes, setResolveNotes] = useState("")
    const [uploading, setUploading] = useState(false)

    // Schedule Modal State
    const [scheduleDate, setScheduleDate] = useState("")
    const [scheduleTeam, setScheduleTeam] = useState("")
    const [scheduleNotes, setScheduleNotes] = useState("")

    // Reject Modal State
    const [rejectReason, setRejectReason] = useState("")

    // Bulk Action State
    const [isBulkAction, setIsBulkAction] = useState(false)

    useEffect(() => {
        fetchReports()

        // Realtime Subscription
        const channel = supabase
            .channel('reports-console')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
                fetchReports()
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    const fetchReports = async () => {
        try {
            const { data, error } = await supabase
                .from('reports')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setReports((data || []) as WasteReportResponse[])
        } catch (error) {
            console.error("Error fetching reports:", error)
        } finally {
            setLoading(false)
        }
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "CRITICAL":
                return "bg-red-500 text-white hover:bg-red-600"
            case "HIGH":
                return "bg-orange-500 text-white hover:bg-orange-600"
            case "MEDIUM":
                return "bg-yellow-500 text-black hover:bg-yellow-600"
            case "LOW":
                return "bg-green-500 text-white hover:bg-green-600"
            default:
                return "bg-gray-500 text-white hover:bg-gray-600"
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "OPEN":
            case "PENDING": // Handle potential legacy or synonym
                return "bg-blue-100 text-blue-800 hover:bg-blue-200"
            case "RESOLVED":
                return "bg-green-100 text-green-800 hover:bg-green-200"
            case "SCHEDULED":
                return "bg-purple-100 text-purple-800 hover:bg-purple-200"
            case "REJECTED":
                return "bg-red-100 text-red-800 hover:bg-red-200"
            case "IN_PROGRESS":
                return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
            default:
                return "bg-gray-100 text-gray-800 hover:bg-gray-200"
        }
    }

    const handleSelectReport = (reportId: string) => {
        setSelectedReports((prev) => (prev.includes(reportId) ? prev.filter((id) => id !== reportId) : [...prev, reportId]))
    }

    const handleSelectAll = () => {
        if (selectedReports.length === filteredReports.length) {
            setSelectedReports([])
        } else {
            setSelectedReports(filteredReports.map((r) => r.id))
        }
    }

    const openModal = (type: "evidence" | "resolve" | "schedule" | "reject", report?: WasteReportResponse) => {
        if (report) {
            setCurrentReport(report)
            setIsBulkAction(false)
        } else {
            // Bulk Action
            setIsBulkAction(true)
        }
        setActiveModal(type)

        // Reset form states
        setResolveProofFile(null)
        setResolveNotes("")
        setScheduleDate("")
        setScheduleTeam("")
        setScheduleNotes("")
        setRejectReason("")
    }

    const closeModal = () => {
        setActiveModal(null)
        setCurrentReport(null)
    }

    const uploadProof = async (file: File): Promise<string | null> => {
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `proof_${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('reports') // reusing reports bucket? or create 'admin-proofs'
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data } = supabase.storage.from('reports').getPublicUrl(filePath)
            return data.publicUrl
        } catch (error) {
            console.error("Upload failed", error)
            return null
        }
    }

    const handleResolve = async () => {
        if ((!isBulkAction && !currentReport) || (isBulkAction && selectedReports.length === 0) || !resolveProofFile) {
            alert("Please upload proof of completion")
            return
        }
        setUploading(true)
        try {
            const proofUrl = await uploadProof(resolveProofFile)
            if (!proofUrl) throw new Error("Failed to upload proof")

            const targetIds = isBulkAction ? selectedReports : [currentReport!.id]

            const { error } = await supabase
                .from('reports')
                .update({
                    status: 'RESOLVED',
                    resolution_proof_url: proofUrl,
                    resolution_notes: resolveNotes,
                    updated_at: new Date().toISOString()
                })
                .in('id', targetIds)

            if (error) throw error
            closeModal()
            if (isBulkAction) setSelectedReports([]) // Clear selection after bulk action
        } catch (error) {
            console.error("Error resolving report:", error)
            alert("Failed to resolve report")
        } finally {
            setUploading(false)
        }
    }

    const handleSchedule = async () => {
        if ((!isBulkAction && !currentReport) || (isBulkAction && selectedReports.length === 0) || !scheduleDate || !scheduleTeam) {
            alert("Please fill in all required fields")
            return
        }
        try {
            const targetIds = isBulkAction ? selectedReports : [currentReport!.id]

            const { error } = await supabase
                .from('reports')
                .update({
                    status: 'SCHEDULED',
                    scheduled_date: new Date(scheduleDate).toISOString(),
                    assigned_team: scheduleTeam,
                    resolution_notes: scheduleNotes, // Using resolution notes for scheduling notes for now
                    updated_at: new Date().toISOString()
                })
                .in('id', targetIds)

            if (error) throw error
            closeModal()
            if (isBulkAction) setSelectedReports([]) // Clear selection after bulk action
        } catch (error) {
            console.error("Error scheduling:", error)
            alert("Failed to schedule report")
        }
    }

    const handleReject = async () => {
        if (!currentReport || !rejectReason.trim()) {
            alert("Please provide a reason for rejection")
            return
        }
        try {
            const { error } = await supabase
                .from('reports')
                .update({
                    status: 'REJECTED',
                    rejection_reason: rejectReason,
                    updated_at: new Date().toISOString()
                })
                .eq('id', currentReport.id)

            if (error) throw error
            closeModal()
        } catch (error) {
            console.error("Error rejecting:", error)
            alert("Failed to reject report")
        }
    }

    const filteredReports = reports.filter((report) => {
        const matchesSearch =
            report.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.location?.address?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === "all" || report.status === statusFilter
        const matchesSeverity = severityFilter === "all" || report.severity === severityFilter
        return matchesSearch && matchesStatus && matchesSeverity
    })

    // Helper for safe date formatting
    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'MMM d, h:mm a')
        } catch (e) {
            return 'Invalid Date'
        }
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="bg-white border-b px-6 py-4 shadow-sm">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-gray-900">Reports Management Console</h1>
                    <div className="flex gap-2">
                        <div className="flex gap-2">
                            <Button
                                className="bg-green-600 hover:bg-green-700 text-white"
                                disabled={selectedReports.length === 0}
                                onClick={() => openModal("schedule")}
                            >
                                Bulk Assign Team {selectedReports.length > 0 && `(${selectedReports.length})`}
                            </Button>
                            <Button
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                disabled={selectedReports.length === 0}
                                onClick={() => openModal("resolve")}
                            >
                                Bulk Resolve {selectedReports.length > 0 && `(${selectedReports.length})`}
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-6">
                {/* Filters */}
                <div className="mb-6 flex flex-wrap items-center gap-4">
                    <div className="w-40">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="OPEN">Open / Pending</SelectItem>
                                <SelectItem value="RESOLVED">Resolved</SelectItem>
                                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-40">
                        <Select value={severityFilter} onValueChange={setSeverityFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Severity" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Severity</SelectItem>
                                <SelectItem value="CRITICAL">Critical</SelectItem>
                                <SelectItem value="HIGH">High</SelectItem>
                                <SelectItem value="MEDIUM">Medium</SelectItem>
                                <SelectItem value="LOW">Low</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Input
                        placeholder="Search by ID or Location"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-64"
                    />

                    <div className="ml-auto text-sm text-gray-500">
                        Showing {filteredReports.length} of {reports.length} reports
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">
                                    <Checkbox
                                        checked={filteredReports.length > 0 && selectedReports.length === filteredReports.length}
                                        onCheckedChange={handleSelectAll}
                                    />
                                </TableHead>
                                <TableHead>Report ID</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Severity</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Timestamp</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center h-24 text-gray-500">Loading reports...</TableCell>
                                </TableRow>
                            ) : filteredReports.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center h-24 text-gray-500">No reports found.</TableCell>
                                </TableRow>
                            ) : (
                                filteredReports.map((report) => (
                                    <TableRow key={report.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedReports.includes(report.id)}
                                                onCheckedChange={() => handleSelectReport(report.id)}
                                            />
                                        </TableCell>
                                        <TableCell className="font-mono font-medium text-xs">{report.id.slice(0, 8)}...</TableCell>
                                        <TableCell>{report.waste_category}</TableCell>
                                        <TableCell>
                                            <Badge className={getSeverityColor(report.severity)}>{report.severity}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(report.status)} variant="secondary">
                                                {report.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[150px] truncate" title={report.location?.address || 'Unknown'}>
                                            {report.location?.address || 'Unknown Location'}
                                        </TableCell>
                                        <TableCell className="text-gray-500 text-xs">{formatDate(report.created_at)}</TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="outline" onClick={() => openModal("evidence", report)}>
                                                    <Eye className="mr-1 h-3 w-3" />
                                                    View
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button size="sm" variant="default" className="bg-gray-800 text-white hover:bg-gray-900">
                                                            Actions <ChevronDown className="ml-1 h-3 w-3" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openModal("resolve", report)}>
                                                            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                                            Resolve with Proof
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openModal("schedule", report)}>
                                                            <Calendar className="mr-2 h-4 w-4 text-blue-600" />
                                                            Schedule
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openModal("reject", report)} className="text-red-600">
                                                            <XCircle className="mr-2 h-4 w-4" />
                                                            Reject
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination Info */}
                <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        {selectedReports.length > 0 && `${selectedReports.length} selected`}
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled>
                            Previous
                        </Button>
                        <Button variant="outline" size="sm" disabled>
                            Next
                        </Button>
                    </div>
                </div>
            </main>

            {/* Evidence Modal */}
            <Dialog open={activeModal === "evidence"} onOpenChange={(open) => !open && closeModal()}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Report Evidence</DialogTitle>
                        <DialogDescription>Report ID: {currentReport?.id || 'N/A'}</DialogDescription>
                    </DialogHeader>
                    {currentReport && (
                        <div className="space-y-4">
                            {/* Image */}
                            <div className="overflow-hidden rounded-lg border bg-gray-50 flex items-center justify-center min-h-[200px]">
                                {(() => {
                                    const mediaFile = currentReport.media_file;
                                    const mediaType = currentReport.media_type || 'image/jpeg';
                                    let imgSrc = null;

                                    if (mediaFile) {
                                        // Check if it's already a data URI
                                        if (mediaFile.startsWith('data:')) {
                                            imgSrc = mediaFile;
                                        } else if (mediaFile.startsWith('http')) {
                                            imgSrc = mediaFile;
                                        } else if (mediaFile.charCodeAt(0) === 92 && mediaFile.charCodeAt(1) === 120) {
                                            // Decode bytea hex to string (DB stores data URI as hex)
                                            try {
                                                const hexString = mediaFile.substring(2);
                                                let decodedString = '';
                                                for (let i = 0; i < hexString.length; i += 2) {
                                                    decodedString += String.fromCharCode(parseInt(hexString.substr(i, 2), 16));
                                                }
                                                imgSrc = decodedString;
                                            } catch (e) {
                                                console.error('Bytea decoding error:', e);
                                            }
                                        } else if (mediaFile.length > 200) {
                                            // Assume Raw Base64
                                            imgSrc = `data:${mediaType};base64,${mediaFile}`;
                                        } else {
                                            // Assume Path
                                            imgSrc = supabase.storage.from('reports').getPublicUrl(mediaFile).data.publicUrl;
                                        }
                                    }

                                    return imgSrc ? (
                                        <img
                                            src={imgSrc}
                                            alt="Report evidence"
                                            className="w-full max-h-[400px] object-contain"
                                        />
                                    ) : (
                                        <div className="text-gray-400 flex flex-col items-center">
                                            <MapPin size={48} />
                                            <span className="mt-2">No Image Available</span>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="font-semibold text-gray-900">Location:</p>
                                    <p className="text-gray-600">{currentReport.location?.address || 'N/A'}</p>
                                    <p className="text-xs text-gray-400 font-mono mt-1">
                                        {currentReport.location?.latitude ? Number(currentReport.location.latitude).toFixed(5) : '0.0000'}, {currentReport.location?.longitude ? Number(currentReport.location.longitude).toFixed(5) : '0.0000'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1 italic">
                                        {typeof currentReport.location_context === 'object' ? JSON.stringify(currentReport.location_context) : currentReport.location_context}
                                    </p>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">Category & Size:</p>
                                    <p className="text-gray-600">{currentReport.waste_category} / {currentReport.size_estimation}</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">Severity & Urgency:</p>
                                    <div className="flex gap-2">
                                        <Badge className={getSeverityColor(currentReport.severity)}>{currentReport.severity}</Badge>
                                        {currentReport.urgency_level && <Badge variant="outline">{currentReport.urgency_level} urg.</Badge>}
                                    </div>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">AI Confidence:</p>
                                    <p className="text-gray-600">{currentReport.ai_confidence_score ? (Number(currentReport.ai_confidence_score) * 100).toFixed(0) + '%' : 'N/A'}</p>
                                </div>

                                {/* New Detailed Fields */}
                                <div className="col-span-2 grid grid-cols-2 gap-4 border-t pt-4">
                                    {currentReport.hazard_indicators && Array.isArray(currentReport.hazard_indicators) && currentReport.hazard_indicators.length > 0 && (
                                        <div className="col-span-2">
                                            <p className="font-semibold text-red-600">Hazard Indicators:</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {currentReport.hazard_indicators.map((hazard, i) => (
                                                    <Badge key={i} variant="destructive" className="text-xs">{typeof hazard === 'object' ? JSON.stringify(hazard) : hazard}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {currentReport.impact_details && currentReport.impact_details !== '{}' && (
                                        <div className="col-span-2">
                                            <p className="font-semibold text-gray-900">Impact Details:</p>
                                            <p className="text-gray-600 text-xs">{(typeof currentReport.impact_details === 'object' && Object.keys(currentReport.impact_details).length > 0 ? JSON.stringify(currentReport.impact_details) : (typeof currentReport.impact_details === 'string' && currentReport.impact_details !== '{}' ? currentReport.impact_details : null))}</p>
                                        </div>
                                    )}

                                    <div>
                                        <p className="font-semibold text-gray-900">Accessibility:</p>
                                        <p className="text-gray-600">{currentReport.accessibility_block ? 'Blocked' : 'Accessible'}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Affected Population:</p>
                                        <p className="text-gray-600">{currentReport.affected_population || 'Unknown'}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Animals Nearby:</p>
                                        <p className="text-gray-600">{currentReport.animal_hazard ? 'Yes' : 'No'}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Water Impact:</p>
                                        <p className="text-gray-600 truncate">
                                            {(currentReport.water_impact_details && currentReport.water_impact_details !== '{}')
                                                ? (typeof currentReport.water_impact_details === 'object' ? JSON.stringify(currentReport.water_impact_details) : currentReport.water_impact_details)
                                                : 'None'}
                                        </p>
                                    </div>
                                </div>


                                <div className="col-span-2 border-t pt-2">
                                    <p className="font-semibold text-gray-900">Description:</p>
                                    <p className="text-gray-600">{currentReport.description || 'No description provided.'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={closeModal}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Resolve Modal */}
            <Dialog open={activeModal === "resolve"} onOpenChange={(open) => !open && closeModal()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isBulkAction ? `Bulk Resolve (${selectedReports.length} Reports)` : 'Resolve Report'}</DialogTitle>
                        <DialogDescription>Upload proof of completion and add notes to resolve {isBulkAction ? 'these incidents' : 'this incident'}.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="proof">Proof of Completion (Required)</Label>
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
                        <Button variant="outline" onClick={closeModal} disabled={uploading}>
                            Cancel
                        </Button>
                        <Button onClick={handleResolve} className="bg-green-600 hover:bg-green-700 text-white" disabled={uploading}>
                            {uploading ? 'Uploading...' : `Mark ${isBulkAction ? selectedReports.length : ''} as Resolved`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Schedule Modal */}
            <Dialog open={activeModal === "schedule"} onOpenChange={(open) => !open && closeModal()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isBulkAction ? `Bulk Schedule (${selectedReports.length} Reports)` : 'Schedule Report'}</DialogTitle>
                        <DialogDescription>Assign a team and set a target date {isBulkAction ? 'for selected reports' : ''}.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="schedule-date">Target Date (Required)</Label>
                            <Input
                                id="schedule-date"
                                type="datetime-local"
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="team">Assign Team (Required)</Label>
                            <Select value={scheduleTeam} onValueChange={setScheduleTeam}>
                                <SelectTrigger id="team" className="mt-1">
                                    <SelectValue placeholder="Select team" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Alpha Team">Alpha Team (General)</SelectItem>
                                    <SelectItem value="Beta Team">Beta Team (Hazardous)</SelectItem>
                                    <SelectItem value="Gamma Team">Gamma Team (Emergency)</SelectItem>
                                    <SelectItem value="Delta Team">Delta Team (Maintenance)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="schedule-notes">Notes</Label>
                            <Textarea
                                id="schedule-notes"
                                placeholder="Instructions for the team..."
                                value={scheduleNotes}
                                onChange={(e) => setScheduleNotes(e.target.value)}
                                className="mt-1"
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button onClick={handleSchedule} className="bg-blue-600 hover:bg-blue-700 text-white">
                            Schedule {isBulkAction ? `${selectedReports.length} Reports` : 'Report'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Modal */}
            <Dialog open={activeModal === "reject"} onOpenChange={(open) => !open && closeModal()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Report</DialogTitle>
                        <DialogDescription>Please provide a valid reason for rejecting this report.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="reject-reason">Reason for Rejection (Required)</Label>
                            <Textarea
                                id="reject-reason"
                                placeholder="e.g., Duplicate report, Not valid waste, Private property..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="mt-1"
                                rows={5}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button onClick={handleReject} className="bg-red-600 hover:bg-red-700 text-white">
                            Reject Report
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}
