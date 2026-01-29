export enum UserRole {
    CITIZEN = 'citizen',
    ADMIN = 'admin',
    AUTHORITY = 'authority'
}

export interface UserProfile {
    id: string;
    email: string;
    full_name?: string;
    mobile_no?: number;
    aadhar_no?: number;
    avatar_url?: string;
    role?: UserRole;
    eco_points: number;
    created_at?: string;
}

export interface WasteReportRequest {
    user_id: string;
    image_url: string;
    location: {
        latitude: number;
        longitude: number;
        address: string;
    };
    waste_category: string;
    ai_confidence_score: number;
    description: string;
    status: string;
    severity: string;
    metadata?: Record<string, any>;
}
