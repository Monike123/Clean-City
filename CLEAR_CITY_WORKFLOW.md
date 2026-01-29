# Clear City - Complete Application Workflow Documentation

## Overview

Clear City is a comprehensive waste management platform connecting three stakeholders in a seamless reporting and resolution cycle:

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   CITIZEN   │ ───▶ │  WEB ADMIN  │ ───▶ │   WORKER    │
│  Mobile App │      │  Dashboard  │      │  Mobile App │
└─────────────┘      └─────────────┘      └─────────────┘
       │                    │                    │
       │                    ▼                    │
       │             ┌─────────────┐             │
       └────────────▶│  SUPABASE   │◀────────────┘
                     │  Database   │
                     └─────────────┘
```

---

## 1. Citizen Mobile App (Report Creation)

### 1.1 User Authentication
- **Location**: `apps/mobile/app/(auth)/login.tsx`
- User signs in with email/password via Supabase Auth
- Profile data stored in `profiles` table
- Role defaults to `'citizen'`

### 1.2 Report Submission Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    REPORT CREATION FLOW                     │
└─────────────────────────────────────────────────────────────┘

Home Screen                   Report Tab                      
    │                             │                           
    ▼                             ▼                           
┌────────┐                  ┌───────────────┐                 
│  Map   │                  │ Choose Mode:  │                 
│ View   │                  │ • AI Report   │                 
│        │                  │ • Manual      │                 
└────────┘                  └───────┬───────┘                 
                                    │                         
                    ┌───────────────┴───────────────┐         
                    ▼                               ▼         
            ┌───────────────┐               ┌───────────────┐ 
            │  AI Mode 🤖   │               │ Manual Mode ✏️│ 
            │ Auto-analyze  │               │ Fill manually │ 
            └───────┬───────┘               └───────┬───────┘ 
                    │                               │         
                    └───────────────┬───────────────┘         
                                    ▼                         
                            ┌───────────────┐                 
                            │ Camera Screen │                 
                            │ • Capture 📷  │                 
                            │ • Gallery 🖼️  │                 
                            └───────┬───────┘                 
                                    ▼                         
                            ┌───────────────┐                 
                            │  Report Form  │                 
                            │ • Description │                 
                            │ • Category    │                 
                            │ • Severity    │                 
                            │ • Location    │                 
                            └───────┬───────┘                 
                                    ▼                         
                            ┌───────────────┐                 
                            │   SUBMIT ✅   │                 
                            │ status: 'submitted'             
                            └───────────────┘                 
```

### 1.3 Key Files
| File | Purpose |
|------|---------|
| `app/(tabs)/report.tsx` | Mode selection (AI/Manual) |
| `app/report-camera.tsx` | Camera + Gallery + Form |
| `services/reportService.ts` | Supabase CRUD operations |
| `services/gemini.ts` | AI image analysis |

### 1.4 Report Status After Submission
```json
{
  "status": "submitted",
  "user_id": "citizen-uuid",
  "media_file": "https://supabase.../image.jpg",
  "location": { "lat": 19.0760, "lng": 72.8777, "address": "..." },
  "waste_category": "Plastic",
  "severity": "medium"
}
```

---

## 2. Web Admin Dashboard (Management)

### 2.1 Admin Access
- **URL**: `http://localhost:5173` (development)
- **Location**: `apps/web/src/`
- Admins log in with credentials
- Role must be `'admin'` in `profiles` table

### 2.2 Dashboard Features

