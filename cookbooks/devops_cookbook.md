# PROJECT BRIEFLY: THE DEVOPS MANIFESTO

## 🚨 MISSION CRITICAL: The Architect's Mandate
As the DevOps lead, you are the guardian of the system's availability, security, and scalability. This cookbook reflects the **actual deployed infrastructure** — the 5-node Pentagram distributed mesh.

---

## 1. Declarative Infrastructure (NixOS & Flakes)
We do not use manual configuration. If a node dies, we rebuild it in 3 minutes from a single file.
*   **The Flake (`flake.nix`)**: Locks the exact versions of Go 1.23, Python 3.11, and Node for every developer. Run `nix develop` to enter the reproducible shell.
*   **The Deployment**: We use `deploy-rs` / Colmena (`hive.nix`). You will deploy the stack with: `colmena apply`. This ensures atomic rollbacks if a dev pushes a breaking change.

---

## 2. Distributed Stack (The Pentagram Mesh)

### Orchestration
*   **Local dev**: `docker compose -f docker-compose.distributed.yml up -d --build`
*   **Multi-node**: Each of the 5 laptops runs the above command. They find each other via their Tailscale IPs.
*   **Go version**: The backend Dockerfile uses **`golang:alpine`** with `go mod tidy` at build time. The `go.mod` declares `go 1.23`.

### CockroachDB (not Postgres)
We run **CockroachDB** (distributed SQL), not a single Postgres instance.
*   The GORM driver is `gorm.io/driver/postgres` (CockroachDB uses the PG wire protocol).
*   DB Console UI: `http://<ALPHA_IP>:26258`
*   Auto-migration logs a non-fatal warning on first run (`uni_users_email` constraint already exists) — this is expected and safe to ignore.

### Redis Cluster Mode
Controlled by the `REDIS_CLUSTER_MODE=true` env var. The Go client switches between `redis.NewClient` (local dev) and `redis.NewClusterClient` (distributed) automatically.

---

## 3. Edge Protection (Cloudflare WAF)
The most expensive part of the system is Gemini AI inference. We must protect it.
*   **Rate Limiting**: Configure a Token Bucket rule at the Cloudflare WAF:
    *   Target: `POST /api/v1/intake`
    *   Limit: 5 requests per 5 minutes per IP.
    *   Action: Managed Challenge.
*   **Cache Headers**: Configure Cloudflare to cache all Vite static assets (`/assets/*`) at edge nodes. **NOT `/_next/static/*`** — we use Vite, not Next.js.
*   **Direct IP Lock**: Configure Caddy to reject traffic that does not include `CF-Connecting-IP` from Cloudflare.

---

## 4. Real-Time Streaming & Caddy
We use **Server-Sent Events (SSE)**, not WebSockets or WebTransport.
*   **SSE Fix**: In `infra/caddy/Caddyfile`, the `/api/v1/events/*` route MUST use:
    ```caddy
    reverse_proxy {$API_UPSTREAM:http://api-alpha:8080} {
        flush_interval -1
    }
    ```
    Without this, the browser's `EventSource` will appear broken and deliver events in batches instead of streaming them live.
*   **Gateway**: Use the `caddy` service in Compose for all demo and mesh traffic. Local VM sets `API_UPSTREAM=http://api:8080`; distributed mesh sets `API_UPSTREAM=http://api-alpha:8080`.

---

## 5. Secret Management (sops-nix)
Plaintext API keys in GitHub are an automatic 0/10 in a security audit.
*   **Encryption**: All keys (`GOOGLE_API_KEY`, `DATABASE_URL`, Redis password) are encrypted in `infra/secrets/secrets.yaml` using `sops-nix`.
*   **Access**: Only the `briefly-api` and `briefly-worker` systemd services can access decrypted values at `/run/secrets/`.
*   **Required keys**: `GOOGLE_API_KEY`, `DATABASE_URL` (CockroachDB), `REDIS_URL`, `REDIS_CLUSTER_MODE`.

---

## 6. CI/CD Pipeline (`.github/workflows/ci.yml`)
Three jobs run on every push to `main`:
1.  **`backend-tests`**: Sets up Go 1.23, runs `go mod tidy` (clears stale `go.sum`), then `go test ./...`.
2.  **`python-lint`**: Sets up Python 3.11, installs from `ai_service/requirements.txt`, lints with **Ruff**.
3.  **`build-and-push`** (push only): Builds and pushes OCI images to **GitHub Container Registry (GHCR)** — `briefly-api:latest` and `briefly-worker:latest`.

---

## 7. Storage (MinIO / Cloudflare R2)
We do NOT store uploaded files on VPS disk.
*   **Dev**: MinIO container (`minio-alpha` in the distributed compose file) provides S3-compatible local storage.
*   **Prod**: Cloudflare R2 bucket.
*   **Pattern**: Go backend generates a pre-signed URL; the browser uploads directly to R2/MinIO. Go binary never holds the binary data in RAM.

---

## 🚨 DEVOPS CHECKLIST FOR SHIPPING
- [ ] `flake.lock` is committed and up to date.
- [ ] `docker-compose.distributed.yml` health checks pass on all 5 nodes.
- [ ] Cloudflare WAF Token Bucket is active on `POST /api/v1/intake`.
- [ ] Caddy `flush_interval -1` is set for the `/api/v1/events/*` route (SSE).
- [ ] `GOGC=200` is set in the production env for the Go API.
- [ ] `REDIS_CLUSTER_MODE=true` is set on all production nodes.
- [ ] `GOOGLE_API_KEY` is injected via sops-nix (NOT plaintext in `.env`).
- [ ] CockroachDB DB Console (`port 26258`) is accessible only on the internal Tailscale network.
