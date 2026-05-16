# Masterclass: Briefly React Frontend

The frontend is a modern **React** application built with **Vite**, **TypeScript**, and **Tailwind CSS**. It focuses on speed, accessibility, and real-time user feedback.

## 1. Technical Stack
- **Vite**: The build tool. It provides near-instant Hot Module Replacement (HMR) during development.
- **TypeScript**: Used for strict typing across the app. This prevents "undefined" errors when handling complex AI project briefs.
- **Tailwind CSS**: A utility-first CSS framework. It allows us to build premium, custom designs without writing thousands of lines of CSS.
- **Zustand**: A lightweight state management library used for authentication and global UI state.

## 2. Dynamic Component Architecture
We use a modular approach to UI:
- **`AppLayout`**: The shell of the application (sidebar, header, content area).
- **`BriefViewer`**: A complex component that renders the AI-generated brief. It uses "Skeleton Loaders" to show progress while data is being fetched.
- **`IntakeWizard`**: A multi-step form that handles text inputs and file uploads (drag-and-drop).

## 3. Real-time UX: SSE Integration
The frontend doesn't just "refresh the page." It uses an **EventSource** (SSE) listener:
1.  When a user submits an intake, the frontend starts listening to `/api/v1/events/:intake_id`.
2.  The UI shows a "Processing..." state with real-time status updates (e.g., "Transcribing audio...", "Reviewing ambiguities...").
3.  When the final event (`COMPLETED`) is received, the frontend automatically triggers a fetch for the new brief and updates the UI instantly.

## 4. API Communication
All communication with the Go backend is centralized in `frontend/src/services/api.ts`.
- **Interceptors**: We use an Axios-style interceptor pattern to automatically attach the JWT token to every outgoing request.
- **Error Handling**: Standardized error toasts notify the user if an upload fails or the session expires.
