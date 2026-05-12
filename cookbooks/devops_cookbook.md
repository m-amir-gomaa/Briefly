# PROJECT BRIEFLY: THE DEVOPS MANIFESTO (MASTER COOKBOOK)

## 🚨 MISSION CRITICAL: The Architect's Mandate
As the DevOps lead, you are the guardian of the system's availability, security, and scalability. While the developers focus on logic, you focus on the **Platform**. This cookbook is the high-emphasis guide to ensuring Project Briefly survives a massive hackathon load and wins 1st place.

---

## 1. Declarative Infrastructure (NixOS & Flakes)
We do not use manual configuration. If a server dies, we rebuild it in 3 minutes from a single file.
*   **The Flake (`flake.nix`)**: This is our source of truth. It locks the versions of Go, Python, and Node.js for every developer on the team. 
*   **The Deployment**: We use `deploy-rs`. You will deploy the entire stack to the Oracle ARM VPS with one command: `deploy .#vps`. This ensures atomic rollbacks if a backend dev pushes a breaking change.

## 2. Edge Protection (Cloudflare WAF)
The most expensive part of our system is the AI inference. We cannot allow script kiddies or bots to burn our OpenAI/Groq credits.
*   **Rate Limiting**: You MUST configure a **Token Bucket** rule at the Cloudflare WAF. 
    *   Target: `POST /api/v1/intake`
    *   Limit: 5 requests per 5 minutes per IP.
    *   Action: Managed Challenge (JS Challenge).
*   **Direct IP Protection**: Configure Nginx to drop any traffic that doesn't include the `X-Forwarded-For` header from Cloudflare. We "Lock the Doors" to our VPS.
*   **Edge Caching**: Configure Cloudflare Page Rules to aggressively cache all Next.js static assets (`/_next/static/*`) at the edge nodes.

## 3. Storage Strategy (Cloudflare R2)
We have a 25MB file limit. We DO NOT store these files on our VPS disk.
*   **Pre-Signed URLs**: The Go backend generates a short-lived URL. The client browser/app uploads the binary blob directly to R2. 
*   **Zero-RAM Impact**: This keeps our Go binary's memory footprint under 100MB even during peak uploads.

## 4. Real-Time Streaming & Load Balancing (Nginx)
Standard Nginx configs kill streams by buffering them, and we need HTTP/3 for WebTransport.
*   **HTTP/3 & WebTransport**: Ensure Nginx is built with QUIC support. Configure `listen 443 quic reuseport;` and `add_header Alt-Svc 'h3=":443"; ma=86400';` to enable blazing fast UDP streams.
*   **The "Typing Effect" Fix**: In `infra/nginx/nginx.conf`, you must ensure `proxy_buffering off;` and `proxy_set_header Connection '';` are set for the `/events/` route. Without this, the frontend will feel broken and "laggy".
*   **Load Balancing**: Use Nginx `upstream` block to Round-Robin traffic across multiple Go backend Docker containers if the load requires it.

## 5. Secret Management (sops-nix)
Plaintext API keys in GitHub are an automatic 0/10 in a security audit.
*   **Encryption**: All keys (DB password, OpenAI, Groq) are stored in `infra/secrets/secrets.yaml`.
*   **Access**: Only the `briefly-api` and `briefly-worker` systemd services have access to the decrypted filesystem paths at `/run/secrets/`.

## 6. How to Lead the Team with AI
When the team needs a new infra piece, use this prompt for your AI agent:
> *"I am the DevOps Lead for Briefly. We use NixOS and Nginx. I need a configuration for a Redis-backed read-through cache for our public briefs. Follow the DevOps Cookbook: Ensure it uses `volatile-lru` eviction and is restricted to local network access only."*

---

## 🚨 DEVOPS CHECKLIST FOR SHIPPING
- [ ] `flake.lock` is committed and up to date.
- [ ] Cloudflare WAF Token Bucket is active.
- [ ] Nginx `proxy_buffering` is OFF for SSE.
- [ ] `GOGC=200` is set in the production env.
- [ ] Sops-nix secrets are mapped to the correct service env vars.
