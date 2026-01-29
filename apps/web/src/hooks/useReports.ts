import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { WasteReportResponse, KPIStats, ReportStatus } from '../types/index';

export function useReports() {
    const [reports, setReports] = useState<WasteReportResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<KPIStats>({
        total: 0,
        pending: 0,
        resolved: 0,
        highRisk: 0,
    });

    useEffect(() => {
        fetchReports();

        // Realtime Subscription
        const channel = supabase
            .channel('dashboard-reports')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
                fetchReports(); // Refresh on any change
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchReports = async () => {
        try {
            // 1. Check Local Cache First (Optimization)
            const cached = localStorage.getItem('reports_cache');
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                // Valid for 1 hour
                if (Date.now() - timestamp < 3600000) {
                    // Set initial data from cache instantly
                    if (reports.length === 0) {
                        const typed = data as WasteReportResponse[];
                        setReports(typed);
                        calculateStats(typed);
                        setLoading(false);
                    }
                }
            }

            // Fetch select fields, excluding image_url which is removed
            const { data, error } = await supabase
                .from('reports')
                .select('id, user_id, media_file, media_type, location, waste_category, status, severity, created_at, description')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const typedReports = (data || []) as WasteReportResponse[];
            setReports(typedReports);
            calculateStats(typedReports);

            // 2. Update Cache (exclude media_file to prevent quota errors)
            const cacheData = typedReports.map(r => ({
                ...r,
                media_file: undefined, // Don't cache images - too large
            }));
            try {
                localStorage.setItem('reports_cache', JSON.stringify({
                    data: cacheData,
                    timestamp: Date.now()
                }));
            } catch (e) {
                console.warn('Failed to cache reports (quota exceeded):', e);
                // Clear old cache and try again with less data
                localStorage.removeItem('reports_cache');
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data: WasteReportResponse[]) => {
        const stats: KPIStats = {
            total: data.length,
            pending: data.filter(r => r.status === 'OPEN' || r.status === 'IN_PROGRESS').length,
            resolved: data.filter(r => r.status === 'RESOLVED').length,
            highRisk: data.filter(r => r.severity === 'HIGH' || r.severity === 'CRITICAL').length,
        };
        setStats(stats);
    };

    const updateStatus = async (id: string, newStatus: ReportStatus) => {
        try {
            const { error } = await supabase
                .from('reports')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;
            // Realtime will trigger refresh, but we can optimistically update too if needed
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    return { reports, stats, loading, updateStatus };
}
