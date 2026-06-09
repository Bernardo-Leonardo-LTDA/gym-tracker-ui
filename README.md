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
