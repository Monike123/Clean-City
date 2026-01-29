// Hierarchy Escalation Constants
// All Mumbai ward contacts and central authorities

export type EscalationLevel = 'FIELD_UNIT' | 'WARD' | 'BMC' | 'CHIEF_ENGINEER' | 'MPCB' | 'NGT';
export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface HierarchyContact {
    level: EscalationLevel;
    wardCode?: string;
    name: string;
    designation: string;
    area?: string;
    email: string;
    phone: string;
    whatsapp?: string;
    tollNumber?: string;
    address: string;
    workingHours: string;
    workingDays: string;
}

export interface SLAConfig {
    severity: SeverityLevel;
    resolutionDays: number;
    warningHours: number;
    checkIntervalHours: number;
}

// SLA Configuration by severity
export const SLA_CONFIG: Record<SeverityLevel, SLAConfig> = {
    LOW: { severity: 'LOW', resolutionDays: 7, warningHours: 24, checkIntervalHours: 12 },
    MEDIUM: { severity: 'MEDIUM', resolutionDays: 5, warningHours: 12, checkIntervalHours: 6 },
    HIGH: { severity: 'HIGH', resolutionDays: 3, warningHours: 8, checkIntervalHours: 4 },
    CRITICAL: { severity: 'CRITICAL', resolutionDays: 2, warningHours: 6, checkIntervalHours: 2 },
};

// Escalation chain - time before moving to next level
export const ESCALATION_CHAIN: Record<EscalationLevel, { next: EscalationLevel | null; delayHours: number }> = {
    FIELD_UNIT: { next: 'WARD', delayHours: 0 },
    WARD: { next: 'BMC', delayHours: 48 },
    BMC: { next: 'CHIEF_ENGINEER', delayHours: 48 },
    CHIEF_ENGINEER: { next: 'MPCB', delayHours: 72 },
    MPCB: { next: 'NGT', delayHours: 96 },
    NGT: { next: null, delayHours: 0 },
};

// Level display names
export const LEVEL_NAMES: Record<EscalationLevel, string> = {
    FIELD_UNIT: 'Field Worker',
    WARD: 'Ward Office',
    BMC: 'BMC Central',
    CHIEF_ENGINEER: 'Chief Engineer (SWM)',
    MPCB: 'Pollution Control Board',
    NGT: 'National Green Tribunal',
};

