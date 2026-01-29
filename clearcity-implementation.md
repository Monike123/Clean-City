# ClearCity Complaint Escalation System - Implementation Plan

## 1. Architecture Overview

This implementation plan details how to build the complaint resolution and escalation system into your React Native Expo application. The system needs to handle real-time SLA tracking, automatic escalation through government hierarchy, and comprehensive audit logging while maintaining excellent user experience.

### Core Architectural Principles

The implementation follows a layered architecture where concerns are separated into distinct modules. At the foundation, we have the data layer managing complaint state and escalation history. Above that sits the business logic layer containing the escalation engine and SLA calculator. The service layer handles external integrations like notifications and API calls. Finally, the presentation layer renders appropriate UI for both citizens and authorities.

This separation allows the escalation logic to run independently of UI rendering, which is critical since escalation checks need to happen on scheduled intervals regardless of whether users have the app open.

## 2. Technology Stack & Dependencies

### Required npm Packages

```bash
# Core dependencies (already in Expo)
expo-notifications      # Push notifications for escalation alerts
expo-background-fetch   # Background SLA monitoring
expo-task-manager      # Scheduled escalation checks

# State management
@reduxjs/toolkit       # State management for complaints
redux-persist          # Offline-first capability
react-redux

# Date/Time handling
date-fns               # SLA calculations and countdown timers

# Networking
axios                  # API calls to backend
@tanstack/react-query  # Server state management with caching

# Utilities
uuid                   # Generate unique IDs for complaints
lodash                 # Data manipulation utilities
```

### Project Structure

## 3. Type Definitions

Creating strong TypeScript types ensures type safety throughout the escalation system and makes the code self-documenting for the AI agent implementing it.

### Core Type Definitions (complaint.types.ts)

```typescript
// Severity levels with strict typing
export type SeverityLevel = 'NORMAL' | 'URGENT' | 'EMERGENCY';

// Complaint status through its lifecycle
export type ComplaintStatus = 
  | 'SUBMITTED'      // Initial state after user submission
  | 'ASSIGNED'       // Assigned to field worker
  | 'IN_PROGRESS'    // Worker has acknowledged and started
  | 'RESOLVED'       // Marked complete with proof
  | 'ESCALATED'      // Automatically escalated due to SLA breach
  | 'CLOSED';        // Final state after user confirmation

// Government hierarchy levels for escalation
export type EscalationLevel = 
  | 'FIELD_UNIT'     // Level 0: Initial assignment
  | 'WARD'           // Level 1: Ward Assistant Commissioners
  | 'BMC'            // Level 2: Municipal Corporation central
  | 'CHIEF_ENGINEER' // Level 3: Specialized waste management
  | 'MPCB'           // Level 4: Pollution Control Board
  | 'NGT';           // Level 5: National Green Tribunal

// Main complaint data structure
export interface Complaint {
  id: string;                        // UUID
  userId: string;                    // Citizen who filed
  title: string;
  description: string;
  category: ComplaintCategory;       // Waste type
  severity: SeverityLevel;           // AI-determined or manual
  status: ComplaintStatus;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    ward: string;                    // Maps to escalation hierarchy
  };
  images: string[];                  // Image URLs
  submittedAt: string;               // ISO timestamp
  slaDeadline: string;               // Calculated deadline
  assignedTo?: {
    level: EscalationLevel;
    authorityId: string;
    authorityName: string;
    contactInfo: AuthorityContact;
  };
  escalationHistory: EscalationEvent[];
  resolutionProof?: {
    images: string[];
    notes: string;
    resolvedAt: string;
    resolvedBy: string;
  };
}

// Tracks each escalation step
export interface EscalationEvent {
  id: string;
  complaintId: string;
  fromLevel: EscalationLevel;
  toLevel: EscalationLevel;
  escalatedAt: string;              // ISO timestamp
  reason: string;                   // "SLA_BREACH" or "MANUAL_ESCALATION"
  previousAuthority: string;
  newAuthority: string;
  notificationsSent: boolean;
}

// Authority contact information by level
export interface AuthorityContact {
  level: EscalationLevel;
  name: string;
  phone: string;
  email: string;
  whatsapp?: string;
  address?: string;
  ward?: string;                     // For ward-level authorities
}

// SLA configuration per severity
export interface SLAConfig {
  severity: SeverityLevel;
  resolutionDays: number;
  escalationCheckIntervalHours: number;  // How often to check
  warningThresholdHours: number;         // When to send warnings
}

// Notification payload structure
export interface EscalationNotification {
  complaintId: string;
  type: 'SLA_WARNING' | 'ESCALATED' | 'RESOLVED';
  severity: SeverityLevel;
  recipientUserId: string;
  title: string;
  body: string;
  data: Record<string, any>;
}
```

