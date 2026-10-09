# Gym Tracker UI

## Tech Stack

- Vite (Build)
- Capacitor (Multi platform dev)
- ShadCN (Components and Theme)

---

## 📐ENV

Create a `.env` file at the root with the following variables:

```shell
# API
VITE_API_BASE_URL=YOUR-API-BASE-URL-HERE

```

Spotify is configured on the backend. The app reads its public mobile OAuth
settings from `/auth/spotify/mobile-config`.

The app saves the private credential returned by check-in and sends it in the
Authorization header for session and music operations. Guest sessions saved by
older versions without this credential must start a new check-in; the saved name
is retained. Deploy the matching backend and UI changes together.

When testing on Android (Capacitor), `127.0.0.1` points to the device/emulator itself, not your computer backend.

- Android Studio emulator: use `http://10.0.2.2:3000`
- Physical device on same Wi-Fi: use your computer LAN IP, for example `http://192.168.1.10:3000`

---

## Android

This app runs on Android through Capacitor. Before running it, make sure you have:

- Android Studio installed
- An Android emulator open, or a physical device connected with USB debugging enabled
- A valid Android SDK path configured in `android/local.properties` or through `ANDROID_SDK_ROOT`

> Note: `npx cap add android` is usually needed only on first setup (or if the `android/` folder does not exist yet).

### Option 1: Run from the terminal

Use this when you want Capacitor to build and install the app directly on the emulator or device that is already running.

```bash
npm install
npm run build
npx cap add android
npx cap sync android
npx cap run android
```

### Option 2: Open Android Studio and run from there

Use this when you prefer the Android Studio workflow or need to inspect the native Android project.

```bash
npm install
npm run build
npx cap add android
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

The active check-in screen receives participants and music status through an
authenticated Server-Sent Events (SSE) stream at `/gyms/events`. Streaming fetch
sends the private check-in credential in the Authorization header. The client
reconnects automatically, receives a fresh snapshot, and clears live music while
disconnected. Check-in, checkout, and sharing actions still use regular HTTP requests.
Check-in and checkout changes are pushed immediately; Spotify changes follow the
backend's 30-second provider refresh. Deploy the frontend and backend together,
disable proxy buffering for the stream, and allow its 15-second heartbeats.
HTTP/2 is recommended when serving multiple tabs.

This project follows a **Feature-Driven (Modular) Architecture**. Code is organized around business domains and features inside the `src/features/` folder, rather than split entirely by technical types.

### 📁 Directory Structure

```text
src/
├── assets/             # Global static assets
├── components/
│   └── ui/             # Shared global UI components (ShadCN)
├── features/           # Core business domains
│   └── dashboard/      # Dashboard domain
│       ├── components/ # Dashboard-specific elements
│       └── index.ts
├── layouts/            # Global layout wrappers
├── routes/             # Centralized routing configuration and route guards
├── types/              # Shared, global TypeScript definitions
├── utils/              # Global helper functions
├── App.tsx             # Root application component
└── main.tsx            # Vite application entry point
```
