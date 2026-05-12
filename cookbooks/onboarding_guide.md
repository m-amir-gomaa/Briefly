# Briefly Team Onboarding Guide

Welcome to the team! This guide will get you from zero to a running node in the **Pentagram** distributed mesh.

---

## 1. Prerequisites

You must have the following installed on your machine:
- **Nix** (for the reproducible dev shell)
- **Docker** + **Docker Compose** v2
- **Tailscale** (for the private mesh)

Install Nix if you don't have it:
```bash
curl -L https://nixos.org/nix/install | sh
```

---

## 2. Clone & Enter the Dev Shell

```bash
git clone https://github.com/mina-fady1/Briefly.git
cd Briefly
nix develop
```

This gives you the exact versions of Go 1.23, Python 3.11, Node, and all tools locked in `flake.nix`. No version conflicts, no "works on my machine."

---

## 3. Configure Your Environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:

| Variable | Description |
|---|---|
| `GOOGLE_API_KEY` | Your Gemini 1.5 Flash API key |
| `NODE_IP` | Your Tailscale IP (see step 4) |
| `DATABASE_URL` | CockroachDB URL (Alpha node provides this) |
| `REDIS_URL` | Redis node URL (Alpha node provides this) |
| `REDIS_CLUSTER_MODE` | `false` for local dev, `true` for multi-node |

---

## 4. Join the Private Mesh (Tailscale)

We use Tailscale to connect all 5 laptops without touching router settings.

```bash
# Install and authenticate
sudo tailscale up

# Get your node IP
tailscale ip -4
```

Share your Tailscale IP with the Team Lead. They will confirm when you appear in the mesh.

---

## 5. Launch the Stack

**Single-machine (local dev):**
```bash
docker compose up -d --build
```

**Distributed (joining the Pentagram mesh):**
```bash
docker compose -f docker-compose.distributed.yml up -d --build
```

Services and ports:

| Service | Port | Description |
|---|---|---|
| `api-alpha` | `8080` | Go REST API (primary) |
| `api-beta` | `8081` | Go REST API (secondary) |
| `worker-alpha` | `8001` | Python AI worker |
| `frontend` | `3000` | Vite dev server |
| `crdb-alpha` | `26257` | CockroachDB SQL |
| `crdb-alpha` | `26258` | CockroachDB Console UI |
| `redis-alpha` | `6379` | Redis |
| `minio-alpha` | `9000/9001` | MinIO (S3-compatible storage) |

---

## 6. Verify Your Node is Healthy

```bash
# Check all containers are running
docker compose -f docker-compose.distributed.yml ps

# Check Go API logs
docker logs api-alpha --tail 30

# Check AI worker logs
docker logs worker-alpha --tail 30

# Check CockroachDB cluster health
open http://localhost:26258
```

The AI worker is healthy when you see:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8001
```

The Go API is healthy when you see routes registered:
```
[GIN-debug] POST   /api/v1/intake
[GIN-debug] GET    /api/v1/events/:intake_id
```

---

## 7. Know Your Cookbooks

Before writing any code, read your team role's cookbook:

| Role | Cookbook |
|---|---|
| Frontend | `cookbooks/frontend_cookbook.md` — Vite + React + Zustand |
| Backend | `cookbooks/backend_cookbook.md` — Go + Gin + CockroachDB |
| AI/ML | `cookbooks/ai_cookbook.md` — Python + LangGraph + Gemini |
| DevOps | `cookbooks/devops_cookbook.md` — NixOS + Docker + Tailscale |

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `go mod download` fails at build | `rm backend/go.sum && docker compose build` — the Dockerfile runs `go mod tidy` |
| Worker crashes with `NameError` | Make sure all state references use `IntakeState`, not `ShipmentState` |
| API can't reach DB | Check `DATABASE_URL` in `.env` points to the Alpha node's CockroachDB |
| SSE events not streaming | Check Nginx has `proxy_buffering off` on the `/events/` location block |
| Git LFS hook errors | `rm -f .git/hooks/post-checkout` then re-run the git command |