## 4. Constants and Configuration

Centralizing configuration makes the system easy to adjust and maintains single source of truth for business rules.

### SLA Configuration (constants/slaConfig.ts)

```typescript
import { SLAConfig, SeverityLevel } from '../types/complaint.types';

// SLA deadlines matching the specification
export const SLA_CONFIGURATIONS: Record<SeverityLevel, SLAConfig> = {
  NORMAL: {
    severity: 'NORMAL',
    resolutionDays: 7,
    escalationCheckIntervalHours: 12,  // Check twice daily
    warningThresholdHours: 24,         // Warn 1 day before deadline
  },
  URGENT: {
    severity: 'URGENT',
    resolutionDays: 5,
    escalationCheckIntervalHours: 6,   // Check 4 times daily
    warningThresholdHours: 12,         // Warn 12 hours before
  },
  EMERGENCY: {
    severity: 'EMERGENCY',
    resolutionDays: 2,
    escalationCheckIntervalHours: 2,   // Check every 2 hours
    warningThresholdHours: 6,          // Warn 6 hours before
  },
};

// Maps severity to SLA days for quick lookup
export const getSLADays = (severity: SeverityLevel): number => {
  return SLA_CONFIGURATIONS[severity].resolutionDays;
};
```

### Authority Hierarchy (constants/authorityHierarchy.ts)

```typescript
import { EscalationLevel, AuthorityContact } from '../types/complaint.types';

// Escalation chain: each level knows its next escalation target
export const ESCALATION_HIERARCHY: Record<EscalationLevel, {
  level: EscalationLevel;
  nextLevel: EscalationLevel | null;
  escalationDelayHours: number;  // Time before moving to next level
}> = {
  FIELD_UNIT: {
    level: 'FIELD_UNIT',
    nextLevel: 'WARD',
    escalationDelayHours: 0,  // Immediate on SLA breach
  },
  WARD: {
    level: 'WARD',
    nextLevel: 'BMC',
    escalationDelayHours: 48,  // 2 days at ward level
  },
  BMC: {
    level: 'BMC',
    nextLevel: 'CHIEF_ENGINEER',
    escalationDelayHours: 48,
  },
  CHIEF_ENGINEER: {
    level: 'CHIEF_ENGINEER',
    nextLevel: 'MPCB',
    escalationDelayHours: 72,  // 3 days for specialized dept
  },
  MPCB: {
    level: 'MPCB',
    nextLevel: 'NGT',
    escalationDelayHours: 96,  // 4 days before tribunal
  },
  NGT: {
    level: 'NGT',
    nextLevel: null,  // Final escalation level
    escalationDelayHours: 0,
  },
};

// Ward-level authority contacts (based on specification)
export const WARD_AUTHORITIES: Record<string, AuthorityContact> = {
  'A': {
    level: 'WARD',
    name: 'Assistant Commissioner - Ward A',
    phone: '19166',
    email: 'ward.a@mcgm.gov.in',
    ward: 'A',
    address: 'South Mumbai',
  },
  // ... Continue for all wards B, C, D, E, F/South, F/North, etc.
};

// Centralized authority contacts
export const CENTRAL_AUTHORITIES: Record<EscalationLevel, AuthorityContact> = {
  BMC: {
    level: 'BMC',
    name: 'BMC Central Grievance Cell',
    phone: '022-22620251',
    email: 'mc@mcgm.gov.in',
    whatsapp: '+918999228999',
    address: 'Municipal Corporation Head Office',
  },
  CHIEF_ENGINEER: {
    level: 'CHIEF_ENGINEER',
    name: 'Chief Engineer - Solid Waste Management',
    phone: '022-24945186',
    email: 'che.swm@mcgm.gov.in',
    address: 'Love Grove Complex, Worli',
  },
  MPCB: {
    level: 'MPCB',
    name: 'Maharashtra Pollution Control Board',
    phone: '022-24010437',
    email: 'romumbai@mpcb.gov.in',
    address: 'Kalpataru Point, Sion (East)',
  },
  NGT: {
    level: 'NGT',
    name: 'National Green Tribunal - Western Zone',
    phone: '020-26140446',
    email: 'ngt-pune@gov.in',
    address: 'NGT Western Zone Bench, Pune',
  },
};
```

## 5. Core Business Logic - SLA Calculator

The SLA calculator determines deadlines and checks if complaints have breached their timeframes. This is the foundation of the escalation system.

### SLA Calculator Service (services/slaCalculator.ts)

