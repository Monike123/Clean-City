import { useState, useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { supabase } from "../lib/supabase"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Switch } from "../components/ui/switch"
import { Checkbox } from "../components/ui/checkbox"
import { MapPin, Hospital, School, Droplet, Bus, Download, X, Users, ChevronRight, Clock, AlertTriangle } from "lucide-react"
import type { WasteReportResponse } from "../types/index"
import jsPDF from "jspdf"

// Leaflet Icon Fix
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Marker Icons based on severity
const getMarkerIcon = (severity: string) => {
    const color = severity === 'CRITICAL' ? 'red' : severity === 'HIGH' ? 'orange' : severity === 'MEDIUM' ? 'yellow' : 'green';
    // Using a simple divIcon or filtering default icon color might be hard without custom SVGs. 
    // For now, let's use the default blue icon but maybe add a popup with color.
    // Or better, use a custom SVG DivIcon.
    return new L.DivIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });
};

// Helper function to parse location data (handles JSONB object or JSON string)
const formatReportsForMap = (reports: any[]) => {
    return reports.map(r => {
        let lat = 0, lng = 0;

        if (r.location) {
            if (typeof r.location === 'object') {
                lat = r.location.latitude || 0;
                lng = r.location.longitude || 0;
            } else if (typeof r.location === 'string') {
                try {
                    const parsed = JSON.parse(r.location);
                    lat = parsed.latitude || 0;
                    lng = parsed.longitude || 0;
                } catch (e) {
                    console.error('[MAP] Location parse error:', e);
                }
            }
        }

        return {
            ...r,
            location: {
                ...(typeof r.location === 'object' ? r.location : {}),
                latitude: lat,
                longitude: lng
            }
        };
    });
};

