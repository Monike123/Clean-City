# Video Script 1: Citizen Mobile App - Complete Feature Walkthrough
## Duration: ~8-10 minutes

---

## INTRO (45 seconds)

**[SCREEN: App splash screen or logo]**

> "Welcome to Clear City - India's comprehensive AI-powered waste management platform. 

> Clear City connects three stakeholders in a seamless ecosystem:
> - **Citizens** who report waste issues
> - **Administrators** who manage and verify
> - **Workers** who resolve problems on the ground

> In this first video, I'll demonstrate the complete citizen experience. Let's dive in!"

---

## PART 1: PROJECT ARCHITECTURE OVERVIEW (1 minute)

**[SCREEN: Code editor showing project structure OR diagram]**

> "Before we start, let me briefly explain our technology stack:

> **Mobile App** (what we're demonstrating today):
> - Built with **React Native** and **Expo** for cross-platform support
> - Uses **Expo Router** for file-based navigation
> - **Supabase** for authentication, database, and storage

> **Key files powering this experience:**
> - `app/(auth)/login.tsx` - Authentication screens
> - `app/(tabs)/` - Main citizen interface (Home, Report, Explore, Profile)
> - `services/gemini.ts` - AI integration with Google Gemini
> - `services/reportService.ts` - Database operations
> - `components/` - Reusable UI components like ReportCard, ReportsFeed

> Now let's see it in action!"

---

## PART 2: USER AUTHENTICATION (1.5 minutes)

### Login Screen

**[SCREEN: Login screen - app/(auth)/login.tsx]**

> "Here's our authentication flow, powered by Supabase Auth. The login screen offers email/password authentication."

**[ACTION: Show the login form]**

> "Users enter their credentials. Behind the scenes, this calls `supabase.auth.signInWithPassword()` in our auth store."

### Sign Up Flow

**[ACTION: Tap 'Sign Up' or 'Create Account']**

**[SCREEN: Sign up form]**

> "New users can create an account. Enter:
> - Email address
> - Secure password
> - Confirm password"

**[ACTION: Fill form and submit]**

> "On submission, we create both an auth user AND a profile record in our `profiles` table. The default role is 'citizen'."

**[SCREEN: Home screen after login]**

> "Success! The user is redirected to the home screen. The auth state is managed by Zustand in `store/authStore.ts`."

---

## PART 3: HOME SCREEN - Map & Reports Feed (1.5 minutes)

**[SCREEN: Home tab - app/(tabs)/home.tsx]**

> "The home screen is the citizen's dashboard. It has two main components:"

### Interactive Map

**[ACTION: Focus on the map]**

> "An interactive map shows all waste reports in the area. Each marker represents a report:
> - 🔴 Red: Critical severity
> - 🟠 Orange: High
> - 🟡 Yellow: Medium
> - 🟢 Green: Low/Resolved"

**[ACTION: Tap on a marker]**

> "Tapping a marker shows a preview - the waste type, location, and status."

### Reports Feed

**[ACTION: Scroll down to see reports]**

> "Below the map is the **ReportsFeed** component - from `components/ReportsFeed.tsx`. It shows:
> - Recent reports from the community
> - Pull-to-refresh functionality
> - Cached data via our `cacheService.ts` for offline viewing"

### Report Cards

**[ACTION: Highlight a report card]**

> "Each **ReportCard** (from `components/ReportCard.tsx`) displays:
> - Thumbnail image
> - Waste category with icon
> - Location address
> - Time since submission
> - Status badge
> - Like and share buttons"

---

## PART 4: REPORT TAB - Two Modes (1 minute)

**[ACTION: Navigate to Report tab]**

**[SCREEN: Report tab - app/(tabs)/report.tsx]**

> "The Report tab is the heart of citizen engagement. We offer TWO reporting methods:"

### AI Report Mode

**[ACTION: Highlight AI Report button]**

> "**AI Report** uses Google's Gemini Vision API to automatically analyze waste images. The AI:
> - Identifies waste types (plastic, organic, construction, etc.)
> - Estimates severity and size
> - Detects hazards
> - Writes descriptions
> This is defined in `services/gemini.ts`."

### Manual Report Mode

**[ACTION: Highlight Manual button]**

> "**Manual Report** lets users fill all details themselves - useful when they want complete control or the AI misidentifies something."

---

## PART 5: CREATING AN AI-POWERED REPORT (2.5 minutes)

**[ACTION: Tap AI Report]**

**[SCREEN: Camera view - app/report-camera.tsx]**

> "This screen is our comprehensive report camera - `app/report-camera.tsx`. It's over 1100 lines handling camera, gallery, forms, and submission."

### Camera Interface

**[ACTION: Show camera elements]**

> "The camera interface shows:
> - Mode badge ('AI Mode' or 'Manual Mode')
> - Targeting frame for alignment
> - **Back button** (left)
> - **Gallery button** (left-center) - NEW! Select from photo library
> - **Capture button** (center)
> - **Flip camera** (right)"

### Image Capture Options

**[ACTION: Tap Gallery icon]**

> "Users can choose from gallery using **expo-image-picker**. This triggers `handlePickFromGallery()` which:
> 1. Requests media library permission
> 2. Opens image picker with editing
> 3. Converts to base64
> 4. Proceeds to form"

**[ACTION: Cancel and tap Capture instead]**

> "Or capture live with the camera - `handleCapture()` uses **expo-camera** at 0.3 quality for optimal file size (~200-400KB)."

**[ACTION: Capture photo]**

### Report Form

**[SCREEN: Report form appears]**

> "After capture, the comprehensive form appears. Let's use AI to fill it."

**[ACTION: Tap 'Auto-Fill with AI']**

> "The AI analysis uses `GeminiService.analyzeImage()` which sends the image to Google's Gemini Vision API."

**[WAIT: Analysis loading]**

> "In about 2-3 seconds, the AI returns structured data that auto-populates the form."

**[ACTION: Scroll through filled form]**

### Form Fields Explained

> "The form captures 8 key data points:"

> "**1. Description** - AI-generated or manual summary"

> "**2. Waste Category** - One of 8 types:
> - Household, Plastic, Construction, E-Waste
> - Medical, Hazardous, Organic, Mixed"

> "**3. Severity Level** - Low, Medium, High, or Critical"

> "**4. Estimated Size** - Bag-sized, Pile, Dump site"

> "**5. Duration** - How long it's been there"

> "**6. Urgency** - Normal, Urgent, or Emergency"

> "**7. Hazards** - Sharp objects, toxic chemicals, biomedical, fire risk"

> "**8. Environmental Impact** - Odor, water contamination, blocking access, animal hazards"

**[ACTION: Show location at bottom]**

> "GPS location is auto-captured via **expo-location** with reverse geocoding for readable addresses."

### Submission

**[ACTION: Tap Submit]**

> "On submission, `handleSubmit()` calls `ReportService.uploadImage()` to store the image in Supabase Storage, then `ReportService.createReport()` to save all data."

**[SCREEN: Success message]**

> "Report submitted! The status is set to 'submitted', awaiting admin approval. The user earns EcoPoints for contributing."

---

## PART 6: EXPLORE TAB - Browse & Track Reports (1 minute)

**[ACTION: Navigate to Explore tab]**

**[SCREEN: Explore tab - app/(tabs)/explore.tsx]**

> "The Explore tab lets users browse all reports. It uses `ReportsFeed` component with filtering."

**[ACTION: Show filter options]**

> "Filter by:
> - All Reports
> - My Reports (your submissions)
> - Status (Submitted, In Progress, Resolved)"

### Report Detail Screen

**[ACTION: Tap on a report]**

**[SCREEN: Report detail - app/report/[id].tsx]**

> "The detail screen shows everything about a report:
> - Full-size image
> - Complete metadata
> - SLA timer (if overdue)
> - Current status with color coding
> - Resolution proof when completed"

**[ACTION: Show status badge]**

> "Status progression:
> - ⚪ Submitted → 🔵 Approved → 🟡 In Progress → ✅ Resolved"

**[ACTION: Show like/share buttons]**

> "Users can like reports and share them on social media to spread awareness."

---

## PART 7: PROFILE TAB - Account & Settings (45 seconds)

**[ACTION: Navigate to Profile tab]**

**[SCREEN: Profile tab - app/(tabs)/profile.tsx]**

> "The Profile tab shows user information and settings."

**[ACTION: Scroll through profile]**

> "Here you see:
> - **Profile info**: Name, email
> - **EcoPoints**: Gamification rewards for reporting
> - **Report count**: How many you've submitted
> - **Government Hierarchy**: View escalation structure
> - **Working Hours**: When workers are available
> - **Sign Out** option"

### Become a Worker

**[ACTION: Show worker registration option]**

> "Citizens can apply to become workers. Click 'Apply to be a Worker' to submit an application - we'll cover this in Video 3."

---

## PART 8: ADDITIONAL SCREENS (45 seconds)

### History Screen

**[ACTION: Navigate to History if available]**

> "The **History** screen (`app/history.tsx`) shows all your past reports with filtering by status."

### Hierarchy Screen

**[ACTION: Show hierarchy screen]**

> "The **Hierarchy** screen (`app/hierarchy.tsx`) displays the government escalation structure - who handles what level of issues."

### Working Hours

**[ACTION: Show working hours screen]**

> "**Working Hours** (`app/working-hours.tsx`) shows when municipal workers are available in your area."

---

## PART 9: BEHIND THE SCENES - Services (30 seconds)

**[SCREEN: Code editor briefly OR mention verbally]**

> "Powering all of this are our service files:
> - `reportService.ts` - CRUD operations for reports
> - `gemini.ts` - AI image analysis
> - `cacheService.ts` - Offline data caching
> - `imageCacheService.ts` - Image caching
> - `realtimeService.ts` - Live updates via Supabase
> - `slaCalculator.ts` - SLA deadline calculations
> - `dataSyncService.ts` - Sync management"

---

## OUTRO (30 seconds)

**[SCREEN: Home screen with map]**

> "That's the complete citizen experience in Clear City! 

> We've covered:
> - Authentication and account creation
> - Map-based report visualization
> - AI-powered report creation with camera AND gallery
> - Comprehensive 8-field report forms
> - Report tracking and history
> - Profile management and gamification

> In the next video, we'll explore the Web Admin Dashboard and see how authorities manage all these reports.

> Thanks for watching!"

---

## VIDEO NOTES

### All Features Covered:
- ✅ Login/Signup (Supabase Auth)
- ✅ Home Screen Map (react-native-maps)
- ✅ ReportsFeed component
- ✅ AI Report Mode (Gemini)
- ✅ Manual Report Mode
- ✅ Camera capture (expo-camera)
- ✅ Gallery selection (expo-image-picker) - NEW
- ✅ Location services (expo-location)
- ✅ Complete 8-field form
- ✅ Hazard indicators
- ✅ Environmental impact toggles
- ✅ Explore/filter reports
- ✅ Report detail view
- ✅ Status tracking
- ✅ Profile & EcoPoints
- ✅ Hierarchy & Working Hours screens
- ✅ All service integrations

### Files Mentioned:
```
app/
├── (auth)/login.tsx
├── (tabs)/
│   ├── home.tsx
│   ├── report.tsx
│   ├── explore.tsx
│   └── profile.tsx
├── report-camera.tsx
├── report/[id].tsx
├── hierarchy.tsx
├── working-hours.tsx
└── history.tsx

components/
├── ReportCard.tsx
├── ReportsFeed.tsx
├── ReportForm.tsx
└── SLAProgressBar.tsx

services/
├── reportService.ts
├── gemini.ts
├── cacheService.ts
├── imageCacheService.ts
├── realtimeService.ts
├── slaCalculator.ts
└── dataSyncService.ts
```

### Technical Requirements:
- Expo app running
- Test account or create new
- Some existing reports in database
- Internet for AI analysis
- Device with camera (or use emulator with gallery)
