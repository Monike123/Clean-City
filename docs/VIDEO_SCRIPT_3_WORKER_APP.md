# Video Script 3: Worker Mobile App - Complete Feature Walkthrough
## Duration: ~8-10 minutes

---

## INTRO (45 seconds)

**[SCREEN: App screen showing citizen view]**

> "Welcome to the final part of our Clear City walkthrough! In this video, we complete the cycle with the Worker experience.

> Workers are the essential link between reports and resolution. They:
> - Receive approved tasks
> - Travel to locations
> - Clean up waste
> - Submit proof of completion

> The same mobile app serves both citizens AND workers - the interface adapts based on your account status.

> Let's see the complete worker journey!"

---

## PART 1: WORKER-RELATED CODE STRUCTURE (1 minute)

**[SCREEN: Code editor or mention verbally]**

> "Worker functionality lives in the same mobile app. Key files:

> **Worker Screens** (`app/(worker)/`):
> - `explore-tasks.tsx` - Browse available tasks
> - `my-tasks.tsx` - View claimed tasks
> - `_layout.tsx` - Worker tab navigation

> **Worker Task Detail**:
> - `app/worker-task/[id].tsx` - Task detail and resolution

> **Worker Registration**:
> - Integrated into profile screen
> - Uses `profiles` and `workers` tables

> **Shared Services**:
> - `reportService.ts` - Handles task claims and updates
> - `slaCalculator.ts` - SLA deadline tracking

> Let's see how someone becomes a worker."

---

## PART 2: BECOMING A WORKER - Registration (2 minutes)

### Finding the Registration

**[SCREEN: Profile tab as regular citizen]**

> "Any citizen can apply to become a municipal worker. Start from the Profile tab."

**[ACTION: Navigate to Profile]**

**[SCREEN: app/(tabs)/profile.tsx]**

> "Scroll down past your profile info. You'll see options for:
> - Government Hierarchy
> - Working Hours
> - **Apply to be a Worker**"

**[ACTION: Tap 'Apply to be a Worker' or equivalent]**

### Registration Form

**[SCREEN: Worker registration form]**

> "The registration form collects municipality-required information:"

**[ACTION: Show each form field]**

> "**Personal Details:**
> - Full name (official)
> - Phone number
> - Current address"

> "**Employment Information:**
> - Employee ID / Staff number
> - Department (Sanitation, SWM, etc.)
> - Supervisor name"

> "**Assignment Preferences:**
> - Preferred Ward/Zone
> - Shift preference (morning/evening)"

> "**Document Upload:**
> - Government ID proof
> - Employee badge photo"

**[ACTION: Fill sample data]**

> "Let me fill this out with sample information..."

**[ACTION: Upload ID document]**

> "Upload a clear photo of your municipal ID. This is verified by administrators."

### Submission

**[ACTION: Tap Submit Application]**

> "Tap 'Submit Application'."

**[SCREEN: Pending verification message]**

> "Your application is now pending review. An admin will verify your documents - typically within 24-48 hours."

> "You'll receive a notification when approved."

---

## PART 3: ADMIN APPROVAL (Brief - 30 seconds)

**[SCREEN: Mention or show web dashboard briefly]**

> "On the admin side (as we saw in Video 2), your application appears in Worker Verification. The admin:
> 1. Reviews your submitted documents
> 2. Verifies against municipal records
> 3. Approves or rejects"

> "Once approved, your app automatically unlocks Worker Mode!"

---

## PART 4: WORKER MODE INTERFACE (1 minute)

**[SCREEN: App now showing worker interface]**

> "Let me switch to an account that's already verified as a worker."

**[ACTION: Show the worker tabs]**

**[SCREEN: Worker tabs at bottom]**

> "The interface changes! Workers see different tabs:

> - **Explore Tasks** 🔍 - Find new tasks in your ward
> - **My Tasks** 📋 - Tasks you've claimed
> - **Home** 🏠 - Overview (same as citizen)
> - **Profile** 👤 - Your worker stats"

> "This is defined in `app/(worker)/_layout.tsx` which sets up worker-specific navigation."

---

## PART 5: EXPLORE TASKS (1.5 minutes)

**[ACTION: Navigate to Explore Tasks]**

**[SCREEN: app/(worker)/explore-tasks.tsx]**

### Available Tasks View

> "Explore Tasks shows all approved reports in your assigned ward."

**[ACTION: Show the task list]**

> "Each task card displays:
> - **Photo thumbnail** - Quick visual of the waste
> - **Category badge** - Plastic, Organic, etc.
> - **Severity indicator** - Color-coded priority
> - **Location** - Address and distance from you
> - **Time since reported** - How long it's been waiting"

### Understanding Priority

**[ACTION: Point to different severity levels]**

> "Workers should prioritize:
> 1. 🔴 **Critical** - Hazardous, blocking access, health risk
> 2. 🟠 **High** - Large accumulations, bad odor
> 3. 🟡 **Medium** - Standard waste piles
> 4. 🟢 **Low** - Minor litter"

### Filtering & Sorting

**[ACTION: Show filter/sort options if available]**