```
┌─────────────────────────────────────────────────────────────┐
│                    WEB ADMIN DASHBOARD                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ 📊 Dashboard     │  │ 📍 Map View      │                │
│  │ Overview stats   │  │ All reports on   │                │
│  │ Recent activity  │  │ interactive map  │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ 📋 Reports       │  │ 👷 Workers       │                │
│  │ View all reports │  │ Manage workers   │                │
│  │ Filter by status │  │ Verify accounts  │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ 🤖 AI Sentinel   │  │ ⚙️ Settings      │                │
│  │ AI detection     │  │ Configuration    │                │
│  │ demo & showcase  │  │                  │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Report Status Workflow (Admin Actions)

```
┌─────────────────────────────────────────────────────────────┐
│              ADMIN REPORT STATUS TRANSITIONS                │
└─────────────────────────────────────────────────────────────┘

  submitted ──────▶ approved ──────▶ (Worker claims it)
      │                                      │
      │                                      ▼
      │                               in_progress
      │                                      │
      │                                      ▼
      │                           pending_verification
      │                                      │
      │              ┌───────────────────────┼───────────────────────┐
      │              ▼                       │                       ▼
      │         RESOLVED ✅                  │                  REJECTED
      │     (Admin approved               (Admin rejected
      │      worker's proof)              worker's submission)
      │                                      │
      ▼                                      │
  rejected                                   │
(Admin rejected                              │
 original report)                            ▼
                                      back to 'approved'
                                      (Worker must redo)
```

### 2.4 Key Files
| File | Purpose |
|------|---------|
| `pages/Dashboard.tsx` | Overview statistics |
| `pages/Reports.tsx` | Report list with filters |
| `pages/MapView.tsx` | Map visualization |
| `pages/WorkerVerification.tsx` | Approve/reject workers |
| `pages/AIAutomation.tsx` | AI Sentinel showcase |

---

## 3. Worker Mobile App (Task Resolution)

### 3.1 Worker Registration & Verification

```
┌─────────────────────────────────────────────────────────────┐
│                  WORKER ONBOARDING FLOW                     │
└─────────────────────────────────────────────────────────────┘

     Citizen App                    Worker Registration
          │                              │
          ▼                              ▼
    ┌───────────┐                 ┌───────────────┐
    │  Profile  │                 │ Apply to be   │
    │  Screen   │ ──────────────▶ │   a Worker    │
    └───────────┘                 └───────┬───────┘
                                          │
                                          ▼
                                  ┌───────────────┐
                                  │ Fill Details: │
                                  │ • Name        │
                                  │ • Employee ID │
                                  │ • Ward        │
                                  │ • ID Proof    │
                                  └───────┬───────┘
                                          │
                                          ▼
                                  ┌───────────────┐
                                  │   PENDING     │
                                  │  Verification │
                                  └───────┬───────┘
                                          │
                        ┌─────────────────┴─────────────────┐
                        ▼                                   ▼
                  ┌───────────┐                      ┌───────────┐
                  │  APPROVED │                      │  REJECTED │
                  │  by Admin │                      │  by Admin │
                  └─────┬─────┘                      └───────────┘
                        │
                        ▼
                  ┌───────────────┐
                  │ Worker Mode   │
                  │ Unlocked! 👷  │
                  └───────────────┘
```

### 3.2 Worker Task Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    WORKER TASK LIFECYCLE                    │
└─────────────────────────────────────────────────────────────┘

┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│  Explore Tasks │     │  My Tasks Tab  │     │  Task Detail   │
│                │     │                │     │                │
│ Browse nearby  │     │ View claimed   │     │ View report    │
│ approved       │────▶│ tasks (in      │────▶│ details +      │
│ reports        │     │ progress)      │     │ submit proof   │
└────────┬───────┘     └────────────────┘     └────────┬───────┘
         │                                             │
         ▼                                             ▼
┌────────────────┐                            ┌────────────────┐
│   CLAIM TASK   │                            │ SUBMIT PROOF   │
│                │                            │                │
│ status changes │                            │ • Take photo   │
│ to 'in_progress'                            │ • Add notes    │
└────────────────┘                            │ • Submit       │
                                              └────────┬───────┘
                                                       │
                                                       ▼
                                              ┌────────────────┐
                                              │ STATUS BECOMES │
                                              │ 'pending_      │
                                              │  verification' │
                                              └────────────────┘
                                                       │
                                                       ▼
                                              ┌────────────────┐
                                              │  ADMIN REVIEW  │
                                              │                │
                                              │ Approve ───▶ RESOLVED
                                              │ Reject  ───▶ approved
                                              │              (redo)
                                              └────────────────┘
```

### 3.3 Key Files (Worker Mode)
| File | Purpose |
|------|---------|
| `app/(worker)/explore-tasks.tsx` | Browse available tasks |
| `app/(worker)/my-tasks.tsx` | View claimed tasks |
| `app/worker-task/[id].tsx` | Task detail + submit resolution |
| `app/worker-registration.tsx` | Apply to become worker |

---

## 4. Complete Data Flow

### 4.1 Database Tables (Supabase)

```sql
-- Core Tables
profiles          -- User accounts (citizens, workers, admins)
reports           -- All waste reports
workers           -- Worker registration data
worker_assignments -- Task assignments tracking

-- Key Fields in 'reports'
id                -- UUID
user_id           -- Reporter's ID
status            -- submitted | approved | in_progress | 
                  -- pending_verification | RESOLVED | rejected
media_file        -- Image URL
location          -- JSONB with lat/lng/address
waste_category    -- Type of waste
severity          -- low | medium | high | critical
assigned_worker_id -- Worker handling the task
resolution_proof  -- Cleanup photo URL
resolved_at       -- Timestamp
```

### 4.2 Status Flow Summary

```
┌─────────────────────────────────────────────────────────────┐
│                 COMPLETE STATUS LIFECYCLE                   │
└─────────────────────────────────────────────────────────────┘

  ┌──────────┐     ┌──────────┐     ┌──────────┐
  │ CITIZEN  │     │  ADMIN   │     │  WORKER  │
  │ submits  │────▶│ approves │────▶│  claims  │
  │ report   │     │ report   │     │  task    │
  └──────────┘     └──────────┘     └──────────┘
                                          │
    submitted ───▶ approved ───────▶ in_progress
                                          │
                                          ▼
                                    ┌──────────┐
                                    │  WORKER  │
                                    │ completes│
                                    │ cleanup  │
                                    └──────────┘
                                          │
                                          ▼
                                pending_verification
                                          │
                        ┌─────────────────┴─────────────────┐
                        ▼                                   ▼
                  ┌──────────┐                        ┌──────────┐
                  │  ADMIN   │                        │  ADMIN   │
                  │ approves │                        │ rejects  │
                  │  proof   │                        │  proof   │
                  └────┬─────┘                        └────┬─────┘
                       │                                   │
                       ▼                                   ▼
                   RESOLVED ✅                      back to approved
                                                  (worker must redo)
```

---

## 5. Real-Time Features

### 5.1 Supabase Realtime Subscriptions
- Reports table changes broadcast to all connected clients
- Dashboard auto-updates when new reports submitted
- Worker app refreshes task list on status changes

### 5.2 Location Services
- GPS coordinates captured during report submission
- Reverse geocoding provides readable addresses
- Map views show all reports with markers

---

## 6. AI Integration

### 6.1 AI Report Mode (Gemini)
- **Location**: `services/gemini.ts`
- Analyzes waste images using Google Gemini Vision
- Auto-fills form fields:
  - Waste category
  - Severity estimation
  - Size approximation
  - Hazard detection

### 6.2 AI Sentinel (YOLOv11)
- **Location**: `apps/ai_sentinel/`
- Real-time garbage detection from video feeds
- Demo mode available (no database writes)
- Designed for city camera integration

---

## 7. Technology Stack

| Layer | Technology |
|-------|------------|
| Mobile App | React Native + Expo |
| Web Dashboard | React + Vite + TypeScript |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| Storage | Supabase Storage |
| AI (Mobile) | Google Gemini API |
| AI (Sentinel) | YOLOv11 + Python |
| Styling | Tailwind CSS (Web), StyleSheet (Mobile) |

---

## 8. Project Structure

```
Environment_tech/
├── apps/
│   ├── mobile/           # Citizen + Worker React Native app
│   │   ├── app/          # Expo Router screens
│   │   ├── components/   # Reusable UI components
│   │   ├── services/     # API & business logic
│   │   ├── store/        # Zustand state management
│   │   └── lib/          # Supabase client
│   │
│   ├── web/              # Admin dashboard (React + Vite)
│   │   ├── src/
│   │   │   ├── pages/    # Dashboard screens
│   │   │   ├── components/ # UI components
│   │   │   └── lib/      # Supabase client
│   │   └── public/       # Static assets
│   │
│   └── ai_sentinel/      # Python AI service
│       ├── sentinel.py   # Main detection engine
│       ├── config.py     # Configuration
│       └── requirements.txt
│
├── ML_model/             # YOLOv11 trained model
│   └── garbage_detect.pt
│
└── packages/             # Shared packages (if any)
```

---

## 9. Quick Reference: User Journeys

### Citizen Reports Garbage
1. Open app → Login
2. Report tab → Choose AI/Manual
3. Capture or select image
4. Fill/confirm details
5. Submit → Status: `submitted`

### Admin Processes Report
1. Login to web dashboard
2. View Reports → Filter by `submitted`
3. Review report details
4. Approve → Status: `approved`

### Worker Completes Task
1. Open app → Worker mode
2. Explore Tasks → Find nearby task
3. Claim task → Status: `in_progress`
4. Go to location → Clean up
5. Take photo → Submit proof → Status: `pending_verification`

### Admin Verifies Cleanup
1. Reports → Filter by `pending_verification`
2. Compare original vs resolution photo
3. Approve → Status: `RESOLVED` ✅
4. Or Reject → Status back to `approved`

---

*Document Version: 1.0*
*Last Updated: January 2026*
*Clear City Platform*
