# PROJECT BRIEFLY: THE DEVOPS MANIFESTO (MASTER COOKBOOK)

## 🚨 MISSION CRITICAL: The Architect's Mandate
As the DevOps lead, you are the guardian of the system's availability, security, and scalability. While the developers focus on logic, you focus on the **Platform**. This cookbook is the high-emphasis guide to ensuring Project Briefly survives a massive hackathon load and wins 1st place.

---

## 1. Local VM Infrastructure (The Core)
We do not use manual configuration. The VM is our "Command Center."
*   **Virtual Machine**: Ensure your VM (Ubuntu 22.04 recommended) has at least 4GB of RAM and Docker installed.
*   **The Orchestration**: Use `docker-compose up -d --build` to launch the entire stack (Go API, Python AI, Redis, Postgres, and MinIO).

## 2. Security & Workspace Isolation (MANDATORY)
Since this project is hosted on a **Private Laptop**, you MUST isolate it from your personal files.
*   **Hypervisor**: Use KVM (Linux) or VirtualBox (Windows/Mac).
*   **Zero-Access Policy**: Do NOT mount your laptop's home directory into the VM.
*   **Network**: Use a "NAT" or "Bridged" network for the VM to keep its traffic isolated from your host's private network.

## 2. Public Access (Cloudflare Quick Tunnel)
Since we are using a VM on a laptop, we use the **Headless Tunnel** to get a public URL without a domain or credit card.
*   **Command**: `cloudflared tunnel --url http://localhost:80`
*   **The URL**: Share the generated `trycloudflare.com` URL with the team.
*   **SSE Fix**: Ensure the Tunnel doesn't time out. The current configuration handles this by default for SSE streams.

## 3. Distributed Storage (MinIO)
We use self-hosted **MinIO** inside the VM to act as our private S3.
*   **Access**: The Go API talks to `http://minio:9000`.
*   **Persistence**: Ensure the `media_data` volume is mounted so files survive a VM reboot.

## 4. The Migration Roadmap (Future)
When the team is ready, we will join the other 4 devices into a **Docker Swarm**.
1.  **Tailscale**: Install on all 5 devices to create the private network.
2.  **Swarm Join**: Use `docker swarm join` to link the laptops.
3.  **Placement**: Update the compose file to move the "AI Workers" to the other laptops.

## 5. Secret Management (Zero Hassle)
*   **Local Shell**: Create a `.env` file inside the VM with your real Gemini API key.
*   **Security**: Only the `ai_worker` container has access to this key.

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
