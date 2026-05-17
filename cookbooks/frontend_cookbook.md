# Briefly Frontend Cookbook: Vite + React + TypeScript

You are building the high-fidelity UI of Briefly. It communicates with the Go REST API and renders interactive real-time briefs.

---

## 1. 💾 Resilient Real-Time Streams (SSE + Polling Fallback)
We do not let network latency or temporary dropouts break the client experience. The Zustand store `useIntakeStore.ts` implements a robust connection lifecycle:

### Exponential Backoff & Fallback Polling
*   **The Reconnect Loop**: If the Server-Sent Events (SSE) stream experiences an error, the client attempts to reconnect using an exponential backoff (`Math.pow(2, retryCount) * 1000`).
*   **HTTP Polling Fallback**: If 3 consecutive connection attempts fail, the client automatically falls back to standard HTTP polling (`GET /api/v1/intake/:id`) every 4 seconds until the intake transitions to `COMPLETED` or `FAILED`.
*   **Auto-Cleanup**: Once the state transitions to a final state, both the EventSource and the backup polling interval are safely closed/cleared.

---

## 2. 💳 Stripe Billing Portal Redirection
Active subscription profiles are managed securely using Stripe's hosted Billing Portal.
*   **Dynamic Navigation**: If `user.plan_tier === "pro"`, the upgrade card in `Account.tsx` displays a "Manage Billing" button linking to `createPortalSession()`.
*   **API Interaction**: The client calls `POST /api/v1/billing/create-portal` to fetch the session URL and redirects the window natively:
    ```typescript
    const { url } = await createPortalSession()
    window.location.href = url
    ```

---

## 3. Directory Layout & Architectural Patterns
*   `services/api.ts`: Canonical API types and fetch clients.
*   `store/useIntakeStore.ts`: Global Zustand state tracking raw input, uploading status, active streaming events, and polling fallbacks.
*   `views/Account.tsx`: User profile, plan tier management, and Stripe billing redirects.
*   `views/Dashboard.tsx`: Document dropzones, real-time intake status cards, and the brief analytics display.