```typescript
import { addDays, addHours, isAfter, differenceInHours } from 'date-fns';
import { Complaint, SeverityLevel } from '../types/complaint.types';
import { SLA_CONFIGURATIONS } from '../constants/slaConfig';

export class SLACalculator {
  /**
   * Calculate the SLA deadline based on submission time and severity.
   * This deadline is when the complaint must be resolved to avoid escalation.
   */
  static calculateDeadline(
    submittedAt: string,
    severity: SeverityLevel
  ): string {
    const submissionDate = new Date(submittedAt);
    const slaConfig = SLA_CONFIGURATIONS[severity];
    
    // Add the resolution days to submission time
    const deadline = addDays(submissionDate, slaConfig.resolutionDays);
    
    return deadline.toISOString();
  }

  /**
   * Check if a complaint has breached its SLA deadline.
   * Returns true if current time is past the deadline and complaint isn't resolved.
   */
  static hasBreachedSLA(complaint: Complaint): boolean {
    // Only unresolved complaints can breach SLA
    if (complaint.status === 'RESOLVED' || complaint.status === 'CLOSED') {
      return false;
    }

    const now = new Date();
    const deadline = new Date(complaint.slaDeadline);
    
    return isAfter(now, deadline);
  }

  /**
   * Calculate how many hours remain until SLA deadline.
   * Negative value means deadline has passed.
   */
  static getHoursUntilDeadline(complaint: Complaint): number {
    const now = new Date();
    const deadline = new Date(complaint.slaDeadline);
    
    return differenceInHours(deadline, now);
  }

  /**
   * Check if complaint is in warning zone (approaching deadline).
   * Used to send proactive notifications before escalation.
   */
  static isInWarningZone(complaint: Complaint): boolean {
    const hoursRemaining = this.getHoursUntilDeadline(complaint);
    const slaConfig = SLA_CONFIGURATIONS[complaint.severity];
    
    return hoursRemaining > 0 && 
           hoursRemaining <= slaConfig.warningThresholdHours;
  }

  /**
   * Calculate progress percentage for visual SLA indicators.
   * 0% = just submitted, 100% = deadline reached
   */
  static calculateSLAProgress(complaint: Complaint): number {
    const submittedAt = new Date(complaint.submittedAt);
    const deadline = new Date(complaint.slaDeadline);
    const now = new Date();

    const totalDuration = differenceInHours(deadline, submittedAt);
    const elapsed = differenceInHours(now, submittedAt);

    const progress = (elapsed / totalDuration) * 100;
    
    // Cap at 100% even if overdue
    return Math.min(progress, 100);
  }

  /**
   * Get a human-readable time remaining string.
   */
  static getTimeRemainingText(complaint: Complaint): string {
    const hours = this.getHoursUntilDeadline(complaint);
    
    if (hours < 0) {
      return `Overdue by ${Math.abs(hours)} hours`;
    }
    
    if (hours < 24) {
      return `${hours} hours remaining`;
    }
    
    const days = Math.floor(hours / 24);
    return `${days} days remaining`;
  }
}
```

## 6. Core Business Logic - Escalation Engine

The escalation engine is the heart of the system, automatically promoting complaints through the government hierarchy when SLAs are breached.

### Escalation Engine (services/escalationEngine.ts)