export default function LiveMap() {
    const [reports, setReports] = useState<WasteReportResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [heatmapEnabled, setHeatmapEnabled] = useState(false) // Toggle density
    const [selectedReport, setSelectedReport] = useState<WasteReportResponse | null>(null)
    const [infrastructureOverlays, setInfrastructureOverlays] = useState({
        hospitals: false,
        schools: false,
        transport: false,
        water: false,
    })
    const [dispatchZone, setDispatchZone] = useState(false)
    const [activeWorkerCount, setActiveWorkerCount] = useState(0)

    useEffect(() => {
        const fetchReports = async () => {
            // 1. Check cache first
            const cached = localStorage.getItem('map_reports_cache');
            if (cached) {
                try {
                    const { data, timestamp } = JSON.parse(cached);
                    // Cache valid for 5 minutes
                    if (Date.now() - timestamp < 300000) {
                        console.log('[MAP] Loaded from cache:', data.length, 'reports');
                        setReports(data);
                        setLoading(false);
                    }
                } catch (e) {
                    console.warn('Cache parse error:', e);
                }
            }

            // 2. Fetch fresh data
            const { data, error } = await supabase
                .from('reports')
                .select('*')
                .not('location', 'is', null);

            if (data) {
                // Format and filter reports
                const formatted = formatReportsForMap(data);
                const valid = formatted.filter(r =>
                    r.location?.latitude !== 0 && r.location?.longitude !== 0
                );

                console.log('[MAP] Valid reports:', valid.length, 'out of', data.length);
                setReports(valid as WasteReportResponse[]);

                // 3. Update cache (exclude media_file to prevent quota)
                try {
                    const cacheData = valid.map(r => ({ ...r, media_file: undefined }));
                    localStorage.setItem('map_reports_cache', JSON.stringify({
                        data: cacheData,
                        timestamp: Date.now()
                    }));
                } catch (e) {
                    console.warn('Failed to cache map data:', e);
                    localStorage.removeItem('map_reports_cache');
                }
            }
            setLoading(false)
        }

        // Fetch active worker count
        const fetchWorkerCount = async () => {
            const { count } = await supabase
                .from('workers')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);
            setActiveWorkerCount(count || 0);
        };

        fetchReports()
        fetchWorkerCount()

        // Realtime updates
        const channel = supabase
            .channel('live-map')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
                console.log('[MAP] Real-time update received');
                fetchReports()
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    // Filter Logic if needed (e.g. Risk Level)
    const activeReports = reports.filter(r => r.status !== 'RESOLVED');
    const resolvedReports = reports.filter(r => r.status === 'RESOLVED');

    const displayReports = activeReports // Default to active

    return (
        <div className="flex h-full flex-col relative w-full bg-slate-100">
            {/* Header Overlaid or Top */}
            <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 z-[1000] shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900">Geospatial Intelligence</h2>
                <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => alert('Exporting GeoJSON...')}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Map Data
                </Button>
            </header>

            {/* Map Container */}
            <div className="flex-1 relative w-full h-full z-0">
                <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: "100%", width: "100%", background: "#fff" }} className="z-0">
                    {/* Light/Voyager Tile Layer for clean look */}
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    />

                    {/* Heatmap Simulation (Large Circles for Density) */}
                    {heatmapEnabled && activeReports.map(report => (
                        <Circle
                            key={`heat-${report.id}`}
                            center={[report.location.latitude, report.location.longitude]}
                            pathOptions={{ fillColor: 'red', color: 'transparent', fillOpacity: 0.2 }}
                            radius={50000} // dynamic radius based on zoom? fixed for now
                        />
                    ))}

                    {/* Standard Markers (Cluster Library Removed due to build issues) */}
                    {displayReports.map((report) => (
                        <Marker
                            key={report.id}
                            position={[report.location.latitude, report.location.longitude]}
                            icon={getMarkerIcon(report.severity)}
                            eventHandlers={{
                                click: () => {
                                    setSelectedReport(report)
                                },
                            }}
                        >
                            <Popup>
                                <div className="p-2 min-w-[200px]">
                                    <p className="font-bold text-sm mb-1">{report.waste_category}</p>
                                    <p className="text-xs text-gray-500 mb-2">{report.location.address}</p>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${report.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                        {report.severity}
                                    </span>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>

                {/* Top Left - Active Team Badge */}
                <div className="absolute top-6 left-6 z-[1000] pointer-events-none">
                    <div className="pointer-events-auto bg-white rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg w-max">
                        <Users className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-900">Active Field Team: {activeWorkerCount}</span>
                    </div>

                    {dispatchZone && (
                        <div className="pointer-events-auto p-4 bg-white border border-gray-200 rounded-lg shadow-lg w-64 mt-4">
                            <h4 className="font-bold text-sm mb-1">Dispatch Alerts</h4>
                            <p className="text-xs text-gray-500 mb-3">Alerting 8 officers in this zone.</p>
                            <Button className="w-full bg-green-600 h-8 text-xs" onClick={() => { alert('Dispatched!'); setDispatchZone(false); }}>
                                Confirm Dispatch
                            </Button>
                        </div>
                    )}
                </div>

                {/* Bottom Left - Heatmap Layer Controls */}
                <div className="absolute bottom-6 left-6 z-[1000] pointer-events-auto">
                    <div className="bg-white rounded-full px-4 py-2.5 shadow-lg border border-gray-100 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-sm font-medium text-gray-700">Heatmap</span>
                        <Switch
                            checked={heatmapEnabled}
                            onCheckedChange={setHeatmapEnabled}
                            className="data-[state=checked]:bg-green-600"
                        />
                    </div>
                </div>

                {/* Right Sidebar - Report Summary */}
                {selectedReport && (
                    <div className="absolute top-0 right-0 h-full w-96 bg-white text-gray-900 z-[1000] shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
                        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Report Summary</h3>
                                <p className="text-sm text-gray-500">ID: {selectedReport.id.slice(0, 8)}...</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedReport(null)}
                                className="text-gray-600 hover:bg-gray-200"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {/* Location Header */}
                            <div className="flex items-center justify-between px-3 py-2 bg-gray-100 rounded-md border border-gray-200">
                                <div className="flex items-center">
                                    <MapPin className="w-4 h-4 text-green-600 mr-2" />
                                    <span className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{selectedReport.location.address}</span>
                                </div>
                                <span className="text-xs text-gray-500 font-mono">
                                    {selectedReport.location.latitude.toFixed(4)}, {selectedReport.location.longitude.toFixed(4)}
                                </span>
                            </div>

                            {/* Status Items */}
                            <div className="space-y-2">
                                <div className="px-3 py-3 bg-gray-50 rounded-md border border-gray-200">
                                    <p className="text-xs text-gray-500 mb-1">Category</p>
                                    <p className="text-sm font-medium text-gray-900">{selectedReport.waste_category}</p>
                                </div>
                                <div className="px-3 py-3 bg-gray-50 rounded-md border border-gray-200">
                                    <p className="text-xs text-gray-500 mb-1">Severity Analysis</p>
                                    <div className="flex items-center justify-between">
                                        <p className={`text-sm font-medium ${selectedReport.severity === 'CRITICAL' ? 'text-red-600' : 'text-yellow-600'}`}>
                                            {selectedReport.severity}
                                        </p>
                                        {selectedReport.ai_confidence_score && (
                                            <span className="text-xs text-green-600">{(selectedReport.ai_confidence_score * 100).toFixed(0)}% AI Conf.</span>
                                        )}
                                    </div>
                                </div>
                                <div className="px-3 py-3 bg-gray-50 rounded-md border border-gray-200">
                                    <p className="text-xs text-gray-500 mb-1">Description</p>
                                    <p className="text-sm text-gray-700 italic">"{selectedReport.description}"</p>
                                </div>
                                {/* Metadata Display */}
                                {selectedReport.metadata && Object.keys(selectedReport.metadata).length > 0 && (
                                    <div className="px-3 py-3 bg-gray-50 rounded-md border border-gray-200">
                                        <p className="text-xs text-gray-500 mb-2">Additional Metadata</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(selectedReport.metadata).map(([key, value]) => (
                                                <div key={key}>
                                                    <span className="text-[10px] uppercase text-gray-400 block">{key.replace(/_/g, ' ')}</span>
                                                    <span className="text-xs font-mono text-gray-700 truncate block" title={String(value)}>{String(value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Image Preview */}
                            {selectedReport.media_file && (
                                <div className="rounded-lg overflow-hidden border border-gray-200 h-48 bg-gray-100">
                                    <img
                                        src={(() => {
                                            const mediaFile = selectedReport.media_file;

                                            // Priority 1: Data URI
                                            if (mediaFile.startsWith('data:')) {
                                                return mediaFile;
                                            }
                                            // Priority 2: PostgreSQL bytea hex (decode to string)
                                            else if (mediaFile.charCodeAt(0) === 92 && mediaFile.charCodeAt(1) === 120) {
                                                try {
                                                    const hexString = mediaFile.substring(2);
                                                    let decodedString = '';
                                                    for (let i = 0; i < hexString.length; i += 2) {
                                                        decodedString += String.fromCharCode(parseInt(hexString.substr(i, 2), 16));
                                                    }
                                                    return decodedString;
                                                } catch (e) {
                                                    console.error('Bytea decode error:', e);
                                                    return '';
                                                }
                                            }
                                            // Priority 3: HTTP URL
                                            else if (mediaFile.startsWith('http')) {
                                                return mediaFile;
                                            }
                                            // Priority 4: Raw base64
                                            else if (mediaFile.length > 200) {
                                                return `data:image/jpeg;base64,${mediaFile}`;
                                            }
                                            // Priority 5: Storage path
                                            else {
                                                return supabase.storage.from('reports').getPublicUrl(mediaFile).data.publicUrl;
                                            }
                                        })()}
                                        alt="Evidence"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            console.error('Image load failed for report', selectedReport.id);
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}

                        </div>

                        {/* Dispatch Team Section */}
                        <div className="border-t border-slate-800 bg-slate-950">
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-semibold">Quick Actions</h4>
                                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                                </div>
                                <div className="space-y-2">
                                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start" size="sm" onClick={() => setDispatchZone(true)}>
                                        <Clock className="w-4 h-4 mr-2" /> Dispatch Nearby Team
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 justify-start"
                                        size="sm"
                                        onClick={() => {
                                            const doc = new jsPDF();
                                            doc.setFontSize(20);
                                            doc.text("Environmental Incident Report", 20, 20);

                                            doc.setFontSize(12);
                                            doc.text(`Report ID: ${selectedReport.id}`, 20, 35);
                                            doc.text(`Status: ${selectedReport.status}`, 20, 45);
                                            doc.text(`Severity: ${selectedReport.severity}`, 20, 55);
                                            doc.text(`Category: ${selectedReport.waste_category}`, 20, 65);
                                            doc.text(`Date: ${new Date(selectedReport.created_at).toLocaleString()}`, 20, 75);

                                            doc.text("Location Details:", 20, 90);
                                            doc.setFontSize(10);
                                            doc.text(`Address: ${selectedReport.location.address}`, 20, 100);
                                            doc.text(`Coordinates: ${selectedReport.location.latitude}, ${selectedReport.location.longitude}`, 20, 110);

                                            doc.setFontSize(12);
                                            doc.text("Description:", 20, 125);
                                            doc.setFontSize(10);
                                            const splitDesc = doc.splitTextToSize(selectedReport.description || "No description provided.", 170);
                                            doc.text(splitDesc, 20, 135);

                                            if (selectedReport.metadata) {
                                                let yPos = 160;
                                                doc.setFontSize(12);
                                                doc.text("Metadata:", 20, yPos);
                                                yPos += 10;
                                                doc.setFontSize(10);
                                                Object.entries(selectedReport.metadata).forEach(([key, value]) => {
                                                    doc.text(`${key}: ${value}`, 20, yPos);
                                                    yPos += 7;
                                                });
                                            }

                                            doc.save(`report-${selectedReport.id.slice(0, 8)}.pdf`);
                                        }}
                                    >
                                        <Download className="w-4 h-4 mr-2" /> Download Report PDF
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
