
import { supabase } from '../lib/supabase';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, FileText, Map as MapIcon, BarChart3, Shield, ClipboardList, Users, Bot } from 'lucide-react';

export default function DashboardLayout() {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-primary text-gray-900">Clear City</h2>
                    <p className="text-xs text-gray-500 mt-1">Authority Console</p>
                </div>
                <nav className="mt-6 px-4 space-y-2">
                    <Link to="/dashboard" className={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${isActive('/dashboard') ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <LayoutDashboard size={20} className="mr-3" />
                        Overview
                    </Link>
                    <Link to="/dashboard/reports" className={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${isActive('/dashboard/reports') ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <FileText size={20} className="mr-3" />
                        Reports
                    </Link>
                    <Link to="/dashboard/map" className={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${isActive('/dashboard/map') ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <MapIcon size={20} className="mr-3" />
                        Live Map
                    </Link>
                    <Link to="/dashboard/audit" className={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${isActive('/dashboard/audit') ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                        <BarChart3 size={20} className="mr-3" />
                        Audit & Analytics
                    </Link>

                    {/* AI Automation Section */}
                    <div className="pt-4 mt-4 border-t border-gray-100">
                        <p className="px-4 text-xs font-semibold text-gray-400 uppercase mb-2">AI Surveillance</p>
                        <Link to="/dashboard/ai-automation" className={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${isActive('/dashboard/ai-automation') ? 'bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                            <Bot size={20} className="mr-3" />
                            AI Automation
                        </Link>
                    </div>

                    {/* Worker Management Section */}
                    <div className="pt-4 mt-4 border-t border-gray-100">
                        <p className="px-4 text-xs font-semibold text-gray-400 uppercase mb-2">Worker Management</p>
                        <Link to="/dashboard/team" className={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${isActive('/dashboard/team') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                            <Users size={20} className="mr-3" />
                            Team Panel
                        </Link>
                        <Link to="/dashboard/workers" className={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${isActive('/dashboard/workers') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                            <Shield size={20} className="mr-3" />
                            Verification
                        </Link>
                        <Link to="/dashboard/tasks" className={`flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${isActive('/dashboard/tasks') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                            <ClipboardList size={20} className="mr-3" />
                            Task Assignment
                        </Link>
                    </div>
                </nav>
                <div className="absolute bottom-0 w-64 p-4 border-t border-gray-100 bg-white">
                    <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors">
                        <LogOut size={20} className="mr-3" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto">
                <Outlet />
            </div>
        </div>
    );
}