> "Filter by:
> - Distance (nearest first)
> - Severity (most urgent)
> - Age (oldest first for SLA compliance)"

### Task Detail Preview

**[ACTION: Tap on a specific task]**

**[SCREEN: Task detail view]**

> "Tapping a task shows full details:
> - Larger image
> - Complete description from the citizen
> - Exact location with map
> - Hazard warnings (if any sharp objects, chemicals, etc.)
> - Environmental impact flags"

---

## PART 6: CLAIMING A TASK (1 minute)

**[SCREEN: Task detail with Claim button]**

### Claiming Process

> "Ready to handle this? Look at the 'Claim Task' button at the bottom."

**[ACTION: Tap 'Claim Task']**

**[SCREEN: Confirmation dialog or success]**

> "Claimed! Several things happen:
> 1. Status changes from 'approved' to **'in_progress'**
> 2. Your ID is assigned to this report
> 3. Other workers can no longer claim it
> 4. The citizen is notified that work has begun"

### My Tasks Update

**[ACTION: Navigate to My Tasks tab]**

**[SCREEN: app/(worker)/my-tasks.tsx]**

> "The task now appears in 'My Tasks'. This is your personal work queue."

**[ACTION: Show the claimed task in list]**

> "You can have multiple tasks claimed simultaneously, but manage your time wisely - SLA deadlines apply!"

---

## PART 7: RESOLVING A TASK - Complete Flow (2 minutes)

### Step 1: Navigate to Location

**[ACTION: Tap on claimed task in My Tasks]**

**[SCREEN: app/worker-task/[id].tsx]**

> "From My Tasks, tap your claimed task to see the full detail view."

**[ACTION: Show location/map section]**

> "Use the address or map to navigate to the location. The app shows:
> - Readable address
> - GPS coordinates
> - Distance from current location
> - Map preview"

> "Physically travel to the waste site."

### Step 2: Perform Cleanup

> "At the location, assess the situation:
> - Is it as described?
> - What equipment is needed?
> - Any hazards to be careful of?"

> "Then perform the cleanup:
> - Collect waste into appropriate containers
> - Sort if possible (recyclables, organics, etc.)
> - Ensure the area is completely clean"

### Step 3: Submit Resolution

**[ACTION: Scroll to resolution section]**

> "After cleanup, scroll down to find 'Submit Resolution' or 'Mark Complete'."

**[ACTION: Tap the submission button]**

**[SCREEN: Resolution form]**

> "The resolution form requires:

> **1. After Photo (Required)**"

**[ACTION: Tap camera button]**

> "Take a clear 'after' photo showing the cleaned area. This is compared against the original report image."

**[ACTION: Take photo or show camera view]**

> "Capture the clean location from a similar angle to the original report."

**[ACTION: Photo is captured]**

> "**2. Notes (Required)**"

**[ACTION: Type notes]**

> "Add details like:
> - 'Collected 2 bags of mixed waste'
> - 'Area now clear, waste sent for disposal'
> - 'Notified collection truck for pickup'"

### Submitting Proof

**[ACTION: Tap Submit]**

> "Tap 'Submit Resolution'."

**[SCREEN: Success message / status change]**

> "Done! The status changes to **'pending_verification'**. An admin will now review your work."

**[ACTION: Show updated status on task]**

> "See how the status badge changed? This task is now awaiting verification."

---

## PART 8: VERIFICATION OUTCOMES (45 seconds)

### Approved Resolution

**[SCREEN: Task showing 'RESOLVED' status]**

> "When the admin approves your proof, the task becomes **RESOLVED**:
> - ✅ Green badge appears
> - The original citizen receives notification
> - Your completion count increases
> - EcoPoints or incentives are credited"

### Rejected Resolution

**[SCREEN: Mention or show rejected scenario]**

> "If the admin finds the cleanup insufficient:
> - Status reverts to 'approved'
> - You receive feedback on what's missing
> - The task reappears in My Tasks
> - You must redo and submit new proof"

> "This ensures quality and accountability."

---

## PART 9: WORKER PROFILE & STATS (45 seconds)

**[ACTION: Navigate to Profile tab]**

**[SCREEN: Worker profile view]**

> "The Profile tab shows your worker statistics:"

**[ACTION: Point to various stats]**

> "**Performance Metrics:**
> - Total Tasks Completed (lifetime)
> - Tasks This Month
> - Average Resolution Time
> - Approval Rate (accepted/rejected ratio)"

> "**Leaderboard Position:**
> - Rank among workers in your ward
> - Points earned
> - Streak bonuses for consistent work"

### Incentives

> "High performers may receive:
> - Recognition from supervisors
> - Priority task access
> - Bonus incentives"

---

## PART 10: SLA & DEADLINES (45 seconds)

**[SCREEN: Task with SLA indicator]**

> "Clear City implements Service Level Agreements for accountability."

**[ACTION: Show SLA progress bar if visible - SLAProgressBar.tsx]**

> "The `SLAProgressBar` component (in `components/SLAProgressBar.tsx`) shows:
> - Time remaining before deadline
> - Color changes as deadline approaches:
>   - 🟢 Green: Plenty of time
>   - 🟡 Yellow: Attention needed
>   - 🔴 Red: Overdue or critical"

