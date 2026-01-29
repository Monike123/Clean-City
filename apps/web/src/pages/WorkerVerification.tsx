import React, { useState, useEffect } from 'react';
import {
    Shield,
    Users,
    UserCheck,
    UserX,
    Clock,
    Search,
    Eye,
    CheckCircle,
    XCircle,
    AlertTriangle,
    ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Worker {
    id: string;
    user_id: string;
    full_name: string;
    phone_number: string;
    email: string;
    employee_id: string;
    ward_number: string;
    department: string;
    id_proof_type: string;
    id_proof_number: string;
    id_proof_image_url: string;
    employment_type: string;
    verification_status: 'pending' | 'approved' | 'rejected' | 'suspended';
    verified_by: string | null;
    verified_at: string | null;
    rejection_reason: string | null;
    total_tasks_completed: number;
    total_points: number;
    worker_rank: string;
    created_at: string;
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected' | 'suspended';

export default function WorkerVerification() {
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterStatus>('pending');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0
    });

    useEffect(() => {
        fetchWorkers();
    }, [filter]);

    const fetchWorkers = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('workers')
                .select('*')
                .order('created_at', { ascending: false });

            if (filter !== 'all') {
                query = query.eq('verification_status', filter);
            }

            const { data, error } = await query;

            if (!error && data) {
                setWorkers(data);
            }

            // Fetch stats
            const { data: allWorkers } = await supabase
                .from('workers')
                .select('verification_status');

            if (allWorkers) {
                setStats({
                    total: allWorkers.length,
                    pending: allWorkers.filter(w => w.verification_status === 'pending').length,
                    approved: allWorkers.filter(w => w.verification_status === 'approved').length,
                    rejected: allWorkers.filter(w => w.verification_status === 'rejected').length
                });
            }
        } catch (e) {
            console.error('Error fetching workers:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (status: 'approved' | 'rejected' | 'suspended') => {
        if (!selectedWorker) return;

        if (status === 'rejected' && !rejectionReason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        setActionLoading(true);
        try {
            const updateData: any = {
                verification_status: status,
                verified_at: new Date().toISOString(),
                is_active: status === 'approved'
            };

            if (status === 'rejected') {
                updateData.rejection_reason = rejectionReason;
            }

            const { error } = await supabase
                .from('workers')
                .update(updateData)
                .eq('id', selectedWorker.id);

            if (error) throw error;

            // Update profile role if approved
            if (status === 'approved' && selectedWorker.user_id) {
                await supabase
                    .from('profiles')
                    .update({ role: 'worker' })
                    .eq('id', selectedWorker.user_id);
            }

            setShowModal(false);
            setSelectedWorker(null);
            setRejectionReason('');
            fetchWorkers();
        } catch (e) {
            console.error('Error updating worker:', e);
            alert('Failed to update worker status');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">Pending</span>;
            case 'approved':
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">Approved</span>;
            case 'rejected':
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">Rejected</span>;
            case 'suspended':
                return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">Suspended</span>;
            default:
                return null;
        }
    };

    const filteredWorkers = workers.filter(w =>
        w.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.employee_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Shield className="w-7 h-7 text-green-600" />
                    Worker Verification
                </h1>
                <p className="text-gray-500 mt-1">Review and verify worker applications</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Total Workers</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                        <Users className="w-10 h-10 text-green-500 opacity-70" />
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Pending</p>
                            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                        </div>
                        <Clock className="w-10 h-10 text-amber-500 opacity-70" />
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Approved</p>
                            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                        </div>
                        <UserCheck className="w-10 h-10 text-green-500 opacity-70" />
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Rejected</p>
                            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                        </div>
                        <UserX className="w-10 h-10 text-red-500 opacity-70" />
                    </div>
                </div>
            </div>

            {/* Filter & Search */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
                <div className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                    {/* Filter Tabs */}
                    <div className="flex gap-2 overflow-x-auto">
                        {(['all', 'pending', 'approved', 'rejected', 'suspended'] as FilterStatus[]).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filter === f
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search workers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                </div>
            </div>

            {/* Workers Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto"></div>
                        <p className="text-gray-500 mt-4">Loading workers...</p>
                    </div>
                ) : filteredWorkers.length === 0 ? (
                    <div className="p-12 text-center">
                        <Users className="w-12 h-12 text-gray-300 mx-auto" />
                        <p className="text-gray-500 mt-4">No workers found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Worker</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Employee ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ward</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Department</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Applied</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredWorkers.map((worker) => (
                                    <tr key={worker.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900">{worker.full_name}</p>
                                                <p className="text-sm text-gray-500">{worker.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">{worker.employee_id}</td>
                                        <td className="px-6 py-4 text-gray-700">Ward {worker.ward_number}</td>
                                        <td className="px-6 py-4">
                                            <span className="capitalize text-gray-700">
                                                {worker.department?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{getStatusBadge(worker.verification_status)}</td>
                                        <td className="px-6 py-4 text-gray-500 text-sm">
                                            {new Date(worker.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => {
                                                    setSelectedWorker(worker);
                                                    setShowModal(true);
                                                }}
                                                className="inline-flex items-center gap-1 text-green-600 hover:text-green-800 font-medium text-sm"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Worker Detail Modal */}
            {showModal && selectedWorker && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">Worker Details</h2>
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        setSelectedWorker(null);
                                        setRejectionReason('');
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Personal Info */}
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3">Personal Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Full Name</p>
                                        <p className="font-medium">{selectedWorker.full_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Phone</p>
                                        <p className="font-medium">{selectedWorker.phone_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="font-medium">{selectedWorker.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Employee ID</p>
                                        <p className="font-medium">{selectedWorker.employee_id}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Employment Info */}
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3">Employment Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Department</p>
                                        <p className="font-medium capitalize">{selectedWorker.department?.replace('_', ' ')}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Ward Number</p>
                                        <p className="font-medium">Ward {selectedWorker.ward_number}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Employment Type</p>
                                        <p className="font-medium capitalize">{selectedWorker.employment_type}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Status</p>
                                        {getStatusBadge(selectedWorker.verification_status)}
                                    </div>
                                </div>
                            </div>

                            {/* ID Proof */}
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-3">ID Verification</h3>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-sm text-gray-500">ID Type</p>
                                        <p className="font-medium uppercase">{selectedWorker.id_proof_type}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">ID Number</p>
                                        <p className="font-medium">{selectedWorker.id_proof_number}</p>
                                    </div>
                                </div>
                                {selectedWorker.id_proof_image_url && (
                                    <div className="border border-gray-200 rounded-lg p-4">
                                        <img
                                            src={selectedWorker.id_proof_image_url}
                                            alt="ID Proof"
                                            className="max-w-full h-auto max-h-64 mx-auto rounded"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Rejection Reason Input */}
                            {selectedWorker.verification_status === 'pending' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Rejection Reason (required if rejecting)
                                    </label>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Enter reason for rejection..."
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        rows={3}
                                    />
                                </div>
                            )}

                            {/* Previous Rejection Reason */}
                            {selectedWorker.verification_status === 'rejected' && selectedWorker.rejection_reason && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <p className="text-sm font-medium text-red-700">Rejection Reason:</p>
                                    <p className="text-red-600">{selectedWorker.rejection_reason}</p>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        {selectedWorker.verification_status === 'pending' && (
                            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
                                <button
                                    onClick={() => handleVerify('rejected')}
                                    disabled={actionLoading}
                                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    <XCircle className="w-4 h-4" />
                                    Reject
                                </button>
                                <button
                                    onClick={() => handleVerify('approved')}
                                    disabled={actionLoading}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Approve
                                </button>
                            </div>
                        )}

                        {selectedWorker.verification_status === 'approved' && (
                            <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
                                <button
                                    onClick={() => handleVerify('suspended')}
                                    disabled={actionLoading}
                                    className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    <AlertTriangle className="w-4 h-4" />
                                    Suspend Worker
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
