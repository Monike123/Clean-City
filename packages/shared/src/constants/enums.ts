export enum UserRole {
    CITIZEN = 'citizen',
    ADMIN = 'admin',
    AUTHORITY = 'authority',
}

export enum ReportStatus {
    SUBMITTED = 'submitted',
    VERIFIED = 'verified',
    IN_PROGRESS = 'in_progress',
    RESOLVED = 'resolved',
    REJECTED = 'rejected',
}

export enum SeverityLevel {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}

export enum WasteCategory {
    ORGANIC = 'organic',
    RECYCLABLE = 'recyclable',
    HAZARDOUS = 'hazardous',
    CONSTRUCTION = 'construction',
    MIXED = 'mixed',
}
