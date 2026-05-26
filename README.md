# Gym Tracker UI

## Tech Stack
* Vite (Build)
* Capacitor (Multi platform dev)
* ShadCN (Components and Theme)
* Zustand (State control)

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