> "SLA calculations happen in `services/slaCalculator.ts` which considers:
> - Severity level
> - Category
> - Working hours
> - Holiday exclusions"

---

## PART 11: ADDITIONAL WORKER FEATURES (30 seconds)

### Working Hours Reference

**[SCREEN: Working Hours screen]**

> "Workers can check `Working Hours` (`app/working-hours.tsx`) to see:
> - Official shift timings
> - Break schedules
> - Holiday calendars"

### Hierarchy Contact

**[SCREEN: Hierarchy screen]**

> "The `Hierarchy` screen (`app/hierarchy.tsx`) shows:
> - Supervisor contact info
> - Escalation contacts for difficult cases
> - Emergency reporting channels"

---

## PART 12: COMPLETE ECOSYSTEM RECAP (1 minute)

**[SCREEN: Diagram or split screen showing all 3 roles]**

> "Let's recap the complete Clear City ecosystem:

> **Stage 1 - CITIZEN REPORTS**
> 1. Citizen spots waste
> 2. Opens app, creates report (AI or Manual)
> 3. Captures/selects photo
> 4. Fills form, submits
> 5. Status: 'submitted'

> **Stage 2 - ADMIN PROCESSES**
> 6. Admin reviews on web dashboard
> 7. Approves valid reports
> 8. Status: 'approved' (visible to workers)

> **Stage 3 - WORKER RESOLVES**
> 9. Worker sees task in Explore
> 10. Claims it (status: 'in_progress')
> 11. Travels to location, cleans up
> 12. Submits resolution proof
> 13. Status: 'pending_verification'

> **Stage 4 - VERIFICATION**
> 14. Admin compares before/after photos
> 15. Approves resolution
> 16. Status: 'RESOLVED' ✅
> 17. Citizen notified - issue fixed!

> This creates a transparent, accountable, and efficient system."

---

## PART 13: DATABASE & STORAGE (30 seconds)

**[SCREEN: Mention or show diagram]**

> "Behind the scenes, Supabase handles:

> **Database Tables:**
> - `profiles` - User accounts and roles
> - `reports` - All waste reports
> - `workers` - Worker registration data
> - `worker_assignments` - Task tracking

> **Storage Buckets:**
> - `report-images` - Original waste photos
> - `resolution-images` - Cleanup proof photos
> - `worker-documents` - ID proofs

> All with Row Level Security for data protection."

---

## OUTRO (30 seconds)

**[SCREEN: App home screen with resolved reports visible]**

> "That completes our Clear City trilogy!

> Across three videos, we covered:
> 1. **Citizens**: Reporting waste with AI assistance
> 2. **Admins**: Managing the entire ecosystem
> 3. **Workers**: Claiming and resolving tasks

> Clear City transforms waste management from a complaint system into a collaborative, technology-powered solution for cleaner cities.

> The code is modular, scalable, and ready for deployment. Check our documentation for technical details.

> Thanks for watching the complete Clear City walkthrough!"

---

## FINAL SLIDE (15 seconds)

**[SCREEN: Summary slide with tech stack]**

> "**Clear City Tech Stack:**
> - Mobile: React Native + Expo
> - Web: React + Vite + TypeScript
> - Backend: Supabase (PostgreSQL)
> - AI: Google Gemini + YOLOv11
> - Storage: Supabase Storage
> 
> **Thank you!**"

---

## VIDEO NOTES

### All Features Covered:
- ✅ Worker registration flow
- ✅ Document upload for verification
- ✅ Admin approval process (reference)
- ✅ Worker mode interface unlock
- ✅ Explore Tasks (app/(worker)/explore-tasks.tsx)
- ✅ My Tasks (app/(worker)/my-tasks.tsx)
- ✅ Task detail view (app/worker-task/[id].tsx)
- ✅ Claiming tasks
- ✅ Resolution submission with photo proof
- ✅ Approval/rejection outcomes
- ✅ Worker profile & statistics
- ✅ SLA tracking (SLAProgressBar.tsx, slaCalculator.ts)
- ✅ Working hours reference
- ✅ Hierarchy escalation
- ✅ Complete ecosystem flow
- ✅ Database & storage overview

### Files Mentioned:
```
app/
├── (worker)/
│   ├── _layout.tsx
│   ├── explore-tasks.tsx
│   └── my-tasks.tsx
├── worker-task/
│   └── [id].tsx
├── (tabs)/
│   └── profile.tsx (worker registration)
├── hierarchy.tsx
└── working-hours.tsx

components/
├── SLAProgressBar.tsx
└── ReportCard.tsx

services/
├── reportService.ts
├── slaCalculator.ts
└── dataSyncService.ts
```

### Database Tables Used:
- profiles (role = 'worker')
- workers (registration data)
- reports (status, assigned_worker_id)
- worker_assignments (tracking)

### Technical Requirements:
- Mobile app running
- Verified worker account
- Several approved reports in the database
- At least one claimed task
- Camera access for resolution photos
