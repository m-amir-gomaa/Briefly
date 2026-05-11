# Project Briefly: Getting Started Guide

Welcome to the Briefly development environment. This guide will take you from a fresh clone to a running platform.

---

## 1. Prerequisites (The Environment)

This project uses **Nix Flakes** to ensure every developer has the exact same version of Go, Python, Node, and Docker.

1.  **Install Nix**: 
    ```bash
    curl -L https://nixos.org/nix/install | sh
    ```
2.  **Enable Flakes**: Ensure `experimental-features = nix-command flakes` is in your `~/.config/nix/nix.conf`.
3.  **Enter the Dev Shell**:
    ```bash
    nix develop
    ```
    *This will drop you into a shell with all dependencies (Go, Python, Node, Docker) pre-installed.*

---

## 2. Local Setup (Start Your Engines)

### A. Environment Variables
Create a `.env` file in the root:
```bash
# AI Worker Secrets
GOOGLE_API_KEY=your_gemini_api_key_here

# Backend Secrets
JWT_SECRET=generate_a_random_string_here
DB_PASSWORD=briefly_secret
DB_USER=briefly
DB_NAME=briefly_db
```

### B. Launch Infrastructure
Start the database, queue, and reverse proxy:
```bash
docker-compose up -d
```
*   **Postgres**: localhost:5432
*   **Redis**: localhost:6379
*   **Nginx**: localhost:80 (Entry point)

### C. Start Services (In separate terminals)

**1. Go Backend**:
```bash
cd backend && go run cmd/api/main.go
```

**2. AI Worker**:
```bash
cd ai_service
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python main.py
```

**3. Frontend**:
```bash
cd frontend && npm install && npm run dev
```

---

## 3. Testing the Flow (Validation)

1.  **Open the Dashboard**: Go to `http://localhost:5173` (or `http://localhost` if using Nginx).
2.  **Login**: Use `demo@briefly.ai` (no password required in demo mode).
3.  **Create Intake**: Paste some text or upload a placeholder image/audio.
4.  **Monitor Logs**:
    *   Watch the **AI Worker** logs for the LangGraph nodes.
    *   Watch the **Backend** logs for the Redis completion worker event.
5.  **Observe SSE**: The dashboard should update from "AI is Analyzing..." to "Brief Ready!" automatically via Server-Sent Events.

---

## 4. Deployment (Putting Things Online)

### A. Cloudflare Setup
1.  **R2**: Create a bucket named `briefly-media`.
2.  **WAF**: Set up a Token Bucket rule for `/api/v1/intake`.

### B. NixOS Deployment
If you are the DevOps lead, enter the **Ops Shell**:
```bash
nix develop .#ops
```

To deploy the stack to the production VPS:
```bash
deploy .#vps
```

### C. Secrets (sops-nix)
To update production secrets without committing them as plaintext:
```bash
sops infra/secrets/secrets.yaml
```

---

## 5. Troubleshooting

*   **CORS Issues**: Ensure the backend is running and the `Access-Control-Allow-Origin` in `main.go` matches your frontend URL.
*   **Redis Errors**: Run `docker-compose logs redis` to check if the queue is active.
*   **Gemini 429**: Check your API quota. The system will eventually fallback to local Llama-3 if configured.

---

**Next Step**: Run `nix develop` and start the stack!
