import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

type RealtimeCallback = (payload: any) => void;

class RealtimeService {
    private reportChannel: RealtimeChannel | null = null;
    private leaderboardChannel: RealtimeChannel | null = null;

    /**
     * Subscribe to new reports (INSERT events)
     * Useful for Map and Explore page to show new content instantly
     */
    subscribeToNewReports(onInsert: RealtimeCallback) {
        if (this.reportChannel) return;

        console.log('[Realtime] Subscribing to new reports...');
        this.reportChannel = supabase
            .channel('public:reports')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'reports',
                },
                (payload) => {
                    console.log('[Realtime] New report received!', payload.new.id);
                    onInsert(payload.new);
                }
            )
            .subscribe((status) => {
                console.log('[Realtime] Report subscription status:', status);
            });
    }

    /**
     * Subscribe to report updates (UPDATE events)
     * Useful for User's Home page to see status changes (e.g. Verified -> Resolved)
     */
    subscribeToReportUpdates(onUpdate: RealtimeCallback) {
        const channelName = 'public:reports:updates';
        const channel = supabase.channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'reports',
                },
                (payload) => {
                    console.log('[Realtime] Report updated:', payload.new.id);
                    onUpdate(payload.new);
                }
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }

    /**
     * Subscribe to leaderboard/profile updates
     */
    subscribeToLeaderboardUpdates(onUpdate: RealtimeCallback) {
        if (this.leaderboardChannel) return;

        console.log('[Realtime] Subscribing to leaderboard updates...');
        this.leaderboardChannel = supabase
            .channel('public:profiles')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                },
                (payload) => {
                    // Start simplified: Just notify that *something* changed so UI can refetch
                    // or pass the payload if we want to optimistic update
                    console.log('[Realtime] Profile updated:', payload.new.id);
                    onUpdate(payload.new);
                }
            )
            .subscribe();
    }

    /**
     * Unsubscribe from reports
     */
    unsubscribeReports() {
        if (this.reportChannel) {
            console.log('[Realtime] Unsubscribing from reports...');
            supabase.removeChannel(this.reportChannel);
            this.reportChannel = null;
        }
    }

    unsubscribeLeaderboard() {
        if (this.leaderboardChannel) {
            console.log('[Realtime] Unsubscribing from leaderboard...');
            supabase.removeChannel(this.leaderboardChannel);
            this.leaderboardChannel = null;
        }
    }
}

export const realtimeService = new RealtimeService();