// Ward contacts (Level 1)
export const WARD_CONTACTS: HierarchyContact[] = [
    // City Wards (South Mumbai)
    { level: 'WARD', wardCode: 'A', name: 'Ward A Office', designation: 'Assistant Commissioner', area: 'Colaba/Fort', email: 'ac.a@mcgm.gov.in', phone: '1916', tollNumber: '1916', address: '134 E, SBS Road, Fort, Mumbai 400001', workingHours: '10:00 AM - 6:00 PM', workingDays: 'Monday - Saturday' },
    { level: 'WARD', wardCode: 'B', name: 'Ward B Office', designation: 'Assistant Commissioner', area: 'Sandhurst Rd', email: 'ac.b@mcgm.gov.in', phone: '1916', tollNumber: '1916', address: '121, Ramchandra Bhatt Marg, Mumbai 400009', workingHours: '10:00 AM - 6:00 PM', workingDays: 'Monday - Saturday' },
    { level: 'WARD', wardCode: 'C', name: 'Ward C Office', designation: 'Assistant Commissioner', area: 'Marine Lines', email: 'ac.c@mcgm.gov.in', phone: '1916', tollNumber: '1916', address: '76, Shrikant Palekar Marg, Mumbai 400002', workingHours: '10:00 AM - 6:00 PM', workingDays: 'Monday - Saturday' },
    { level: 'WARD', wardCode: 'D', name: 'Ward D Office', designation: 'Assistant Commissioner', area: 'Grant Rd', email: 'ac.d@mcgm.gov.in', phone: '1916', tollNumber: '1916', address: 'Jobanputra Compound, Grant Road W, Mumbai 400007', workingHours: '10:00 AM - 6:00 PM', workingDays: 'Monday - Saturday' },
    { level: 'WARD', wardCode: 'E', name: 'Ward E Office', designation: 'Assistant Commissioner', area: 'Byculla', email: 'ac.e@mcgm.gov.in', phone: '1916', tollNumber: '1916', address: '10, Shaikh Hafizuddin Marg, Mumbai 400008', workingHours: '10:00 AM - 6:00 PM', workingDays: 'Monday - Saturday' },
    { level: 'WARD', wardCode: 'F/S', name: 'Ward F/South Office', designation: 'Assistant Commissioner', area: 'Parel', email: 'ac.fs@mcgm.gov.in', phone: '1916', tollNumber: '1916', address: 'Dr. Ambedkar Road, Parel, Mumbai 400012', workingHours: '10:00 AM - 6:00 PM', workingDays: 'Monday - Saturday' },
    { level: 'WARD', wardCode: 'F/N', name: 'Ward F/North Office', designation: 'Assistant Commissioner', area: 'Matunga', email: 'ac.fn@mcgm.gov.in', phone: '1916', tollNumber: '1916', address: '96, Bhau Daji Road, Matunga E, Mumbai 400019', workingHours: '10:00 AM - 6:00 PM', workingDays: 'Monday - Saturday' },
    { level: 'WARD', wardCode: 'G/S', name: 'Ward G/South Office', designation: 'Assistant Commissioner', area: 'Worli', email: 'ac.gs@mcgm.gov.in', phone: '1916', tollNumber: '1916', address: 'Dhanmill Naka, Elphinstone Rd W, Mumbai 400013', workingHours: '10:00 AM - 6:00 PM', workingDays: 'Monday - Saturday' },
    { level: 'WARD', wardCode: 'G/N', name: 'Ward G/North Office', designation: 'Assistant Commissioner', area: 'Dadar', email: 'ac.gn@mcgm.gov.in', phone: '1916', tollNumber: '1916', address: 'Harishchandra Yelve Marg, Dadar W, Mumbai 400028', workingHours: '10:00 AM - 6:00 PM', workingDays: 'Monday - Saturday' },
    // Western Suburbs
    { level: 'WARD', wardCode: 'H/E', name: 'Ward H/East Office', designation: 'Assistant Commissioner', area: 'Santacruz', email: 'ac.he@mcgm.gov.in', phone: '1916', tollNumber: '1916', address: 'Plot 137, Prabhat Colony, Santacruz E, Mumbai 400055', workingHours: '10:00 AM - 6:00 PM', workingDays: 'Monday - Saturday' },
    { level: 'WARD', wardCode: 'H/W', name: 'Ward H/West Office', designation: 'Assistant Commissioner', area: 'Bandra', email: 'ac.hw@mcgm.gov.in', phone: '1916', tollNumber: '1916', address: 'St. Martin Road, Bandra W, Mumbai 400050', workingHours: '10:00 AM - 6:00 PM', workingDays: 'Monday - Saturday' },
    { level: 'WARD', wardCode: 'K/E', name: 'Ward K/East Office', designation: 'Assistant Commissioner', area: 'Andheri E', email: 'ac.ke@mcgm.gov.in', phone: '1916', tollNumber: '1916', address: 'Azad Road, Gundavali, Andheri E, Mumbai 400069', workingHours: '10:00 AM - 6:00 PM', workingDays: 'Monday - Saturday' },
    { level: 'WARD', wardCode: 'K/W', name: 'Ward K/West Office', designation: 'Assistant Commissioner', area: 'Andheri W', email: 'ac.kw@mcgm.gov.in', phone: '1916', tollNumber: '1916', address: 'Paliram Road, Andheri W, Mumbai 400058', workingHours: '10:00 AM - 6:00 PM', workingDays: 'Monday - Saturday' },
    { level: 'WARD', wardCode: 'P/S', name: 'Ward P/South Office', designation: 'Assistant Commissioner', area: 'Goregaon', email: 'ac.ps@mcgm.gov.in', phone: '1916', tollNumber: '1916', address: 'CTS 746, Goregaon W, Mumbai 400104', workingHours: '10:00 AM - 6:00 PM', workingDays: 'Monday - Saturday' },
    { level: 'WARD', wardCode: 'P/N', name: 'Ward P/North Office', designation: 'Assistant Commissioner', area: 'Malad', email: 'ac.pn@mcgm.gov.in', phone: '1916', tollNumber: '1916', address: 'Liberty Garden, Malad W, Mumbai 400064', workingHours: '10:00 AM - 6:00 PM', workingDays: 'Monday - Saturday' },
    { level: 'WARD', wardCode: 'R/S', name: 'Ward R/South Office', designation: 'Assistant Commissioner', area: 'Kandivali', email: 'ac.rs@mcgm.gov.in', phone: '1916', tollNumber: '1916', address: 'M.G. Cross Road No. 2, Kandivali W, Mumbai 400067', workingHours: '10:00 AM - 6:00 PM', workingDays: 'Monday - Saturday' },
    { level: 'WARD', wardCode: 'R/N', name: 'Ward R/North Office', designation: 'Assistant Commissioner', area: 'Dahisar', email: 'ac.rn@mcgm.gov.in', phone: '1916', tollNumber: '1916', address: 'Sudhir Phadke Bridge, Dahisar W, Mumbai 400068', workingHours: '10:00 AM - 6:00 PM', workingDays: 'Monday - Saturday' },
    { level: 'WARD', wardCode: 'R/C', name: 'Ward R/Central Office', designation: 'Assistant Commissioner', area: 'Borivali', email: 'ac.rc@mcgm.gov.in', phone: '1916', tollNumber: '1916', address: 'Chandavarkar Road, Borivali W, Mumbai 400092', workingHours: '10:00 AM - 6:00 PM', workingDays: 'Monday - Saturday' },
    // Eastern Suburbs
    { level: 'WARD', wardCode: 'L', name: 'Ward L Office', designation: 'Assistant Commissioner', area: 'Kurla', email: 'ac.l@mcgm.gov.in', phone: '1916', tollNumber: '1916', address: 'L.Y. Market Bldg, Kurla W, Mumbai 400070', workingHours: '10:00 AM - 6:00 PM', workingDays: 'Monday - Saturday' },
    { level: 'WARD', wardCode: 'M/E', name: 'Ward M/East Office', designation: 'Assistant Commissioner', area: 'Govandi', email: 'ac.me@mcgm.gov.in', phone: '1916', tollNumber: '1916', address: 'M.T. Kadam Marg, Govandi, Mumbai 400043', workingHours: '10:00 AM - 6:00 PM', workingDays: 'Monday - Saturday' },
    { level: 'WARD', wardCode: 'M/W', name: 'Ward M/West Office', designation: 'Assistant Commissioner', area: 'Chembur', email: 'ac.mw@mcgm.gov.in', phone: '1916', tollNumber: '1916', address: 'Sharadbhau Acharya Marg, Chembur, Mumbai 400071', workingHours: '10:00 AM - 6:00 PM', workingDays: 'Monday - Saturday' },
    { level: 'WARD', wardCode: 'N', name: 'Ward N Office', designation: 'Assistant Commissioner', area: 'Ghatkopar', email: 'ac.n@mcgm.gov.in', phone: '1916', tollNumber: '1916', address: 'Jawahar Road, Ghatkopar E, Mumbai 400077', workingHours: '10:00 AM - 6:00 PM', workingDays: 'Monday - Saturday' },
    { level: 'WARD', wardCode: 'S', name: 'Ward S Office', designation: 'Assistant Commissioner', area: 'Bhandup', email: 'ac.s@mcgm.gov.in', phone: '1916', tollNumber: '1916', address: 'LBS Marg, Bhandup W, Mumbai 400078', workingHours: '10:00 AM - 6:00 PM', workingDays: 'Monday - Saturday' },
    { level: 'WARD', wardCode: 'T', name: 'Ward T Office', designation: 'Assistant Commissioner', area: 'Mulund', email: 'ac.t@mcgm.gov.in', phone: '1916', tollNumber: '1916', address: 'Lala Devidayal Road, Mulund W, Mumbai 400080', workingHours: '10:00 AM - 6:00 PM', workingDays: 'Monday - Saturday' },
];

