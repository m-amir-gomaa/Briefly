# Briefly Frontend Cookbook: Vite + React + TypeScript

## Role Summary
You are building the UI/UX that the judges and clients will actually see. The architecture has already been scaffolded in `frontend/`.

**Tech Stack**: **Vite 6**, React 19, TypeScript 5.7, **Tailwind CSS 4** (Vite plugin), Zustand 5, Lucide React, Framer Motion, Axios.

**Run locally**: `npm run dev` in `frontend/` — starts the Vite dev server.

---

## 1. Visual Targets
You are to recreate the provided high-fidelity mockups using Tailwind CSS.
*   **Aesthetics**: Glassmorphism, deep dark mode (`bg-slate-950`), vibrant emerald/cyan accents.
*   **Mockups**: `agency_dashboard_mockup`, `intake_dropzone_mockup`, `public_brief_mockup` in the workspace `assets/` folder.

---

## 2. Directory Structure
```
frontend/src/
├── features/
│   ├── auth/          # Login components
│   ├── briefs/        # Public brief view
│   └── intake/        # Intake form + dropzones
├── components/        # Reusable atoms (buttons, cards, banners)
├── hooks/             # Custom React hooks
├── services/
│   └── api.ts         # All API calls + type definitions (source of truth)
├── store/
│   └── useIntakeStore.ts  # Zustand store for global intake state
└── views/             # Page-level components
```

---

## 3. State Management (Zustand — `useIntakeStore`)
Do NOT use Redux or component-level `useState` for anything that crosses component boundaries. The canonical store is in `src/store/useIntakeStore.ts`.

**State shape** (exactly as implemented):
```typescript
interface IntakeState {
  // UI State
  rawText: string;
  hasAudio: boolean;
  hasImage: boolean;
  status: 'IDLE' | 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'ERROR';
  dashboardStatus: 'IDLE' | 'LOADING' | 'ERROR';
  errorMessage: string | null;
  eventMessage: string | null;

  // Data State
  intakes: IntakeRecord[];
  currentIntakeId: string | null;
  currentIntake: IntakeRecord | null;

  // Actions
  setRawText, setHasAudio, setHasImage, setMediaStatus, setStatus, setIntakeId,
  refreshTrackedIntakes, fetchIntake, submitIntake, subscribeToEvents, reset
}
```

**Key rule**: Tracked intake IDs are persisted to `localStorage` under the key `briefly_tracked_intakes`. The dashboard calls `refreshTrackedIntakes()` on mount to re-hydrate state.

---

## 4. API Contract (`src/services/api.ts`)
These are the **canonical types** shared between frontend and backend. Do not change these without coordinating with the backend team.

```typescript
// Intake types
type IntakeType = 'TEXT' | 'VOICE' | 'IMAGE' | 'MULTI'
type BackendIntakeStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

// Brief types
interface BriefGoal       { title: string; detail: string }
interface BriefAmbiguity  { field_missing: string; reason: string; suggested_question: string }
interface BriefRecord     { id, intake_id, summary, goals: BriefGoal[], success_criteria: string[], ambiguities: BriefAmbiguity[], followup_questions: string[], confidence_score, tone_profile, share_token, is_confirmed, ... }
interface IntakeRecord    { id, user_id?, type, raw_text, audio_url?, image_url?, status, brief?: BriefRecord | null, created_at, updated_at }
```

**Important**: The backend returns JSONB fields (goals, ambiguities, etc.) as raw JSON strings. The `normalizeBrief()` and `normalizeIntake()` helpers in `api.ts` handle this parsing — always use them.

---

## 5. Real-Time Streaming (SSE)
We use **Server-Sent Events** (native `EventSource`). WebTransport is future work. The `subscribeToEvents(id)` action in the Zustand store handles the full lifecycle:

```typescript
// Already implemented in useIntakeStore.ts
subscribeToEvents: (id) => {
  const eventSource = new EventSource(`/api/v1/events/${id}`);
  eventSource.onmessage = (event) => {
    if (event.data === 'COMPLETED' || event.data === 'FAILED') {
      // update status, close stream, refresh dashboard
    } else {
      set({ eventMessage: event.data }); // show progress banner
    }
  };
}
```

Do not create a second EventSource for the same `intake_id`. Always go through the store action.

---

## 6. How to Build a Component (AI Agent Prompt)
When you want an AI (like Cursor) to build a component, paste this exact prompt:
> *"I need a React component using Tailwind CSS 4 that matches the 'Intake Dropzone' mockup. Follow the Briefly Frontend Cookbook: Use `lucide-react` for icons. Do not use local component state for the text area; instead, bind it to `useIntakeStore().rawText`. The component lives in `src/features/intake/`."*

## 7. Review & Ship
Verify the handler has no race conditions, all state mutations go through the Zustand store, and the component uses no more than 1 network request on mount. If it looks like the mockup, commit and push.
