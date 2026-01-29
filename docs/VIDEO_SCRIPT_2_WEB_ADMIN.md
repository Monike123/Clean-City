# Video Script 2: Web Admin Dashboard - Complete Feature Walkthrough
## Duration: ~10-12 minutes

---

## INTRO (45 seconds)

**[SCREEN: Dashboard login page]**

> "Welcome back to Clear City! In this video, we explore the Web Admin Dashboard - the command center where city authorities manage the entire waste management ecosystem.

> The dashboard is built with:
> - **React** with **TypeScript**
> - **Vite** for fast development
> - **Tailwind CSS** for styling
> - **Supabase** for real-time data

> Let's log in and explore every feature."

---

## PART 1: PROJECT STRUCTURE - WEB APP (1 minute)

**[SCREEN: Code editor showing web app structure]**

> "The web admin lives in `apps/web/`. Here's the structure:

> ```
> apps/web/
> ├── src/
> │   ├── pages/           # 9 main pages
> │   │   ├── Dashboard.tsx
> │   │   ├── Reports.tsx
> │   │   ├── LiveMap.tsx
> │   │   ├── WorkerVerification.tsx
> │   │   ├── TeamPanel.tsx
> │   │   ├── TaskAssignment.tsx
> │   │   ├── AuditAnalytics.tsx
> │   │   ├── AIAutomation.tsx
> │   │   └── Login.tsx
> │   ├── components/      # Shared UI components
> │   ├── layouts/         # DashboardLayout.tsx
> │   └── lib/             # Supabase client
> └── public/              # Static assets
> ```

> Let me walk through each page."

---

## PART 2: ADMIN LOGIN (30 seconds)

**[SCREEN: Login page - pages/Login.tsx]**

> "Access the dashboard at your deployment URL. The login page uses Supabase Auth."

**[ACTION: Enter admin credentials]**

> "Admin accounts have the role 'admin' in the profiles table, which grants access to all management features."

**[ACTION: Click Login]**

**[SCREEN: Dashboard loads with sidebar]**

> "Welcome to the admin dashboard!"

---

## PART 3: DASHBOARD LAYOUT & NAVIGATION (1 minute)

**[SCREEN: Dashboard with sidebar visible]**

> "The layout is defined in `layouts/DashboardLayout.tsx`. Let me explain the sidebar navigation:"

**[ACTION: Point to each sidebar item]**

> "**Section 1 - Overview:**
> - 📊 Dashboard - Statistics and KPIs
> - 🗺️ Map View - Geographic visualization

> **Section 2 - Report Management:**
> - 📋 Reports - All reports with actions
> - 📊 Audit & Analytics - Data insights

> **Section 3 - Worker Management:**
> - 👥 Team Panel - Worker list
> - ✅ Worker Verification - Approve applications
> - 📌 Task Assignment - Assign workers to reports

> **Section 4 - AI Automation:**
> - 🤖 AI Automation - AI Sentinel showcase"

**[ACTION: Show green theme accent color]**

> "Notice our green color scheme throughout - representing environmental consciousness."

---

## PART 4: DASHBOARD - Statistics Overview (1.5 minutes)

**[ACTION: Click Dashboard in sidebar]**

**[SCREEN: Dashboard.tsx]**

> "The main dashboard shows real-time statistics at a glance."

### Stat Cards

**[ACTION: Point to top stat cards]**

> "Top-level metrics:
> - **Total Reports**: All submissions ever received
> - **Pending**: Awaiting admin action
> - **In Progress**: Workers handling
> - **Resolved**: Successfully cleaned"

> "These numbers update in real-time via Supabase subscriptions."

### Charts & Graphs

**[ACTION: Point to charts]**

> "Visual analytics show:
> - **Reports Over Time**: Trend line - is waste increasing or decreasing?
> - **Category Distribution**: Pie chart - what waste types are most common?
> - **Resolution Rate**: How quickly are issues addressed?
> - **Ward-wise Breakdown**: Which areas have the most problems?"