```typescript
import { Complaint, EscalationEvent, EscalationLevel } from '../types/complaint.types';
import { ESCALATION_HIERARCHY, WARD_AUTHORITIES, CENTRAL_AUTHORITIES } from '../constants/authorityHierarchy';
import { SLACalculator } from './slaCalculator';
import { v4 as uuidv4 } from 'uuid';

export class EscalationEngine {
  /**
   * Main escalation check - examines a complaint and escalates if needed.
   * This function should be called periodically by background tasks.
   */
  static async checkAndEscalate(complaint: Complaint): Promise<{
    shouldEscalate: boolean;
    escalationEvent?: EscalationEvent;
  }> {
    // Don't escalate if already resolved or at final level
    if (complaint.status === 'RESOLVED' || complaint.status === 'CLOSED') {
      return { shouldEscalate: false };
    }

    if (complaint.assignedTo?.level === 'NGT') {
      return { shouldEscalate: false };  // Already at highest level
    }

    // Check if SLA has been breached
    const hasBreached = SLACalculator.hasBreachedSLA(complaint);
    
    if (!hasBreached) {
      return { shouldEscalate: false };
    }

    // Check if enough time has passed at current escalation level
    const canEscalateFromLevel = this.canEscalateFromCurrentLevel(complaint);
    
    if (!canEscalateFromLevel) {
      return { shouldEscalate: false };
    }

    // Create escalation event
    const escalationEvent = this.createEscalationEvent(complaint);
    
    return {
      shouldEscalate: true,
      escalationEvent,
    };
  }

  /**
   * Check if enough time has passed at current level to escalate further.
   * Prevents rapid escalation through all levels.
   */
  private static canEscalateFromCurrentLevel(complaint: Complaint): boolean {
    const currentLevel = complaint.assignedTo?.level || 'FIELD_UNIT';
    const hierarchyConfig = ESCALATION_HIERARCHY[currentLevel];
    
    // If at field unit, escalate immediately on SLA breach
    if (currentLevel === 'FIELD_UNIT') {
      return true;
    }

    // Find the last escalation to current level
    const lastEscalation = complaint.escalationHistory
      .filter(e => e.toLevel === currentLevel)
      .sort((a, b) => new Date(b.escalatedAt).getTime() - new Date(a.escalatedAt).getTime())[0];

    if (!lastEscalation) {
      return true;  // No history, allow escalation
    }

    // Check if enough hours have passed
    const hoursSinceEscalation = SLACalculator.getHoursUntilDeadline({
      ...complaint,
      submittedAt: lastEscalation.escalatedAt,
      slaDeadline: new Date(
        new Date(lastEscalation.escalatedAt).getTime() + 
        hierarchyConfig.escalationDelayHours * 60 * 60 * 1000
      ).toISOString(),
    });

    return hoursSinceEscalation <= 0;  // Negative means delay period passed
  }

  /**
   * Creates an escalation event with proper authority assignment.
   */
  private static createEscalationEvent(complaint: Complaint): EscalationEvent {
    const currentLevel = complaint.assignedTo?.level || 'FIELD_UNIT';
    const nextLevel = ESCALATION_HIERARCHY[currentLevel].nextLevel;

    if (!nextLevel) {
      throw new Error('Cannot escalate beyond NGT level');
    }

    const newAuthority = this.getAuthorityForLevel(nextLevel, complaint.location.ward);

    return {
      id: uuidv4(),
      complaintId: complaint.id,
      fromLevel: currentLevel,
      toLevel: nextLevel,
      escalatedAt: new Date().toISOString(),
      reason: 'SLA_BREACH',
      previousAuthority: complaint.assignedTo?.authorityName || 'Unassigned',
      newAuthority: newAuthority.name,
      notificationsSent: false,
    };
  }

  /**
   * Get the appropriate authority contact for a given escalation level.
   * For ward level, uses the complaint's ward location.
   */
  private static getAuthorityForLevel(
    level: EscalationLevel,
    ward: string
  ): typeof CENTRAL_AUTHORITIES[keyof typeof CENTRAL_AUTHORITIES] {
    if (level === 'WARD') {
      return WARD_AUTHORITIES[ward] || WARD_AUTHORITIES['A'];  // Fallback
    }
    
    return CENTRAL_AUTHORITIES[level];
  }

  /**
   * Get next escalation level for a complaint.
   */
  static getNextEscalationLevel(complaint: Complaint): EscalationLevel | null {
    const currentLevel = complaint.assignedTo?.level || 'FIELD_UNIT';
    return ESCALATION_HIERARCHY[currentLevel].nextLevel;
  }

  /**
   * Manually escalate a complaint (e.g., authority decides to escalate).
   */
  static createManualEscalation(
    complaint: Complaint,
    targetLevel: EscalationLevel,
    reason: string
  ): EscalationEvent {
    const currentLevel = complaint.assignedTo?.level || 'FIELD_UNIT';
    const newAuthority = this.getAuthorityForLevel(targetLevel, complaint.location.ward);

    return {
      id: uuidv4(),
      complaintId: complaint.id,
      fromLevel: currentLevel,
      toLevel: targetLevel,
      escalatedAt: new Date().toISOString(),
      reason: `MANUAL_ESCALATION: ${reason}`,
      previousAuthority: complaint.assignedTo?.authorityName || 'Unassigned',
      newAuthority: newAuthority.name,
      notificationsSent: false,
    };
  }
}
```

## 7. State Management with Redux

Redux manages the global state of complaints and their escalation status, enabling the UI to react to changes automatically.

### Complaint Slice (store/complaintSlice.ts)

