# Briefly Backend Cookbook: Go + Gin + GORM

You are managing the high-concurrency REST engine of the Briefly platform. It connects the React client to the CockroachDB datastore and orchestrates the Redis task queues.

---

## 1. 🔐 Authenticated Cryptography (AES-256-GCM)
We use Galois/Counter Mode (GCM) for database encryption of user credentials.
*   **Security Hooks**: The model `UserAPIKey` implements a GORM `BeforeSave` hook that intercepts plaintext credentials:
    ```go
    func (k *UserAPIKey) BeforeSave(tx *gorm.DB) (err error) {
        if len(k.KeyEncrypted) > 0 && len(k.KeyEncrypted) < 100 {
            encrypted, err := security.Encrypt(k.KeyEncrypted)
            if err != nil { return err }
            k.KeyEncrypted = encrypted
        }
        return nil
    }
    ```
*   **Safety Guards**: The encryption utility prepends a cryptographically secure 12-byte random nonce and validates payload length during base64 decoding to prevent out-of-bounds array slicing panics.

---

## 2. 💳 Stripe Subscription Lifecycle & Webhooks
*   **Signature Verification**: The `/api/v1/billing/webhook` endpoint reads Stripe events and strictly validates their cryptographic signature:
    ```go
    event, err = webhook.ConstructEvent(payload, sigHeader, webhookSecret)
    ```
*   **Synchronized Plan Tiers**:
    *   `checkout.session.completed`: Sets user `PlanTier = "pro"` and links the `StripeCustomerID`.
    *   `customer.subscription.deleted`: Instantly resets `PlanTier = "free"`.
*   **Customer Billing Portal**: The `CreatePortalSession` handler utilizes `portalsession.New` to dynamically direct active Pro users to their hosted Stripe Billing management panel.

---

## 3. 💾 Context-Aware SSE Streams with Heartbeats
We stream AI progress updates in real-time to the browser via **Server-Sent Events (SSE)**.
*   **Request Cancellation**: We replace the deprecated `CloseNotify` with native Go context channels:
    ```go
    case <-c.Request.Context().Done():
        return false // Connection dropped by client
    ```
*   **Keep-Alive Heartbeats**: To prevent load balancers or proxy servers (Caddy) from dropping connections during long-latency inference, the stream utilizes a `time.NewTicker(15 * time.Second)` pushing keep-alive comments.

---

## 4. Database Models (models.go)
Briefly uses GORM to structure records:
*   `User`: Keeps track of authentication, Stripe profile, and `PlanTier` ("free" vs. "pro").
*   `UserAPIKey`: Stores encrypted Gemini credentials, decrypted transparently at inference runtime.
*   `Intake`: Contains submitted textual/media assets and status fields.
*   `Brief`: Stores deep analytical JSONB columns (`goals`, `ambiguities`, `success_criteria`) using GORM's `datatypes.JSON`.