### Recent Activity

**[ACTION: Point to activity feed]**

> "The activity feed shows live updates:
> - New report submitted
> - Worker claimed task
> - Resolution pending verification
> - Report resolved"

---

## PART 5: LIVE MAP VIEW (1 minute)

**[ACTION: Click Map View in sidebar]**

**[SCREEN: LiveMap.tsx]**

> "The Live Map is powered by our `LiveMap.tsx` component - about 24,000 bytes of code for a rich mapping experience."

### Map Features

**[ACTION: Show map with markers]**

> "Every report appears as a marker. Colors indicate severity:
> - 🔴 Critical - Immediate attention needed
> - 🟠 High - Urgent
> - 🟡 Medium - Regular priority
> - 🟢 Low - When resources available"

### Cluster Analysis

**[ACTION: Zoom out to show clusters]**

> "When zoomed out, markers cluster to show hotspots. Large clusters indicate problem areas needing systemic solutions."

### Marker Details

**[ACTION: Click a marker]**

> "Click any marker to see:
> - Full report details
> - Photo preview
> - Quick actions (approve, assign)"

### Filters

**[ACTION: Show filter controls]**

> "Filter the map by:
> - Status
> - Date range
> - Category
> - Ward/Zone"

---

## PART 6: REPORTS MANAGEMENT (2.5 minutes)

**[ACTION: Click Reports in sidebar]**

**[SCREEN: Reports.tsx - largest page at 38KB]**

> "`Reports.tsx` is our most comprehensive page at nearly 39KB. It handles all report workflows."

### Reports Table

**[ACTION: Show the data table]**

> "A sortable, filterable table showing all reports:
> - ID / Reference number
> - Thumbnail image
> - Location (address)
> - Category & Severity
> - Status with color badge
> - Time submitted
> - Action buttons"

### Filtering & Search

**[ACTION: Show filter options]**

> "Powerful filtering:
> - **Status Filter**: Submitted, Approved, In Progress, Pending Verification, Resolved, Rejected
> - **Category Filter**: All 8 waste categories
> - **Date Range**: Custom date picker
> - **Search**: By location or ID"

### Workflow 1: Approving New Reports

**[ACTION: Filter by 'Submitted']**

> "Let's process a new submission. Filter by 'Submitted' status."

**[ACTION: Click on a report row]**

**[SCREEN: Report detail modal]**

> "The detail modal shows:
> - Full-size image
> - Complete metadata
> - AI analysis results (if used)
> - Location on mini-map"

**[ACTION: Click Approve button]**

> "Click 'Approve' to validate. This:
> 1. Changes status to 'approved'
> 2. Makes it available for worker claims
> 3. Sends notification to nearby workers"

### Workflow 2: Rejecting Invalid Reports

**[ACTION: Show reject option]**

> "For invalid reports - duplicates, spam, or wrong category - click 'Reject' and provide a reason. The citizen is notified."

### Workflow 3: Verifying Resolutions

**[ACTION: Filter by 'pending_verification']**

> "When workers complete tasks, they submit proof. Filter by 'Pending Verification'."

**[ACTION: Click on a pending verification report]**

**[SCREEN: Resolution comparison view]**

> "Compare side-by-side:
> - **Original Photo**: The reported waste
> - **Resolution Photo**: The cleaned area
> - **Worker Notes**: What was done"

**[ACTION: Click 'Approve Resolution']**

> "If satisfactory, approve. Status becomes 'RESOLVED':
> - Citizen gets notified
> - Worker gets credit
> - Appears in resolved statistics"

**[ACTION: Show 'Reject Resolution' option]**

> "If incomplete, reject with feedback. Status reverts to 'approved' and work must redo."

---

## PART 7: AUDIT & ANALYTICS (1 minute)

**[ACTION: Click Audit & Analytics in sidebar]**

**[SCREEN: AuditAnalytics.tsx]**

