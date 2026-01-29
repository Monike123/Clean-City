// SLA Calculator Service
// Calculates deadlines and checks for SLA breaches

import { SLA_CONFIG, SeverityLevel } from '../constants/hierarchy';

export class SLACalculator {
    /**
     * Calculate SLA deadline based on severity
     */
    static calculateDeadline(submittedAt: string | Date, severity: string): Date {
        const severityKey = this.mapSeverity(severity);
        const config = SLA_CONFIG[severityKey];
        const submitted = new Date(submittedAt);
        return new Date(submitted.getTime() + config.resolutionDays * 24 * 60 * 60 * 1000);
    }

    /**
     * Map report severity to SLA severity
     */
    private static mapSeverity(severity: string): SeverityLevel {
        const upper = severity?.toUpperCase() || 'MEDIUM';
        if (upper === 'CRITICAL' || upper === 'EMERGENCY') return 'CRITICAL';
        if (upper === 'HIGH' || upper === 'URGENT') return 'HIGH';
        if (upper === 'LOW' || upper === 'NORMAL') return 'LOW';
        return 'MEDIUM';
    }

    /**
     * Check if SLA has been breached
     */
    static hasBreached(slaDeadline: string | Date): boolean {
        const deadline = new Date(slaDeadline);
        return new Date() > deadline;
    }

    /**
     * Get hours remaining until deadline
     */
    static getHoursRemaining(slaDeadline: string | Date): number {
        const deadline = new Date(slaDeadline);
        const now = new Date();
        const diff = deadline.getTime() - now.getTime();
        return Math.floor(diff / (1000 * 60 * 60));
    }

    /**
     * Get progress percentage (0-100)
     */
    static getProgress(submittedAt: string | Date, slaDeadline: string | Date): number {
        const submitted = new Date(submittedAt).getTime();
        const deadline = new Date(slaDeadline).getTime();
        const now = new Date().getTime();

        const total = deadline - submitted;
        const elapsed = now - submitted;

        if (total <= 0) return 100;
        const progress = (elapsed / total) * 100;
        return Math.min(Math.max(0, progress), 100);
    }

    /**
     * Check if in warning zone (approaching deadline)
     */
    static isInWarningZone(slaDeadline: string | Date, severity: string): boolean {
        const severityKey = this.mapSeverity(severity);
        const config = SLA_CONFIG[severityKey];
        const hoursRemaining = this.getHoursRemaining(slaDeadline);
        return hoursRemaining > 0 && hoursRemaining <= config.warningHours;
    }

    /**
     * Get human-readable time remaining
     */
    static getTimeRemainingText(slaDeadline: string | Date): string {
        const hours = this.getHoursRemaining(slaDeadline);

        if (hours < 0) {
            const overdue = Math.abs(hours);
            if (overdue >= 24) {
                return `Overdue by ${Math.floor(overdue / 24)} days`;
            }
            return `Overdue by ${overdue} hours`;
        }

        if (hours < 24) {
            return `${hours} hours remaining`;
        }

        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        if (remainingHours > 0) {
            return `${days}d ${remainingHours}h remaining`;
        }
        return `${days} days remaining`;
    }

    /**
     * Get status color based on progress
     */
    static getStatusColor(slaDeadline: string | Date, severity: string): string {
        if (this.hasBreached(slaDeadline)) return '#EF4444'; // Red
        if (this.isInWarningZone(slaDeadline, severity)) return '#F59E0B'; // Amber
        return '#10B981'; // Green
    }
}
