# Briefly Frontend Cookbook: React/Vite

## Role Summary
You are building the UI/UX that the judges and clients will actually see. The architecture has already been scaffolded in `frontend/`. 
**Tech Stack**: Vite, React, Tailwind CSS, Zustand, Lucide React.

## 1. Visual Targets
You are to recreate the provided high-fidelity mockups using Tailwind CSS. 
*   **Aesthetics**: Glassmorphism, deep dark mode (`bg-slate-950`), vibrant emerald/cyan accents.
*   **Core Interfaces**:
    *   `hero_landing_mockup.jpeg`: Marketing hero section.
    *   `product_workflow_mockup.jpeg`: Workflow overview ("Collect -> Generate -> Share").
    *   `agency_dashboard_mockup.jpeg`: Main dashboard showing the "Brief pipeline".
    *   `intake_dropzone_mockup.jpeg`: Multi-modal intake screen (Audio/Image/Text).
    *   `workspace_settings_mockup.jpeg`: Account/Workspace settings and billing.

## 2. State Management & Auth (Zustand & JWT)
Do NOT use Redux or `useState` for global logic. Use the pre-scaffolded Zustand stores in `src/store/`:
*   `useAuthStore`: Manages the agency session. Auth is handled via HTTP-Only JWT cookies provided by the Go API. Do not store tokens in `localStorage`.
*   `useIntakeStore`: Manages the drafted text, media toggles, and `status` ('IDLE' -> 'UPLOADING' -> 'PROCESSING').

## 3. Real-Time Streaming (SSE)
You will not use WebSockets or WebTransport. To receive real-time, zero-stutter updates from the AI pipeline, connect to the Go API using standard `EventSource` (SSE).
```javascript
// Example SSE connection
const eventSource = new EventSource(`/api/v1/events/${intakeId}`);
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Update state
};
```

## 4. How to Build Using an AI Agent
When you want an AI (like Cursor or Gemini) to build a component for you, paste this exact prompt:
> *"I need a React component using Tailwind CSS that matches the 'Intake Dropzone' mockup. Follow the Briefly Frontend Cookbook: Use `lucide-react` for icons. Do not use local component state for the text area; instead, bind it to `useIntakeStore().rawText`."*

## 5. Review & Ship
Once the AI generates the component, verify that it is responsive and uses no more than 1 network request on mount. If it looks exactly like the mockup, commit and push.