> "The Audit & Analytics page provides deep insights for data-driven decisions."

### Analytics Features

**[ACTION: Show various charts/metrics]**

> "This 22KB page includes:
> - **Resolution Time Analysis**: Average time from report to resolution
> - **Worker Performance Metrics**: Tasks completed, approval rates
> - **Category Trends**: Which waste types are increasing
> - **Geographic Analysis**: Ward-by-ward comparison
> - **SLA Compliance**: Are targets being met?"

### Export Options

**[ACTION: Show export if available]**

> "Export data for external reporting and analysis."

---

## PART 8: TEAM PANEL - Worker Overview (1 minute)

**[ACTION: Click Team Panel in sidebar]**

**[SCREEN: TeamPanel.tsx]**

> "Team Panel shows all registered workers and their performance."

### Worker List

**[ACTION: Show worker cards/list]**

> "Each worker shows:
> - Profile photo
> - Name and Employee ID
> - Assigned Ward/Zone
> - Tasks completed
> - Status (Active, Inactive, Suspended)"

### Performance Metrics

**[ACTION: Show individual worker stats]**

> "Click a worker to see:
> - Total tasks completed
> - Average resolution time
> - Approval rate (how often their work passes verification)
> - Current assignments"

---

## PART 9: WORKER VERIFICATION (1 minute)

**[ACTION: Click Worker Verification in sidebar]**

**[SCREEN: WorkerVerification.tsx]**

> "When citizens apply to become workers, their applications appear here."

### Application Review

**[ACTION: Show pending applications if any]**

> "Each application includes:
> - Personal information
> - Employee ID / Staff number
> - ID proof document
> - Preferred ward assignment
> - Registration date"

**[ACTION: Click on an application]**

> "Review the submitted documents. Verify:
> - Is this a legitimate municipal employee?
> - Does the ID match records?
> - Is the ward assignment appropriate?"

### Approve/Reject

**[ACTION: Show approve/reject buttons]**

> "**Approve**: Worker can immediately claim tasks
> **Reject**: Application denied with reason"

> "The green-themed buttons match our project's UI/UX - this page uses our updated green color scheme."

---

## PART 10: TASK ASSIGNMENT (1 minute)

**[ACTION: Click Task Assignment in sidebar]**

**[SCREEN: TaskAssignment.tsx - 32KB]**

> "Task Assignment allows manual worker assignment for urgent cases."

### How It Works

**[ACTION: Show assignment interface]**

> "Instead of waiting for workers to claim tasks, admins can:
> 1. Select an approved report
> 2. Choose an available worker
> 3. Assign directly"

> "This is useful for:
> - Critical reports needing immediate attention
> - Balancing workload across workers
> - Zone-specific assignments"

**[ACTION: Show assignment action]**

> "Assigned workers receive notifications and the task appears in their 'My Tasks' immediately."

---

## PART 11: AI AUTOMATION SHOWCASE (1.5 minutes)

**[ACTION: Click AI Automation in sidebar]**

**[SCREEN: AIAutomation.tsx]**

> "This is our AI showcase page - demonstrating Clear City's vision for automated garbage detection."

### Hero Section

**[ACTION: Show hero with metrics]**

> "The page opens with impressive metrics:
> - **95.73% mAP@50** - Detection accuracy
> - **94.39% Precision** - Low false positives
> - **91.06% Recall** - Catches most garbage"

> "These numbers come from our YOLOv11 model trained on urban waste data."

### Training Visualizations

**[ACTION: Scroll to training plots section]**

> "Training plots show model improvement:
> - Loss curves decreasing
> - mAP increasing
> - Precision/recall balance"

### Mumbai Deployment Plan

**[ACTION: Show deployment section]**

> "Our deployment roadmap for Mumbai shows phased implementation:
> - **Phase 1**: K-East ward - 47% coverage
> - **Phase 2**: L-Ward expansion
> - Planned integration with 500+ CCTV cameras"