// Central authorities (Levels 2-5)
export const CENTRAL_CONTACTS: HierarchyContact[] = [
    { level: 'BMC', name: 'BMC Central Grievance', designation: 'Municipal Commissioner Office', email: 'mc@mcgm.gov.in', phone: '022-22620251', whatsapp: '+918999228999', tollNumber: '1916', address: 'Municipal Corporation Head Office, Fort, Mumbai 400001', workingHours: '10:00 AM - 6:00 PM', workingDays: 'Monday - Saturday' },
    { level: 'CHIEF_ENGINEER', name: 'Chief Engineer - SWM', designation: 'Solid Waste Management', email: 'che.swm@mcgm.gov.in', phone: '022-24945186', address: 'Love Grove Complex, Worli, Mumbai 400018', workingHours: '10:00 AM - 6:00 PM', workingDays: 'Monday - Friday' },
    { level: 'MPCB', name: 'MPCB Mumbai', designation: 'Regional Officer', email: 'romumbai@mpcb.gov.in', phone: '022-24010437', address: 'Kalpataru Point, Sion E, Mumbai 400022', workingHours: '10:00 AM - 5:30 PM', workingDays: 'Monday - Friday' },
    { level: 'NGT', name: 'National Green Tribunal', designation: 'Western Zone Bench', email: 'ngt-pune@gov.in', phone: '020-26140446', address: 'NGT Western Zone, Pune 411001', workingHours: '10:00 AM - 5:00 PM', workingDays: 'Monday - Friday' },
];

// Get contact by ward code
export const getWardContact = (wardCode: string): HierarchyContact | undefined => {
    return WARD_CONTACTS.find(c => c.wardCode === wardCode);
};

// Get contact by level
export const getCentralContact = (level: EscalationLevel): HierarchyContact | undefined => {
    return CENTRAL_CONTACTS.find(c => c.level === level);
};

// Get all contacts for a level
export const getContactsByLevel = (level: EscalationLevel): HierarchyContact[] => {
    if (level === 'WARD') return WARD_CONTACTS;
    return CENTRAL_CONTACTS.filter(c => c.level === level);
};
