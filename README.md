# Gym Tracker UI

## Tech Stack

- Vite (Build)
- Capacitor (Multi platform dev)
- ShadCN (Components and Theme)
- Zustand (State control)

---

## 📐ENV

- You should create an .env file to add these env vars:

```shell
VITE_API_BASE_URL=http://127.0.0.1:3000
```

---

## Android

This app runs on Android through Capacitor. Before running it, make sure you have:

- Android Studio installed
- An Android emulator open, or a physical device connected with USB debugging enabled
- A valid Android SDK path configured in `android/local.properties` or through `ANDROID_SDK_ROOT`

### Option 1: Run from the terminal

Use this when you want Capacitor to build and install the app directly on the emulator or device that is already running.

```bash
npm install
npm run build
npx cap sync android
npx cap run android
```

### Option 2: Open Android Studio and run from there

Use this when you prefer the Android Studio workflow or need to inspect the native Android project.

```bash
npm install
npm run build
npx cap sync android
```

Then:

1. Open the `android/` folder in Android Studio.
2. Wait for Gradle sync to finish.
3. Select your emulator or connected device.
4. Click `Run` to install and launch the app.

If Android Studio or Capacitor cannot find the SDK, verify the `sdk.dir` value inside `android/local.properties`.

---

## Project Architecture

This project follows a **Feature-Driven (Modular) Architecture**. Code is organized around business domains and features inside the `src/features/` folder, rather than split entirely by technical types.

### 📁 Directory Structure

```text
src/
├── assets/             # Global static assets
├── components/
│   └── ui/             # Shared global UI components (ShadCN)
├── config/             # Global configurations, environment variables, and constants
├── features/           # Core business domains
│   └── dashboard/      # Dashboard domain
│       ├── components/ # Dashboard-specific elements
│       └── index.ts
├── layouts/            # Global layout wrappers
├── routes/             # Centralized routing configuration and route guards
├── stores/             # Global state management instances (Zustand)
├── types/              # Shared, global TypeScript definitions
├── utils/              # Global helper functions
├── App.tsx             # Root application component
└── main.tsx            # Vite application entry point
```