```typescript
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Complaint, EscalationEvent } from '../types/complaint.types';
import { ComplaintAPI } from '../services/complaintAPI';
import { SLACalculator } from '../services/slaCalculator';

interface ComplaintState {
  complaints: Complaint[];
  selectedComplaint: Complaint | null;
  loading: boolean;
  error: string | null;
  filters: {
    status: string[];
    severity: string[];
  };
}

const initialState: ComplaintState = {
  complaints: [],
  selectedComplaint: null,
  loading: false,
  error: null,
  filters: {
    status: [],
    severity: [],
  },
};

// Async thunks for API operations
export const fetchComplaints = createAsyncThunk(
  'complaints/fetchAll',
  async (userId: string) => {
    const response = await ComplaintAPI.getUserComplaints(userId);
    return response;
  }
);

export const submitComplaint = createAsyncThunk(
  'complaints/submit',
  async (complaintData: Partial<Complaint>) => {
    // Calculate SLA deadline before submission
    const deadline = SLACalculator.calculateDeadline(
      new Date().toISOString(),
      complaintData.severity!
    );

    const complaintWithSLA = {
      ...complaintData,
      slaDeadline: deadline,
    };

    const response = await ComplaintAPI.createComplaint(complaintWithSLA);
    return response;
  }
);

export const escalateComplaint = createAsyncThunk(
  'complaints/escalate',
  async ({ complaintId, escalationEvent }: { 
    complaintId: string; 
    escalationEvent: EscalationEvent;
  }) => {
    const response = await ComplaintAPI.escalateComplaint(complaintId, escalationEvent);
    return response;
  }
);

const complaintSlice = createSlice({
  name: 'complaints',
  initialState,
  reducers: {
    selectComplaint: (state, action: PayloadAction<string>) => {
      state.selectedComplaint = 
        state.complaints.find(c => c.id === action.payload) || null;
    },
    
    updateComplaintStatus: (state, action: PayloadAction<{ 
      id: string; 
      status: Complaint['status'];
    }>) => {
      const complaint = state.complaints.find(c => c.id === action.payload.id);
      if (complaint) {
        complaint.status = action.payload.status;
      }
    },

    addEscalationEvent: (state, action: PayloadAction<{
      complaintId: string;
      event: EscalationEvent;
    }>) => {
      const complaint = state.complaints.find(c => c.id === action.payload.complaintId);
      if (complaint) {
        complaint.escalationHistory.push(action.payload.event);
        complaint.status = 'ESCALATED';
      }
    },

    setFilters: (state, action: PayloadAction<Partial<ComplaintState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
  
  extraReducers: (builder) => {
    builder
      .addCase(fetchComplaints.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComplaints.fulfilled, (state, action) => {
        state.loading = false;
        state.complaints = action.payload;
      })
      .addCase(fetchComplaints.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch complaints';
      })
      .addCase(submitComplaint.fulfilled, (state, action) => {
        state.complaints.unshift(action.payload);
      })
      .addCase(escalateComplaint.fulfilled, (state, action) => {
        const index = state.complaints.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.complaints[index] = action.payload;
        }
      });
  },
});

export const { 
  selectComplaint, 
  updateComplaintStatus, 
  addEscalationEvent,
  setFilters,
} = complaintSlice.actions;

export default complaintSlice.reducer;
```

## 8. Background Task Management

Background tasks ensure the escalation system runs even when the app is closed, checking for SLA breaches on schedule.

### Background Task Setup (services/backgroundTasks.ts)

```typescript
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { ComplaintAPI } from './complaintAPI';
import { EscalationEngine } from './escalationEngine';
import { NotificationService } from './notificationService';

const ESCALATION_CHECK_TASK = 'escalation-check-task';

/**
 * Background task that runs periodically to check for SLA breaches.
 * This ensures complaints are escalated even when user isn't actively using the app.
 */
TaskManager.defineTask(ESCALATION_CHECK_TASK, async () => {
  try {
    console.log('Running escalation check background task...');

    // Fetch all active complaints from server
    const activeComplaints = await ComplaintAPI.getActiveComplaints();

    // Check each complaint for escalation
    for (const complaint of activeComplaints) {
      const { shouldEscalate, escalationEvent } = 
        await EscalationEngine.checkAndEscalate(complaint);

      if (shouldEscalate && escalationEvent) {
        // Escalate the complaint
        await ComplaintAPI.escalateComplaint(complaint.id, escalationEvent);

        // Send notifications
        await NotificationService.sendEscalationNotifications(
          complaint,
          escalationEvent
        );

        console.log(`Escalated complaint ${complaint.id} from ${escalationEvent.fromLevel} to ${escalationEvent.toLevel}`);
      }
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background escalation check failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Register the background fetch task.
 * Call this during app initialization.
 */
export async function registerBackgroundEscalationCheck() {
  try {
    await BackgroundFetch.registerTaskAsync(ESCALATION_CHECK_TASK, {
      minimumInterval: 60 * 60, // Run every hour minimum
      stopOnTerminate: false,    // Continue even after app is closed
      startOnBoot: true,         // Start on device restart
    });

    console.log('Background escalation check registered');
  } catch (error) {
    console.error('Failed to register background task:', error);
  }
}

/**
 * Unregister the background task (for cleanup).
 */
export async function unregisterBackgroundEscalationCheck() {
  await BackgroundFetch.unregisterTaskAsync(ESCALATION_CHECK_TASK);
}
```

## 9. Notification Service

Notifications keep users informed of escalation events and SLA warnings in real-time.

### Notification Service (services/notificationService.ts)

