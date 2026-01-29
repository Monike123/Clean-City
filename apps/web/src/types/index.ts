export type ReportStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'SCHEDULED' | 'REJECTED';
export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type WasteCategory = 'ORGANIC' | 'PLASTIC' | 'METAL' | 'HAZARDOUS' | 'ELECTRONIC' | 'PAPER' | 'OTHER';

export interface WasteReportResponse {
    id: string;
    user_id: string;
    image_url?: string;
    media_file?: string; // Base64
    media_type?: 'image' | 'video';
    location: {
        latitude: number;
        longitude: number;
        address: string;
    };
    waste_category: WasteCategory;
    ai_confidence_score?: number;
    description?: string;
    status: ReportStatus;
    severity: SeverityLevel;
    metadata?: Record<string, any>;
    created_at: string;
    updated_at: string;

    // Detailed Fields
    urgency_level?: string;
    size_estimation?: string;
    duration_presence?: string;
    hazard_indicators?: string[];
    impact_details?: string;
    location_context?: string;
    recurring_status?: boolean;
    accessibility_block?: boolean;
    affected_population?: number;
    animal_hazard?: boolean;
    water_impact_details?: string;

    // Admin Fields
    resolution_proof_url?: string;
    resolution_notes?: string;
    rejection_reason?: string;
    scheduled_date?: string;
    assigned_team?: string;
}

export interface KPIStats {
    total: number;
    pending: number;
    resolved: number;
    highRisk: number;
}
