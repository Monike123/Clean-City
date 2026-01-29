import { supabase } from '../lib/supabase';
import { decode } from 'base64-arraybuffer';
import { WasteReportRequest } from '../types';

// Helper to generate unique ID
const uuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const ReportService = {
    uploadImage: async (base64Image: string, userId: string): Promise<string | null> => {
        try {
            const fileName = `${userId}/${Date.now()}.jpg`;

            const { data, error } = await supabase.storage
                .from('reports') // Ensure this bucket exists in Supabase
                .upload(fileName, decode(base64Image), {
                    contentType: 'image/jpeg',
                    upsert: false
                });

            if (error) {
                console.error('Upload Error:', error);
                return null;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('reports')
                .getPublicUrl(fileName);

            return publicUrl;
        } catch (e) {
            console.error('Upload Exception:', e);
            return null;
        }
    },

    createReport: async (reportData: any) => {
        try {
            const { data, error } = await supabase
                .from('reports') // Ensure this table exists
                .insert([reportData])
                .select()
                .single();

            if (error) {
                console.error('Insert Error:', error);
                throw error;
            }
            return data;
        } catch (e) {
            console.error('Create Report Exception:', e);
            throw e;
        }
    },

    getUserReports: async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('reports')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (e) {
            console.error('Get User Reports Error:', e);
            return [];
        }
    },

    getReportById: async (id: string) => {
        try {
            const { data, error } = await supabase
                .from('reports')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (e) {
            console.error('Get Report Error:', e);
            return null;
        }
    },

    getAllReports: async () => {
        try {
            const { data, error } = await supabase
                .from('reports')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (e) {
            console.error('Get All Reports Error:', e);
            return [];
        }
    }
};
