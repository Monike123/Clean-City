# Environment Tech - Project Setup Guide

This is a monorepo project containing a mobile app (Expo/React Native) and a web app (Vite/React) for environmental worker management.

## 📋 Prerequisites

Before you begin, ensure you have the following software installed:

### Required Software

1. **Node.js** (v18.x or higher recommended)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version` and `npm --version`

2. **Git** (for version control)
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

3. **For Mobile Development:**
   - **Expo Go App** on your mobile device
     - iOS: Download from App Store
     - Android: Download from Google Play Store
   - OR install Android Studio / Xcode for emulators

4. **Code Editor** (recommended)
   - Visual Studio Code: https://code.visualstudio.com/

---

## 🚀 First-Time Setup

After transferring the project to your new computer, follow these steps:

### 1. Extract and Navigate
```bash
# Extract the zip file to your desired location
# Then open terminal/command prompt and navigate to the project
cd path/to/Environment_tech
```

### 2. Install Dependencies
```bash
# Install all dependencies for the monorepo (this will take several minutes)
npm install
```

This will install dependencies for:
- Root monorepo
- Mobile app (`apps/mobile`)
- Web app (`apps/web`)
- All shared packages (`packages/*`)

---

## 📱 Running the Mobile App

### Start Development Server
```bash
# Navigate to mobile app directory
cd apps/mobile

# Start Expo development server
npm start
# OR for a clean start (clears cache)
npm run clear
```

### Run on Device/Emulator
After starting the dev server, you'll see a QR code in the terminal:

- **On Physical Device:** 
  - Install Expo Go app
  - Scan the QR code with your camera (iOS) or Expo Go app (Android)

- **On Android Emulator:**
  ```bash
  npm run android
  ```

- **On iOS Simulator (Mac only):**
  ```bash
  npm run ios
  ```

---

## 🌐 Running the Web App

### Start Development Server
```bash
# Navigate to web app directory
cd apps/web

# Start Vite development server
npm run dev
```

The web app will be available at: `http://localhost:5173` (or the port shown in terminal)

### Build for Production
```bash
cd apps/web
npm run build
```

---

## 🏗️ Project Structure

```
Environment_tech/
├── apps/
│   ├── mobile/          # Expo React Native mobile app
│   └── web/             # Vite React web app
├── packages/            # Shared packages/libraries
├── database-migrations/ # Database migration files
├── AUTHORITY_LOGIC.md   # Business logic documentation
├── WORKER_LOGIC.md      # Worker logic documentation
└── package.json         # Root monorepo configuration
```

---

## 🛠️ Common Commands

### Mobile App (`apps/mobile`)
```bash
npm start         # Start Expo dev server
npm run clear     # Start with cleared cache
npm run android   # Run on Android
npm run ios       # Run on iOS
```

### Web App (`apps/web`)
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Root (Monorepo)
```bash
npm install      # Install all dependencies
```

---

## 🧹 Cleaning the Project (Before Transfer)

To prepare the project for transfer/compression:

```bash
# From project root, remove all node_modules and build artifacts
# Windows PowerShell:
Get-ChildItem -Path . -Include node_modules,.expo -Recurse -Directory | Remove-Item -Recurse -Force

# Windows Command Prompt:
for /d /r . %d in (node_modules) do @if exist "%d" rd /s /q "%d"
for /d /r . %d in (.expo) do @if exist "%d" rd /s /q "%d"

# Linux/Mac:
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
find . -name ".expo" -type d -prune -exec rm -rf '{}' +
```

After cleaning, remember to run `npm install` on the new computer!

---

## ⚠️ Troubleshooting

### Issue: npm install fails
- **Solution:** Delete `package-lock.json` and `node_modules`, then run `npm install` again
- Ensure you're using a compatible Node.js version (18.x or higher)

### Issue: Expo app won't connect
- Ensure your computer and phone are on the same WiFi network
- Try running `npm run clear` to clear Expo cache
- Check firewall settings

### Issue: Port already in use
- Web app: The default port is 5173, you can change it in `vite.config.ts`
- Mobile: Expo will automatically find an available port

### Issue: Type errors in mobile app
- Run `npm install` in the `apps/mobile` directory
- Ensure all workspace dependencies are installed

---

## 📝 Environment Variables

Some features may require environment variables. Check for:
- `.env` files in `apps/mobile` and `apps/web`
- Supabase configuration (for database)
- API keys (Google Generative AI, etc.)

Create `.env` files based on `.env.example` if they exist.

---

## 📞 Additional Notes

- **Expo SDK Version:** 54.x
- **React Version:** 19.1.0 (mobile), 18.2.0 (web)
- **React Native Version:** 0.81.5
- **TypeScript:** Enabled in all projects

For more detailed documentation, refer to:
- [AUTHORITY_LOGIC.md](./AUTHORITY_LOGIC.md)
- [WORKER_LOGIC.md](./WORKER_LOGIC.md)
- [WORKER_LOGIC_TECHNICAL.md](./WORKER_LOGIC_TECHNICAL.md)

---

**Good luck with your project! 🎉**
