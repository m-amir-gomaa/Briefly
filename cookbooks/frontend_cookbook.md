# Briefly Frontend Cookbook: React/Next.js

## Role Summary
You are building the UI/UX that the judges and clients will actually see. The architecture has already been scaffolded in `frontend/`. 
**Tech Stack**: Next.js (App Router), React, Tailwind CSS, Zustand, Lucide React.

## 1. Visual Targets
You are to recreate the provided high-fidelity mockups using Tailwind CSS. 
*   **Aesthetics**: Glassmorphism, deep dark mode (`bg-slate-950`), vibrant emerald/cyan accents.
*   **Images**: Review the generated images in the workspace (`agency_dashboard_mockup`, `intake_dropzone_mockup`, `public_brief_mockup`).

## 2. State Management & Auth (Zustand & JWT)
Do NOT use Redux or `useState` for global logic. Use the pre-scaffolded Zustand stores in `src/store/`:
*   `useAuthStore`: Manages the agency session. Auth is handled via HTTP-Only JWT cookies provided by the Go API. Do not store tokens in `localStorage`.
*   `useIntakeStore`: Manages the drafted text, media toggles, and `status` ('IDLE' -> 'UPLOADING' -> 'PROCESSING').

## 3. Real-Time Streaming (WebTransport / SSE)
You will not use WebSockets. To receive real-time, zero-stutter updates from the AI pipeline, connect to the Go API using **WebTransport**. If WebTransport is unavailable, fallback to standard `EventSource` (SSE).
```javascript
// Example WebTransport connection
const transport = new WebTransport(`/api/v1/events/${intakeId}`);
await transport.ready;
const reader = transport.datagrams.readable.getReader();
// fallback
// const eventSource = new EventSource(`/api/v1/events/${intakeId}`);
```

## 4. How to Build Using an AI Agent
When you want an AI (like Cursor or Gemini) to build a component for you, paste this exact prompt:
> *"I need a React component using Tailwind CSS that matches the 'Intake Dropzone' mockup. Follow the Briefly Frontend Cookbook: Use `lucide-react` for icons. Do not use local component state for the text area; instead, bind it to `useIntakeStore().rawText`."*

## 5. Review & Ship
Once the AI generates the component, verify that it is responsive and uses no more than 1 network request on mount. If it looks exactly like the mockup, commit and push.
