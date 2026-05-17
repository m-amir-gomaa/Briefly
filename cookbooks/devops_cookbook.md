# PROJECT BRIEFY: THE SRE & DEVOPS MANIFESTO

As the DevOps & Site Reliability Engineer (SRE) lead, you are the guardian of Briefly's availability, security, and performance. Briefly is deployed on a **5-node Pentagram distributed mesh** over a Tailscale overlay VPN. This manifesto is the source of truth for the entire infrastructure topology.

---

## 1. Declarative Infrastructure-as-Code (NixOS & Flakes)
We enforce a strict declarative footprint. Configuration drift is prohibited. If a production node collapses, we re-provision it in under 3 minutes.
*   **The Development Flake (`flake.nix`)**: Locks Go 1.23, Python 3.11, and Node toolchains. Running `nix develop` drops developers into a reproducible, deterministic workspace.
*   **Cluster Orchestration (Colmena / `hive.nix`)**: We manage the 5 nodes atomatically via Colmena. Run `colmena apply` to trigger safe rollbacks in case of validation failures.

---

## 2. Distributed Operations & The Pentagram Mesh
Briefly runs as a decentralized systems cluster across isolated nodes.

### Networking & Service Discovery
*   **VPN Overlay**: All nodes communicate privately via their unique **Tailscale IPv4 address** (100.x.x.x overlay space), completely bypassing the public internet for internal RPC and DB traffic.
*   **Local Simulation**: `docker compose -f docker-compose.distributed.yml up -d --build` simulates the entire multi-container mesh locally.

### Datastores
*   **CockroachDB (Distributed SQL)**: We run CockroachDB across nodes instead of standard Postgres. 
    *   **GORM Hook**: The backend imports `gorm.io/driver/postgres` and maps the PostgreSQL wire protocol.
    *   **DB Console**: Inspect node replicas and replication factors at `http://<ALPHA_IP>:26258`.
*   **Redis Cluster Mode**: The Redis client dynamically switches to `redis.NewClusterClient` if the env variable `REDIS_CLUSTER_MODE=true` is set.

---

## 3. Cryptography & Secrets Management (sops-nix)
Plaintext API keys committed in source control are a critical security vulnerability.
*   **Decryption**: All production secrets (`GOOGLE_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `JWT_SECRET`, and `ENCRYPTION_KEY`) are encrypted using `sops-nix` in `infra/secrets/secrets.yaml`.
*   **Fail-Fast Key Audits**: The Go backend strictly audits the 32-byte `ENCRYPTION_KEY` and the `JWT_SECRET` during bootstrap. If a secret is missing, weak, or has an incorrect size (GCM requires exactly 32 bytes), the API triggers a `log.Fatal` / `panic` and halts execution instantly.

---

## 4. Edge Security & Reverse Proxy (Caddy + Cloudflare)
The most expensive part of our operational cost is LLM API consumption. We protect our boundaries aggressively.
*   **Cloudflare WAF Token Bucket**: Active on `POST /api/v1/intake`.
    *   **Rate Limit**: 5 requests per 5 minutes per IP.
    *   **Action**: Managed Challenge.
*   **Caddy SSE Stream Guard**: Caddy reverse-proxies the EventSource endpoints. The `/api/v1/events/*` block MUST bypass downstream buffering:
    ```caddy
    reverse_proxy {$API_UPSTREAM:http://api-alpha:8080} {
        flush_interval -1
    }
    ```
    Without `flush_interval -1` and `X-Accel-Buffering: no`, Caddy buffers SSE chunks, breaking real-time stream delivery.

---

## 5. Performance Sizing & Garbage Collection (Go GC)
*   **`GOGC=200`**: Set as a standard runtime environment variable. This doubles the memory footprint threshold before triggering garbage collection cycles, drastically reducing CPU overhead and system latency under high-concurrency intakes.
*   **S3-Compatible Pre-signed Uploads**: To prevent memory collapses, raw media binaries are uploaded directly to MinIO (Dev) or Cloudflare R2 (Prod) using pre-signed S3 URLs. The Go REST container never holds upload binary streams in active RAM.

---

## 🚨 SRE SHIP-READY CHECKLIST
- [ ] `flake.lock` hashes are fully committed and locked.
- [ ] `ENCRYPTION_KEY` is precisely 32 bytes and loaded via `sops-nix`.
- [ ] Caddy `flush_interval -1` is active on all gateway endpoints.
- [ ] `GOGC=200` environment variable is active inside backend services.
- [ ] CockroachDB cluster console is locked behind internal Tailscale IPs.
