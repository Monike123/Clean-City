export enum UserRole {
    CITIZEN = 'citizen',
    WORKER = 'worker',
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

// Worker-specific profile
export interface WorkerProfile {
    id: string;
    user_id: string;
    full_name: string;
    phone_number: string;
    email?: string;
    employee_id: string;
    ward_number: string;
    department: 'sanitation' | 'waste_management' | 'environment' | 'maintenance';
    id_proof_type: 'aadhar' | 'pan' | 'voter_id' | 'driving_license';
    id_proof_number: string;
    id_proof_image_url?: string;
    employment_type: 'permanent' | 'contract' | 'temporary';
    verification_status: 'pending' | 'approved' | 'rejected' | 'suspended';
    verified_at?: string;
    rejection_reason?: string;
    // Performance
    total_tasks_completed: number;
    total_tasks_assigned: number;
    average_rating: number;
    sla_compliance_rate: number;
    total_points: number;
    worker_rank: 'bronze' | 'silver' | 'gold' | 'platinum';
    current_streak: number;
    is_active: boolean;
    is_available: boolean;
    created_at: string;
}

// Worker Task
export interface WorkerTask {
    id: string;
    report_id: string;
    worker_id: string;
    task_status: 'assigned' | 'in_progress' | 'resolved_pending' | 'resolved' | 'rejected';
    priority: 'low' | 'medium' | 'high' | 'critical';
    sla_deadline: string;
    assignment_notes?: string;
    resolution_proof_images?: string[];
    resolution_notes?: string;
    resolved_at?: string;
    sla_breached: boolean;
    points_awarded: number;
    assigned_at: string;
    // Joined report data
    report?: {
        id: string;
        location: { latitude: number; longitude: number; address?: string };
        waste_category: string;
        severity: string;
        description: string;
        media_file?: string;
        created_at: string;
    };
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

export interface WasteReportResponse extends WasteReportRequest {
    id: string;
    created_at: string;
    updated_at?: string;
    media_file?: string;
    media_type?: string;
}