```typescript
import * as Notifications from 'expo-notifications';
import { Complaint, EscalationEvent } from '../types/complaint.types';
import { CENTRAL_AUTHORITIES } from '../constants/authorityHierarchy';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  /**
   * Request notification permissions from user.
   * Call this during app setup.
   */
  static async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  }

  /**
   * Send notification when complaint is escalated.
   * Notifies both the citizen and the new authority.
   */
  static async sendEscalationNotifications(
    complaint: Complaint,
    escalationEvent: EscalationEvent
  ): Promise<void> {
    const authority = CENTRAL_AUTHORITIES[escalationEvent.toLevel];

    // Notify the citizen
    await this.sendNotification({
      title: '⚠️ Complaint Escalated',
      body: `Your complaint has been escalated to ${authority.name} due to resolution delay.`,
      data: {
        complaintId: complaint.id,
        type: 'ESCALATED',
        escalationLevel: escalationEvent.toLevel,
      },
    });

    // Log for authority notification (would be sent via push to authority app)
    console.log(`Authority notification: Complaint ${complaint.id} escalated to ${authority.name}`);
  }

  /**
   * Send warning notification when complaint is approaching SLA deadline.
   */
  static async sendSLAWarningNotification(complaint: Complaint): Promise<void> {
    await this.sendNotification({
      title: '⏰ Resolution Deadline Approaching',
      body: `Your complaint "${complaint.title}" is approaching its resolution deadline.`,
      data: {
        complaintId: complaint.id,
        type: 'SLA_WARNING',
      },
    });
  }

  /**
   * Send notification when complaint is resolved.
   */
  static async sendResolutionNotification(complaint: Complaint): Promise<void> {
    await this.sendNotification({
      title: '✅ Complaint Resolved',
      body: `Your complaint "${complaint.title}" has been marked as resolved.`,
      data: {
        complaintId: complaint.id,
        type: 'RESOLVED',
      },
    });
  }

  /**
   * Core notification sending function.
   */
  private static async sendNotification(options: {
    title: string;
    body: string;
    data: any;
  }): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: options.title,
        body: options.body,
        data: options.data,
        sound: true,
      },
      trigger: null, // Send immediately
    });
  }

  /**
   * Schedule a notification for future delivery.
   * Used for SLA warning reminders.
   */
  static async scheduleNotification(
    options: {
      title: string;
      body: string;
      data: any;
    },
    triggerDate: Date
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: options.title,
        body: options.body,
        data: options.data,
      },
      trigger: triggerDate,
    });
  }
}
```

## 10. Custom React Hooks

Custom hooks encapsulate complex logic and make it reusable across components.

### SLA Timer Hook (hooks/useSLATimer.ts)

```typescript
import { useState, useEffect } from 'react';
import { Complaint } from '../types/complaint.types';
import { SLACalculator } from '../services/slaCalculator';

/**
 * Hook that provides real-time SLA countdown information.
 * Updates every minute to show current progress.
 */
export function useSLATimer(complaint: Complaint) {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [progress, setProgress] = useState(0);
  const [isOverdue, setIsOverdue] = useState(false);
  const [isInWarning, setIsInWarning] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const hours = SLACalculator.getHoursUntilDeadline(complaint);
      const progressPercent = SLACalculator.calculateSLAProgress(complaint);
      const warning = SLACalculator.isInWarningZone(complaint);
      
      setTimeRemaining(SLACalculator.getTimeRemainingText(complaint));
      setProgress(progressPercent);
      setIsOverdue(hours < 0);
      setIsInWarning(warning);
    };

    // Initial update
    updateTimer();

    // Update every minute
    const interval = setInterval(updateTimer, 60000);

    return () => clearInterval(interval);
  }, [complaint]);

  return {
    timeRemaining,
    progress,
    isOverdue,
    isInWarning,
    hoursRemaining: SLACalculator.getHoursUntilDeadline(complaint),
  };
}
```

### Complaint Escalation Hook (hooks/useComplaintEscalation.ts)