**[ACTION: Click 'Download Deployment Plan']**

> "Download the complete technical document with architecture, timeline, and cost estimates."

### Live Demo Section

**[ACTION: Scroll to live demo]**

> "At the bottom, click 'View Live Demo' to see real-time detection."

**[ACTION: Click the button if AI Sentinel is running]**

> "This connects to our Python backend (`apps/ai_sentinel/sentinel.py`) running YOLOv11 detection. The demo mode shows detections without writing to the database."

---

## PART 12: AI SENTINEL BACKEND (45 seconds)

**[SCREEN: Code editor showing ai_sentinel folder]**

> "Quick look at the AI backend in `apps/ai_sentinel/`:

> - `sentinel.py` - Main detection engine (285 lines)
>   - YOLO inference
>   - Smart validation (3-frame confirmation)
>   - Flask video streaming
>   - REST API endpoints
>   
> - `config.py` - Configuration
>   - Camera settings
>   - Supabase credentials
>   - Model paths
>   
> - `requirements.txt` - Dependencies
>   - ultralytics (YOLO)
>   - opencv-python
>   - flask + flask-cors"

---

## PART 13: BEHIND THE SCENES (30 seconds)

> "Powering the dashboard:

> **Supabase Integration** (`lib/supabase.ts`):
> - Real-time subscriptions for live updates
> - Row Level Security for data protection
> - Storage buckets for images

> **Component Architecture**:
> - Reusable UI components in `components/`
> - Shared layouts in `layouts/`
> - Centralized page exports in `pages/index.ts`"

---

## OUTRO (30 seconds)

**[SCREEN: Dashboard overview]**

> "That's the complete Web Admin Dashboard!

> We covered all 9 pages:
> 1. Dashboard - Statistics overview
> 2. Live Map - Geographic visualization
> 3. Reports - Full lifecycle management
> 4. Audit & Analytics - Data insights
> 5. Team Panel - Worker overview
> 6. Worker Verification - Application approval
> 7. Task Assignment - Manual assignment
> 8. AI Automation - AI detection showcase
> 9. Login - Authentication

> In the final video, we'll complete the cycle with the Worker mobile experience.

> Thanks for watching!"

---

## VIDEO NOTES

### All Features Covered:
- ✅ Login (pages/Login.tsx)
- ✅ Dashboard statistics (Dashboard.tsx)
- ✅ Live Map with markers (LiveMap.tsx)
- ✅ Reports management (Reports.tsx)
- ✅ Report approval workflow
- ✅ Resolution verification workflow
- ✅ Audit & Analytics (AuditAnalytics.tsx)
- ✅ Team Panel (TeamPanel.tsx)
- ✅ Worker Verification (WorkerVerification.tsx)
- ✅ Task Assignment (TaskAssignment.tsx)
- ✅ AI Automation showcase (AIAutomation.tsx)
- ✅ AI Sentinel backend overview
- ✅ Mumbai deployment plan
- ✅ Supabase integration
- ✅ Green theme UI/UX

### Files Mentioned:
```
apps/web/src/
├── pages/
│   ├── Dashboard.tsx (16KB)
│   ├── Reports.tsx (38KB)
│   ├── LiveMap.tsx (24KB)
│   ├── WorkerVerification.tsx (24KB)
│   ├── TeamPanel.tsx (21KB)
│   ├── TaskAssignment.tsx (32KB)
│   ├── AuditAnalytics.tsx (22KB)
│   ├── AIAutomation.tsx (24KB)
│   └── Login.tsx (6KB)
├── layouts/
│   └── DashboardLayout.tsx
├── components/
└── lib/
    └── supabase.ts

apps/ai_sentinel/
├── sentinel.py
├── config.py
└── requirements.txt
```

### Technical Requirements:
- Web dashboard running (npm run dev)
- Admin account credentials
- Sample data in database (reports in various states)
- At least one pending worker application
- AI Sentinel optional for live demo
