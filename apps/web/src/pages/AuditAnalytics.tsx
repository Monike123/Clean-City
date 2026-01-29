import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Download, FileText, Search, History } from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import jsPDF from 'jspdf';

interface TeamWorkload {
    name: string;
    capacity: number;
    status: 'active' | 'idle';
}

interface AuditLogEntry {
    id: string;
    timestamp: string;
    from_user: string;
    to_user: string;
    action: string;
    report_id: string;
    details: string;
}

interface SLAData {
    period: string;
    avgResolutionTime: number;
    targetResolutionTime: number;
}

export default function AuditAnalytics() {
    const [slaData, setSLAData] = useState<SLAData[]>([]);
    const [teamWorkload, setTeamWorkload] = useState<TeamWorkload[]>([]);
    const [satisfactionScore, setSatisfactionScore] = useState(0);
    const [satisfactionChange, setSatisfactionChange] = useState(0);
    const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const logsPerPage = 10;

    useEffect(() => {
        loadAnalyticsData();
    }, []);

    const loadAnalyticsData = async () => {
        try {
            // Fetch all reports for analysis
            const { data: reports, error } = await supabase
                .from('reports')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Calculate SLA Compliance Data
            const slaMetrics = calculateSLAMetrics(reports || []);
            setSLAData(slaMetrics);

            // Calculate Team Workload
            const workload = calculateTeamWorkload(reports || []);
            setTeamWorkload(workload);

            // Calculate Citizen Satisfaction
            const satisfaction = calculateSatisfactionScore(reports || []);
            setSatisfactionScore(satisfaction.current);
            setSatisfactionChange(satisfaction.change);

            // Generate mock audit logs (replace with actual audit table later)
            const logs = generateAuditLogs(reports || []);
            setAuditLogs(logs);

        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateSLAMetrics = (reports: any[]): SLAData[] => {
        const periods = ['14 Days', '21 Days', '30 Days', '60 Days', '90 Days', '365 Days'];
        const targetTime = 48; // 48 hours target

        return periods.map((period, index) => {
            const daysAgo = [14, 21, 30, 60, 90, 365][index];
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

            const relevantReports = reports.filter(r => {
                const created = new Date(r.created_at);
                return created >= cutoffDate && r.status === 'RESOLVED';
            });

            let avgTime = targetTime;
            if (relevantReports.length > 0) {
                const totalHours = relevantReports.reduce((sum, r) => {
                    const created = new Date(r.created_at);
                    const resolved = r.updated_at ? new Date(r.updated_at) : new Date();
                    const hours = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
                    return sum + hours;
                }, 0);
                avgTime = totalHours / relevantReports.length;
            }

            return {
                period,
                avgResolutionTime: Math.round(avgTime),
                targetResolutionTime: targetTime,
            };
        });
    };

    const calculateTeamWorkload = (reports: any[]): TeamWorkload[] => {
        const activeReports = reports.filter(r =>
            r.status === 'IN_PROGRESS' || r.status === 'verified'
        );

        // Mock team data - replace with actual team/worker table later
        const teams = [
            { name: 'Delta Team', capacity: 100, activeCount: 12, maxCapacity: 12 },
            { name: 'Eco Patrol', capacity: 60, activeCount: 9, maxCapacity: 15 },
            { name: 'City Guardians', capacity: 85, activeCount: 17, maxCapacity: 20 },
        ];

        return teams.map(team => ({
            name: team.name,
            capacity: team.capacity,
            status: team.capacity > 90 ? 'active' : 'idle',
        }));
    };

    const calculateSatisfactionScore = (reports: any[]) => {
        // Calculate from Success Modal ratings (assuming stored in metadata)
        // For now, generate mock data - replace with actual ratings later
        const currentScore = 4.7;
        const previousScore = 4.6;
        const change = ((currentScore - previousScore) / previousScore) * 100;

        return {
            current: currentScore,
            change: Math.round(change * 10) / 10,
        };
    };

    const generateAuditLogs = (reports: any[]): AuditLogEntry[] => {
        // Mock audit log data - replace with actual audit_log table later
        const recentReports = reports.slice(0, 125);

        return recentReports.map((report, index) => ({
            id: `#R-2024-${String(index + 555).padStart(3, '0')}`,
            timestamp: new Date(report.created_at).toLocaleString(),
            from_user: 'Super Admin',
            to_user: index % 3 === 0 ? 'Delta Team' : index % 2 === 0 ? 'Eco Patrol' : 'Field Officer',
            action: report.status === 'RESOLVED' ? 'Resolved' :
                report.status === 'IN_PROGRESS' ? 'Updated Report Status' :
                    'Added Photo Evidence',
            report_id: report.id.substring(0, 8),
            details: report.status === 'RESOLVED' ? 'Resolved' :
                `from "${report.status}" in Progress`,
        }));
    };

    const generateCompliancePDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text('Compliance Report - Audit & Team Analytics', 20, 20);

        doc.setFontSize(12);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 35);

        // SLA Compliance
        doc.setFontSize(16);
        doc.text('SLA Compliance Metrics', 20, 50);
        doc.setFontSize(10);
        let yPos = 60;
        slaData.forEach(item => {
            doc.text(`${item.period}: Avg ${item.avgResolutionTime}h | Target ${item.targetResolutionTime}h`, 25, yPos);
            yPos += 7;
        });

        // Team Workload
        yPos += 10;
        doc.setFontSize(16);
        doc.text('Team Workload', 20, yPos);
        yPos += 10;
        doc.setFontSize(10);
        teamWorkload.forEach(team => {
            doc.text(`${team.name}: ${team.capacity}% - ${team.status}`, 25, yPos);
            yPos += 7;
        });

        // Satisfaction Score
        yPos += 10;
        doc.setFontSize(16);
        doc.text('Citizen Satisfaction', 20, yPos);
        yPos += 10;
        doc.setFontSize(10);
        doc.text(`Current Score: ${satisfactionScore} / 5.0 (+${satisfactionChange}% since last month)`, 25, yPos);

        doc.save(`compliance-report-${Date.now()}.pdf`);
    };

    const exportCSV = () => {
        const headers = ['Date & Time', 'From', 'To', 'Action Performed', 'Report ID', 'Details'];
        const rows = auditLogs.map(log => [
            log.timestamp,
            log.from_user,
            log.to_user,
            log.action,
            log.report_id,
            log.details,
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-${Date.now()}.csv`;
        a.click();
    };

    // Pagination
    const indexOfLastLog = currentPage * logsPerPage;
    const indexOfFirstLog = indexOfLastLog - logsPerPage;
    const currentLogs = auditLogs.slice(indexOfFirstLog, indexOfLastLog);
    const totalPages = Math.ceil(auditLogs.length / logsPerPage);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl">Loading analytics...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-slate-900">Audit & Team Analytics</h1>
                <div className="flex gap-3">
                    <Button
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={generateCompliancePDF}
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        Generate Compliance PDF
                    </Button>
                    <Button variant="outline">
                        Bulk Resolve
                    </Button>
                </div>
            </div>

            {/* Performance Metrics */}
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* SLA Compliance Chart */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="text-base">SLA Compliance</CardTitle>
                            <div className="flex gap-4 text-xs text-slate-500 mt-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    Average Resolution Time
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                                    Target Resolution Time
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={slaData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="period"
                                        tick={{ fontSize: 10 }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                    />
                                    <YAxis tick={{ fontSize: 10 }} />
                                    <Tooltip />
                                    <Line
                                        type="monotone"
                                        dataKey="avgResolutionTime"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dot={{ fill: '#3b82f6' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="targetResolutionTime"
                                        stroke="#d1d5db"
                                        strokeDasharray="5 5"
                                        strokeWidth={2}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Team Workload */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Team Workload</CardTitle>
                            <p className="text-xs text-slate-500">Capacity utilization status</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {teamWorkload.map((team, index) => (
                                <div key={index}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium">{team.name}</span>
                                        <span className="text-slate-600">{team.capacity}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div
                                            className={`h-2.5 rounded-full ${team.capacity === 100 ? 'bg-green-500' :
                                                    team.capacity >= 80 ? 'bg-yellow-500' :
                                                        'bg-blue-500'
                                                }`}
                                            style={{ width: `${team.capacity}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex gap-2 mt-1">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${team.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {team.status === 'active' ? 'Active' : 'Idle'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Citizen Satisfaction Score */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Citizen Satisfaction Score</CardTitle>
                            <p className="text-xs text-slate-500">From Success Modal ratings</p>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center">
                            <div className="relative w-48 h-48">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="96"
                                        cy="96"
                                        r="80"
                                        stroke="#e5e7eb"
                                        strokeWidth="12"
                                        fill="none"
                                    />
                                    <circle
                                        cx="96"
                                        cy="96"
                                        r="80"
                                        stroke="#10b981"
                                        strokeWidth="12"
                                        fill="none"
                                        strokeDasharray={`${(satisfactionScore / 5) * 502.65} 502.65`}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <div className="text-4xl font-bold text-slate-900">{satisfactionScore}</div>
                                    <div className="text-sm text-slate-500">/ 5.0</div>
                                </div>
                            </div>
                            <p className="text-sm text-green-600 mt-4">
                                +{satisfactionChange}% since last month
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Administrative Audit Log */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Administrative Audit Log</CardTitle>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                                <Search className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b text-left text-sm text-slate-600">
                                    <th className="pb-3 pr-4">
                                        <input type="checkbox" className="rounded" />
                                    </th>
                                    <th className="pb-3 pr-4">Date & Time</th>
                                    <th className="pb-3 pr-4">From</th>
                                    <th className="pb-3 pr-4">To</th>
                                    <th className="pb-3 pr-4">Action Performed</th>
                                    <th className="pb-3 pr-4">Report ID</th>
                                    <th className="pb-3">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentLogs.map((log, index) => (
                                    <tr key={index} className="border-b hover:bg-slate-50">
                                        <td className="py-3 pr-4">
                                            <input type="checkbox" className="rounded" />
                                        </td>
                                        <td className="py-3 pr-4 text-sm">{log.id}</td>
                                        <td className="py-3 pr-4 text-sm">{log.from_user}</td>
                                        <td className="py-3 pr-4 text-sm">{log.to_user}</td>
                                        <td className="py-3 pr-4 text-sm">{log.action}</td>
                                        <td className="py-3 pr-4 text-sm font-mono">{log.report_id}</td>
                                        <td className="py-3">
                                            <Button
                                                variant="default"
                                                size="sm"
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                <History className="w-3 h-3 mr-1" />
                                                View History
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4">
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                className="bg-slate-900"
                            >
                                {currentPage}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                        <div className="text-sm text-slate-600">
                            Showing {indexOfFirstLog + 1}-{Math.min(indexOfLastLog, auditLogs.length)} of {auditLogs.length} entries
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={exportCSV}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