```typescript
import { useDispatch } from 'react-redux';
import { Complaint } from '../types/complaint.types';
import { EscalationEngine } from '../services/escalationEngine';
import { escalateComplaint } from '../store/complaintSlice';
import { NotificationService } from '../services/notificationService';

/**
 * Hook that provides escalation functionality for complaints.
 */
export function useComplaintEscalation() {
  const dispatch = useDispatch();

  const checkAndEscalate = async (complaint: Complaint) => {
    const { shouldEscalate, escalationEvent } = 
      await EscalationEngine.checkAndEscalate(complaint);

    if (shouldEscalate && escalationEvent) {
      // Dispatch Redux action to update state
      await dispatch(escalateComplaint({
        complaintId: complaint.id,
        escalationEvent,
      }));

      // Send notifications
      await NotificationService.sendEscalationNotifications(
        complaint,
        escalationEvent
      );

      return true;
    }

    return false;
  };

  const manualEscalate = async (
    complaint: Complaint,
    targetLevel: any,
    reason: string
  ) => {
    const escalationEvent = EscalationEngine.createManualEscalation(
      complaint,
      targetLevel,
      reason
    );

    await dispatch(escalateComplaint({
      complaintId: complaint.id,
      escalationEvent,
    }));

    await NotificationService.sendEscalationNotifications(
      complaint,
      escalationEvent
    );
  };

  const getNextLevel = (complaint: Complaint) => {
    return EscalationEngine.getNextEscalationLevel(complaint);
  };

  return {
    checkAndEscalate,
    manualEscalate,
    getNextLevel,
  };
}
```

## 11. UI Components

These components visualize the complaint lifecycle and escalation status for users.

### SLA Progress Bar Component (components/SLAProgressBar.tsx)

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Complaint } from '../types/complaint.types';
import { useSLATimer } from '../hooks/useSLATimer';

interface SLAProgressBarProps {
  complaint: Complaint;
}

