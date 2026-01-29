import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
    Users, Search, Filter, CheckCircle, XCircle, Clock,
    MapPin, Phone, Mail, Award, BarChart2, Star, ChevronRight,
    UserCheck, UserX, AlertTriangle
} from "lucide-react";

interface Worker {
    id: string;
    user_id: string;
    full_name: string;
    phone_number: string;
    employee_id: string;
    department: string;
    ward_number: number;
    is_active: boolean;
    is_available: boolean;
    total_tasks_assigned: number;
    total_tasks_completed: number;
    average_quality_score: number;
    created_at: string;
}

export default function TeamPanel() {
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
    const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        available: 0,
        avgCompletionRate: 0
    });

    useEffect(() => {
        fetchWorkers();
    }, []);

    const fetchWorkers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('workers')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) {
            setWorkers(data);

            // Calculate stats
            const active = data.filter(w => w.is_active).length;
            const available = data.filter(w => w.is_available && w.is_active).length;
            const totalCompleted = data.reduce((sum, w) => sum + (w.total_tasks_completed || 0), 0);
            const totalAssigned = data.reduce((sum, w) => sum + (w.total_tasks_assigned || 0), 0);

            setStats({
                total: data.length,
                active,
                available,
                avgCompletionRate: totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0
            });
        }
        setLoading(false);
    };

    const filteredWorkers = workers.filter(worker => {
        const matchesSearch =
            worker.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            worker.employee_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            worker.department?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesFilter =
            filterStatus === "all" ||
            (filterStatus === "active" && worker.is_active) ||
            (filterStatus === "inactive" && !worker.is_active);

        return matchesSearch && matchesFilter;
    });

    const getRankBadge = (completed: number) => {
        if (completed >= 100) return { label: "Diamond", color: "bg-cyan-100 text-cyan-700" };
        if (completed >= 50) return { label: "Platinum", color: "bg-purple-100 text-purple-700" };
        if (completed >= 25) return { label: "Gold", color: "bg-yellow-100 text-yellow-700" };
        if (completed >= 10) return { label: "Silver", color: "bg-gray-100 text-gray-700" };
        return { label: "Bronze", color: "bg-orange-100 text-orange-700" };
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Team Panel</h1>
                    <p className="text-gray-500">Manage and monitor field workers</p>
                </div>
                <Button className="bg-green-600 hover:bg-green-700">
                    <Users className="w-4 h-4 mr-2" />
                    Export Team Report
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Workers</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Active Workers</p>
                                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                            </div>
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <UserCheck className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Available Now</p>
                                <p className="text-2xl font-bold text-blue-600">{stats.available}</p>
                            </div>
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Clock className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Completion Rate</p>
                                <p className="text-2xl font-bold text-purple-600">{stats.avgCompletionRate}%</p>
                            </div>
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <BarChart2 className="w-5 h-5 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters */}
            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, employee ID, or department..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-400" />
                            <select
                                className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as "all" | "active" | "inactive")}
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active Only</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Workers Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Field Workers ({filteredWorkers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                        </div>
                    ) : filteredWorkers.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No workers found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Worker</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Employee ID</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Department</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Ward</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Tasks</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Rank</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Quality</th>
                                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredWorkers.map((worker) => {
                                        const rank = getRankBadge(worker.total_tasks_completed || 0);
                                        return (
                                            <tr key={worker.id} className="border-b border-gray-50 hover:bg-gray-50">
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                                                            {worker.full_name?.charAt(0) || "W"}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">{worker.full_name}</p>
                                                            <p className="text-xs text-gray-500">{worker.phone_number}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className="font-mono text-sm text-gray-700">{worker.employee_id}</span>
                                                </td>
                                                <td className="py-4 px-4 text-sm text-gray-700">{worker.department || "—"}</td>
                                                <td className="py-4 px-4 text-sm text-gray-700">Ward {worker.ward_number || "—"}</td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-2">
                                                        {worker.is_active ? (
                                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                                Active
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100">
                                                                <XCircle className="w-3 h-3 mr-1" />
                                                                Inactive
                                                            </Badge>
                                                        )}
                                                        {worker.is_available && worker.is_active && (
                                                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="text-sm">
                                                        <span className="font-medium text-gray-900">{worker.total_tasks_completed || 0}</span>
                                                        <span className="text-gray-400"> / {worker.total_tasks_assigned || 0}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <Badge className={`${rank.color} hover:${rank.color}`}>
                                                        <Award className="w-3 h-3 mr-1" />
                                                        {rank.label}
                                                    </Badge>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-1">
                                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                        <span className="text-sm font-medium">{worker.average_quality_score?.toFixed(1) || "—"}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSelectedWorker(worker)}
                                                    >
                                                        <ChevronRight className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Worker Detail Modal */}
            {selectedWorker && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedWorker(null)}>
                    <div className="bg-white rounded-xl p-6 w-[500px] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Worker Details</h2>
                            <button onClick={() => setSelectedWorker(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                {selectedWorker.full_name?.charAt(0) || "W"}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{selectedWorker.full_name}</h3>
                                <p className="text-sm text-gray-500">ID: {selectedWorker.employee_id}</p>
                                <Badge className={getRankBadge(selectedWorker.total_tasks_completed || 0).color}>
                                    <Award className="w-3 h-3 mr-1" />
                                    {getRankBadge(selectedWorker.total_tasks_completed || 0).label}
                                </Badge>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-xs text-gray-500 mb-1">Department</p>
                                <p className="font-medium">{selectedWorker.department || "—"}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-xs text-gray-500 mb-1">Ward Number</p>
                                <p className="font-medium">Ward {selectedWorker.ward_number || "—"}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-xs text-gray-500 mb-1">Phone</p>
                                <p className="font-medium">{selectedWorker.phone_number}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-xs text-gray-500 mb-1">Join Date</p>
                                <p className="font-medium">{new Date(selectedWorker.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-4">
                            <h4 className="font-medium text-gray-900 mb-3">Performance</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">{selectedWorker.total_tasks_completed || 0}</p>
                                    <p className="text-xs text-gray-500">Completed</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">{selectedWorker.total_tasks_assigned || 0}</p>
                                    <p className="text-xs text-gray-500">Assigned</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-yellow-600">{selectedWorker.average_quality_score?.toFixed(1) || "—"}</p>
                                    <p className="text-xs text-gray-500">Avg Quality</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
