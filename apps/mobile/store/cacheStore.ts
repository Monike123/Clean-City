import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReportService } from '../services/reportService';
import { WasteReportResponse } from '../types';

interface CacheStore {
    reports: WasteReportResponse[];
    userReports: WasteReportResponse[];
    lastUpdated: number;
    userLastUpdated: number;
    loading: boolean;
    fetchReports: (force?: boolean) => Promise<void>;
    fetchUserReports: (userId: string, force?: boolean) => Promise<void>;
}

export const useCacheStore = create<CacheStore>()(
    persist(
        (set, get) => ({
            reports: [],
            userReports: [],
            lastUpdated: 0,
            userLastUpdated: 0,
            loading: false,
            fetchReports: async (force = false) => {
                const now = Date.now();
                const { lastUpdated, reports } = get();
                const ONE_HOUR = 60 * 60 * 1000;

                if (!force && reports.length > 0 && (now - lastUpdated < ONE_HOUR)) return;

                set({ loading: true });
                try {
                    const data = await ReportService.getAllReports();
                    set({ reports: data as any[], lastUpdated: now, loading: false });
                } catch (e) {
                    console.error('Cache Fetch Error (All)', e);
                    set({ loading: false });
                }
            },
            fetchUserReports: async (userId: string, force = false) => {
                const now = Date.now();
                const { userLastUpdated, userReports } = get();
                const ONE_HOUR = 60 * 60 * 1000;

                if (!force && userReports.length > 0 && (now - userLastUpdated < ONE_HOUR)) return;

                set({ loading: true });
                try {
                    const data = await ReportService.getUserReports(userId);
                    set({ userReports: data as any[], userLastUpdated: now, loading: false });
                } catch (e) {
                    console.error('Cache Fetch Error (User)', e);
                    set({ loading: false });
                }
            }
        }),
        {
            name: 'report-cache',
            storage: createJSONStorage(() => ({
                setItem: async (name, value) => {
                    try {
                        await AsyncStorage.setItem(name, value);
                    } catch (e: any) {
                        console.error('Cache Write Error', e);
                        if (e.message?.includes('database or disk is full')) {
                            console.log('Clearing storage to recover space...');
                            await AsyncStorage.clear();
                        }
                    }
                },
                getItem: async (name) => {
                    const value = await AsyncStorage.getItem(name);
                    return value ? JSON.parse(value) : null;
                },
                removeItem: (name) => AsyncStorage.removeItem(name),
            })),
        }
    )
);