export const SLAProgressBar: React.FC<SLAProgressBarProps> = ({ complaint }) => {
  const { timeRemaining, progress, isOverdue, isInWarning } = useSLATimer(complaint);

  // Determine color based on status
  const getProgressColor = () => {
    if (isOverdue) return '#EF4444'; // Red
    if (isInWarning) return '#F59E0B'; // Amber
    return '#10B981'; // Green
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Resolution Timeline</Text>
        <Text style={[
          styles.timeText,
          { color: getProgressColor() }
        ]}>
          {timeRemaining}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View 
          style={[
            styles.progressFill,
            { 
              width: `${Math.min(progress, 100)}%`,
              backgroundColor: getProgressColor()
            }
          ]} 
        />
      </View>

      {/* Status indicator */}
      {isOverdue && (
        <Text style={styles.overdueText}>
          ⚠️ This complaint has exceeded its resolution deadline
        </Text>
      )}
      {isInWarning && !isOverdue && (
        <Text style={styles.warningText}>
          ⏰ Approaching deadline
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  overdueText: {
    marginTop: 8,
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  warningText: {
    marginTop: 8,
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
  },
});
```

### Escalation Timeline Component (components/EscalationTimeline.tsx)

```typescript
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Complaint } from '../types/complaint.types';
import { format } from 'date-fns';

interface EscalationTimelineProps {
  complaint: Complaint;
}

export const EscalationTimeline: React.FC<EscalationTimelineProps> = ({ 
  complaint 
}) => {
  // Combine initial submission with escalation history
  const events = [
    {
      level: 'FIELD_UNIT',
      timestamp: complaint.submittedAt,
      authority: 'Initial Assignment',
      isInitial: true,
    },
    ...complaint.escalationHistory.map(e => ({
      level: e.toLevel,
      timestamp: e.escalatedAt,
      authority: e.newAuthority,
      isInitial: false,
    })),
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Escalation History</Text>
      
      {events.map((event, index) => (
        <View key={index} style={styles.eventContainer}>
          {/* Timeline connector */}
          {index < events.length - 1 && (
            <View style={styles.connector} />
          )}
          
          {/* Event dot */}
          <View style={[
            styles.dot,
            index === events.length - 1 && styles.activeDot
          ]} />
          
          {/* Event details */}
          <View style={styles.eventContent}>
            <Text style={styles.levelText}>{event.level}</Text>
            <Text style={styles.authorityText}>{event.authority}</Text>
            <Text style={styles.timestamp}>
              {format(new Date(event.timestamp), 'MMM dd, yyyy • hh:mm a')}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  eventContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    position: 'relative',
  },
  connector: {
    position: 'absolute',
    left: 7,
    top: 24,
    width: 2,
    height: '100%',
    backgroundColor: '#E5E7EB',
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#9CA3AF',
    marginRight: 12,
    marginTop: 2,
  },
  activeDot: {
    backgroundColor: '#3B82F6',
  },
  eventContent: {
    flex: 1,
  },
  levelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  authorityText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
```

## 12. API Integration Layer

The API service handles all communication with your backend server.

### Complaint API Service (services/complaintAPI.ts)

```typescript
import axios from 'axios';
import { Complaint, EscalationEvent } from '../types/complaint.types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export class ComplaintAPI {
  /**
   * Fetch all complaints for a specific user.
   */
  static async getUserComplaints(userId: string): Promise<Complaint[]> {
    const response = await api.get(`/complaints/user/${userId}`);
    return response.data;
  }

  /**
   * Fetch all active (unresolved) complaints for background processing.
   */
  static async getActiveComplaints(): Promise<Complaint[]> {
    const response = await api.get('/complaints/active');
    return response.data;
  }

  /**
   * Create a new complaint.
   */
  static async createComplaint(complaint: Partial<Complaint>): Promise<Complaint> {
    const response = await api.post('/complaints', complaint);
    return response.data;
  }

  /**
   * Escalate a complaint to the next level.
   */
  static async escalateComplaint(
    complaintId: string,
    escalationEvent: EscalationEvent
  ): Promise<Complaint> {
    const response = await api.post(
      `/complaints/${complaintId}/escalate`,
      escalationEvent
    );
    return response.data;
  }

  /**
   * Mark a complaint as resolved with proof.
   */
  static async resolveComplaint(
    complaintId: string,
    resolutionData: {
      images: string[];
      notes: string;
      resolvedBy: string;
    }
  ): Promise<Complaint> {
    const response = await api.post(
      `/complaints/${complaintId}/resolve`,
      resolutionData
    );
    return response.data;
  }

  /**
   * Update complaint status.
   */
  static async updateStatus(
    complaintId: string,
    status: Complaint['status']
  ): Promise<Complaint> {
    const response = await api.patch(`/complaints/${complaintId}/status`, {
      status,
    });
    return response.data;
  }

  /**
   * Get escalation statistics for Authority Console.
   */
  static async getEscalationStats(wardId?: string): Promise<{
    totalEscalated: number;
    byLevel: Record<string, number>;
    bySeverity: Record<string, number>;
    avgResolutionTime: number;
  }> {
    const params = wardId ? { ward: wardId } : {};
    const response = await api.get('/complaints/stats/escalations', { params });
    return response.data;
  }
}
```

## 13. Implementation Roadmap

This section provides a phased approach to implementing the escalation system to ensure steady progress and testability at each stage.

### Phase 1: Foundation (Week 1)

**Goal:** Set up the core data structures and basic infrastructure.

**Tasks:**
1. Create all TypeScript type definitions in `types/complaint.types.ts`
2. Set up Redux store with complaint slice
3. Implement constants files for SLA config and authority hierarchy
4. Create basic complaint submission flow without escalation
5. Set up API service layer with mock responses for testing

**Deliverables:**
- Users can submit complaints with severity classification
- Complaints appear in a list with basic details
- Redux state management working for complaint CRUD

### Phase 2: SLA Calculation & Display (Week 2)

**Goal:** Implement SLA deadline tracking and visual indicators.

**Tasks:**
1. Implement `SLACalculator` service with all deadline calculation logic
2. Create `useSLATimer` hook for real-time countdown
3. Build `SLAProgressBar` component
4. Add SLA information to complaint detail screens
5. Implement SLA warning detection logic

**Deliverables:**
- Each complaint displays a progress bar showing time until deadline
- Color-coded warnings when approaching deadline
- Accurate countdown timers that update in real-time

### Phase 3: Escalation Engine (Week 3)

**Goal:** Build the automatic escalation system.

**Tasks:**
1. Implement `EscalationEngine` service with escalation logic
2. Create escalation event creation and storage
3. Implement hierarchy mapping logic
4. Add escalation delay checks (preventing rapid escalation)
5. Build `EscalationTimeline` component to display history

**Deliverables:**
- Complaints automatically escalate when SLA is breached
- Escalation events are properly recorded
- Escalation timeline shows complete history
- Each escalation assigns to correct authority based on level

### Phase 4: Background Processing (Week 4)

**Goal:** Enable automatic escalation checks even when app is closed.

**Tasks:**
1. Set up Expo background fetch and task manager
2. Implement background escalation check task
3. Register task during app initialization
4. Test background processing on physical device
5. Optimize background task performance

**Deliverables:**
- Background task runs every hour to check for SLA breaches
- Escalations happen automatically without user intervention
- Works reliably even when app is terminated

### Phase 5: Notifications (Week 5)

**Goal:** Implement comprehensive notification system.

**Tasks:**
1. Build `NotificationService` with all notification types
2. Request and handle notification permissions
3. Send escalation notifications to users
4. Send SLA warning notifications 
5. Schedule future notifications for deadline reminders
6. Handle notification taps to open relevant complaint

**Deliverables:**
- Users receive push notifications for all escalation events
- Warning notifications sent before deadline
- Tapping notification navigates to complaint details

### Phase 6: Authority Console (Week 6)

**Goal:** Build admin interface for authorities to manage complaints.

**Tasks:**
1. Create Authority Console screen with dashboard
2. Implement SLA compliance charts and statistics
3. Build escalated cases view with filtering
4. Add manual escalation capability for authorities
5. Implement audit log display
6. Create compliance report generation

**Deliverables:**
- Authorities can view all complaints in their jurisdiction