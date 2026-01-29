import React, { useState, useEffect } from 'react';
import {
    ClipboardList,
    Search,
    Filter,
    UserPlus,
    MapPin,
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle,
    ChevronRight,
    Eye,
    User
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Report {
    id: string;
    user_id: string;
    location: { latitude: number; longitude: number; address?: string };
    waste_category: string;
    severity: string;
    status: string;
    description: string;
    media_file: string | null;
    created_at: string;
    assigned_worker_id: string | null;
}

interface Worker {
    id: string;
    full_name: string;
    employee_id: string;
    ward_number: string;
    department: string;
    total_tasks_assigned: number;
    is_available: boolean;
}

interface WorkerTask {
    id: string;
    report_id: string;
    worker_id: string;
    task_status: string;
    priority: string;
    sla_deadline: string;
    resolution_proof: any; // JSON object { url: string, notes: string }
    resolution_notes: string;
    verified_by: string | null;
    verification_status: string | null;
    verification_notes: string | null;
    assigned_at: string;
    report?: Report;
    worker?: Worker;
}

type ViewMode = 'unassigned' | 'pending_verification' | 'all';

export default function TaskAssignment() {
    const [reports, setReports] = useState<Report[]>([]);
    const [pendingTasks, setPendingTasks] = useState<WorkerTask[]>([]);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('unassigned');
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [selectedTask, setSelectedTask] = useState<WorkerTask | null>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
    const [slaDays, setSlaDays] = useState(3);
    const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
    const [assignmentNotes, setAssignmentNotes] = useState('');
    const [verificationNotes, setVerificationNotes] = useState('');
    const [qualityScore, setQualityScore] = useState(4);
    const [actionLoading, setActionLoading] = useState(false);

    const [stats, setStats] = useState({
        unassigned: 0,
        pendingVerification: 0,
        assignedToday: 0,
        resolvedToday: 0
    });

    useEffect(() => {
        fetchData();
    }, [viewMode]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch unassigned reports
            if (viewMode === 'unassigned') {
                const { data: reportsData } = await supabase
                    .from('reports')
                    .select('*')
                    .is('assigned_worker_id', null)
                    .in('status', ['submitted', 'verified'])
                    .order('created_at', { ascending: false });

                if (reportsData) setReports(reportsData);
            }

            // Fetch pending verification tasks
            if (viewMode === 'pending_verification') {
                const { data: tasksData } = await supabase
                    .from('worker_tasks')
                    .select(`
                        *,
                        report:reports(*),
                        worker:workers(id, full_name, employee_id)
                    `)
                    .eq('task_status', 'completed')
                    .order('completed_at', { ascending: true });

                if (tasksData) setPendingTasks(tasksData);
            }

            // Fetch available workers (all active workers)
            const { data: workersData, error: workersError } = await supabase
                .from('workers')
                .select('id, full_name, employee_id, ward_number, department, total_tasks_assigned, is_available')
                .eq('is_active', true);

            console.log('[TaskAssignment] Workers:', workersData?.length, 'Error:', workersError);
            if (workersData) setWorkers(workersData);

            // Calculate stats
            const { data: allReports } = await supabase
                .from('reports')
                .select('id, assigned_worker_id, status, created_at');

            const { data: allTasks } = await supabase
                .from('worker_tasks')
                .select('id, task_status, assigned_at, verified_at');

            const today = new Date().toISOString().split('T')[0];

            if (allReports && allTasks) {
                setStats({
                    unassigned: allReports.filter(r => !r.assigned_worker_id && ['submitted', 'verified', 'approved'].includes(r.status)).length,
                    pendingVerification: allTasks.filter(t => t.task_status === 'completed').length,
                    assignedToday: allTasks.filter(t => t.assigned_at?.startsWith(today)).length,
                    resolvedToday: allTasks.filter(t => t.verified_at?.startsWith(today) && t.task_status === 'resolved').length
                });
            }
        } catch (e) {
            console.error('Error fetching data:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedReport || !selectedWorkerId) return;

        setActionLoading(true);
        try {
            // Create task assignment
            const slaDeadline = new Date();
            slaDeadline.setDate(slaDeadline.getDate() + slaDays);

            const { error: taskError } = await supabase
                .from('worker_tasks')
                .insert({
                    report_id: selectedReport.id,
                    worker_id: selectedWorkerId,
                    priority,
                    sla_deadline: slaDeadline.toISOString(),
                    assignment_notes: assignmentNotes,
                    task_status: 'assigned',
                    assigned_at: new Date().toISOString()
                });

            if (taskError) {
                if (taskError.code === '23505') { // Unique constraint violation
                    alert('This report already has a task assignment. Check Pending Verification or completed tasks.');
                    return;
                }
                throw taskError;
            }

            // Update report with worker assignment
            const { data: reportData, error: reportError } = await supabase
                .from('reports')
                .update({
                    assigned_worker_id: selectedWorkerId,
                    status: 'IN_PROGRESS'
                })
                .eq('id', selectedReport.id)
                .select();

            console.log('[TaskAssignment] Report update result:', reportData, reportError);
            if (reportError) throw reportError;

            // Update worker task count
            await supabase
                .from('workers')
                .update({ total_tasks_assigned: workers.find(w => w.id === selectedWorkerId)!.total_tasks_assigned + 1 })
                .eq('id', selectedWorkerId);

            // Optimistically remove from list
            setReports(prev => prev.filter(r => r.id !== selectedReport.id));
            setStats(prev => ({ ...prev, unassigned: prev.unassigned - 1, assignedToday: prev.assignedToday + 1 }));

            setShowAssignModal(false);
            setSelectedReport(null);
            setSelectedWorkerId('');
            setAssignmentNotes('');

            // Background fetch to ensure consistency
            fetchData();
        } catch (e) {
            console.error('Error assigning task:', e);
            alert('Failed to assign task');
        } finally {
            setActionLoading(false);
        }
    };

    const handleVerify = async (approved: boolean) => {
        if (!selectedTask) return;

        setActionLoading(true);
        try {
            const updateData: any = {
                verification_status: approved ? 'approved' : 'rejected',
                verification_notes: verificationNotes,
                verified_at: new Date().toISOString(),
                task_status: approved ? 'approved' : 'rejected'
            };

            if (approved) {
                updateData.quality_score = qualityScore;
            }

            const { error } = await supabase
                .from('worker_tasks')
                .update(updateData)
                .eq('id', selectedTask.id);

            if (error) throw error;

            // Update report status and resolution proof
            const reportUpdate: any = { status: approved ? 'RESOLVED' : 'IN_PROGRESS' };

            // If approved, verify if there is a resolution proof to copy
            if (approved && selectedTask?.resolution_proof) {
                // resolution_proof is stored as { url: "..." } in worker_tasks
                const proof = typeof selectedTask.resolution_proof === 'string'
                    ? JSON.parse(selectedTask.resolution_proof)
                    : selectedTask.resolution_proof;

                if (proof?.url) {
                    reportUpdate.resolution_image_url = proof.url;
                }
            }

            await supabase
                .from('reports')
                .update(reportUpdate)
                .eq('id', selectedTask.report_id);

            setShowVerifyModal(false);
            setSelectedTask(null);
            setVerificationNotes('');
            setQualityScore(4);
            fetchData();
        } catch (e) {
            console.error('Error verifying task:', e);
            alert('Failed to verify task');
        } finally {
            setActionLoading(false);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity?.toLowerCase()) {
            case 'critical': return 'bg-red-100 text-red-700';
            case 'high': return 'bg-orange-100 text-orange-700';
            case 'medium': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-green-100 text-green-700';
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <ClipboardList className="w-7 h-7 text-green-600" />
                    Task Assignment
                </h1>
                <p className="text-gray-500 mt-1">Assign reports to workers and verify resolutions</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <p className="text-gray-500 text-sm">Unassigned Reports</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.unassigned}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <p className="text-gray-500 text-sm">Pending Verification</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.pendingVerification}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <p className="text-gray-500 text-sm">Assigned Today</p>
                    <p className="text-2xl font-bold text-green-600">{stats.assignedToday}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <p className="text-gray-500 text-sm">Resolved Today</p>
                    <p className="text-2xl font-bold text-green-600">{stats.resolvedToday}</p>
                </div>
            </div>

            {/* View Toggle */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 p-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('unassigned')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === 'unassigned'
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Unassigned Reports ({stats.unassigned})
                    </button>
                    <button
                        onClick={() => setViewMode('pending_verification')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === 'pending_verification'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        Pending Verification ({stats.pendingVerification})
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Loading...</p>
                </div>
            ) : viewMode === 'unassigned' ? (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {reports.length === 0 ? (
                        <div className="p-12 text-center">
                            <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
                            <p className="text-gray-500 mt-4">All reports have been assigned!</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Report</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Location</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Severity</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reported</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {reports.map((report) => (
                                        <tr key={report.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900 capitalize">
                                                    {report.waste_category?.replace('_', ' ') || 'Issue'}
                                                </p>
                                                <p className="text-sm text-gray-500 truncate max-w-xs">
                                                    {report.description}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center text-gray-600">
                                                    <MapPin className="w-4 h-4 mr-1" />
                                                    <span className="text-sm truncate max-w-xs">
                                                        {report.location?.address || 'Location available'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(report.severity)}`}>
                                                    {report.severity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 text-sm">
                                                {new Date(report.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => {
                                                        setSelectedReport(report);
                                                        setShowAssignModal(true);
                                                    }}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                                                >
                                                    <UserPlus className="w-4 h-4" />
                                                    Assign
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                /* Pending Verification View */
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {pendingTasks.length === 0 ? (
                        <div className="p-12 text-center">
                            <Clock className="w-12 h-12 text-gray-400 mx-auto" />
                            <p className="text-gray-500 mt-4">No tasks pending verification</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {pendingTasks.map((task) => (
                                <div key={task.id} className="p-4 hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="font-medium text-gray-900">
                                                    {task.report?.waste_category?.replace('_', ' ')}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    by {(task.worker as any)?.full_name || 'Worker'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">
                                                {task.resolution_notes || 'Resolution submitted'}
                                            </p>
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {task.report?.location?.address || 'Location'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Submitted {new Date(task.assigned_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {task.resolution_proof?.url && (
                                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                    📷 Has proof
                                                </span>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setSelectedTask(task);
                                                    setShowVerifyModal(true);
                                                }}
                                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                                            >
                                                Verify
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Assign Modal */}
            {showAssignModal && selectedReport && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Assign Task</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Worker</label>
                                <select
                                    value={selectedWorkerId}
                                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Choose a worker...</option>
                                    {workers.map((worker) => (
                                        <option key={worker.id} value={worker.id}>
                                            {worker.full_name} ({worker.employee_id}) - Ward {worker.ward_number} - {worker.total_tasks_assigned} tasks {!worker.is_available ? '(Busy)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value as any)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">SLA Deadline (days)</label>
                                <input
                                    type="number"
                                    value={slaDays}
                                    onChange={(e) => setSlaDays(parseInt(e.target.value))}
                                    min={1}
                                    max={30}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                                <textarea
                                    value={assignmentNotes}
                                    onChange={(e) => setAssignmentNotes(e.target.value)}
                                    placeholder="Add any special instructions..."
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAssign}
                                disabled={!selectedWorkerId || actionLoading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {actionLoading ? 'Assigning...' : 'Assign Task'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Verify Modal */}
            {showVerifyModal && selectedTask && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900">Verify Resolution</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Proof Image */}
                            {selectedTask.resolution_proof?.url && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Proof Image</label>
                                    <div className="flex gap-2 overflow-x-auto">
                                        <img
                                            src={selectedTask.resolution_proof.url}
                                            alt="Resolution Proof"
                                            className="w-48 h-48 object-cover rounded-lg border border-gray-200"
                                        />
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Worker Notes</label>
                                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                                    {selectedTask.resolution_notes || 'No notes provided'}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Quality Score</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((score) => (
                                        <button
                                            key={score}
                                            onClick={() => setQualityScore(score)}
                                            className={`w-10 h-10 rounded-lg font-bold ${qualityScore === score
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {score}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Verification Notes</label>
                                <textarea
                                    value={verificationNotes}
                                    onChange={(e) => setVerificationNotes(e.target.value)}
                                    placeholder="Add verification feedback..."
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                                    rows={3}
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
                            <button
                                onClick={() => setShowVerifyModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleVerify(false)}
                                disabled={actionLoading}
                                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                <XCircle className="w-4 h-4" />
                                Reject
                            </button>
                            <button
                                onClick={() => handleVerify(true)}
                                disabled={actionLoading}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Approve
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
