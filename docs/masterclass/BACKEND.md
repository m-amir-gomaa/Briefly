# Masterclass: Briefly Go Backend

The Briefly backend is built with **Go** (Golang) using the **Gin** web framework and **GORM** for database interactions. It is designed for high concurrency and type safety.

## 1. Request Lifecycle
Every request to the Briefly API follows this path:
1.  **Caddy Gateway**: Receives the request on port 80 and proxies it to `api:8080`.
2.  **Gin Router**: Matches the URL path to a specific handler.
3.  **Middleware**:
    *   `Recovery`: Prevents the server from crashing if a request panics.
    *   `Logger`: Records request time and status codes.
    *   `AuthMiddleware`: Extracts the JWT from the `Authorization` header and validates the user.
4.  **Handler**: The "Brain" of the request (being refactored for better separation).

## 2. Authentication: JWT & Bcrypt
- **Registration**: Passwords are never stored in plain text. We use `bcrypt` with a cost factor of 10 to hash passwords before saving them to CockroachDB.
- **JWT (JSON Web Tokens)**: Upon login, the server signs a token containing the `user_id`. The client stores this and sends it with every future request.
- **Security**: The `JWT_SECRET` is never hardcoded; it is injected via environment variables.

## 3. The Intake Flow (Asynchronous Processing)
One of the most complex parts of the backend is how we handle project intakes:
1.  **Submission**: User uploads text, audio, or images via a multi-part form.
2.  **Storage**: The Go backend streams the files directly to **MinIO** (S3).
3.  **DB Record**: An `Intake` record is created in CockroachDB with status `PENDING`.
4.  **Enqueuing**: A JSON payload is pushed to the **Redis `intake:queue`**.
5.  **Return**: The server immediately returns a `202 Accepted` to the frontend, keeping the UI responsive while the AI works in the background.

## 4. Real-time Feedback: SSE
We use **Server-Sent Events (SSE)** instead of WebSockets for status updates.
- **Why?**: SSE is simpler, unidirectionally efficient (Server -> Client), and works over standard HTTP without the overhead of a full duplex connection.
- **Implementation**: The backend listens for messages on a Redis pub/sub channel for a specific `intake_id`. When the AI finishes, it publishes a message, and the SSE handler pushes it to the browser.
