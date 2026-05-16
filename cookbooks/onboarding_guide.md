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
git clone https://github.com/m-amir-gomaa/Briefly.git
cd Briefly
nix develop
```

This gives you the exact versions of Go 1.23, Python 3.11, Node, and all tools locked in `flake.nix`. No version conflicts, no "works on my machine."

---

## 3. Launch the Standardized VM

To ensure a clean environment, we provide a pre-configured NixOS VM.

```bash
# Build and run the Briefly VM
nix build .#nixosConfigurations.vm.config.system.build.vm && ./result/bin/run-briefly-vm-vm
```

The VM will start and map:
- **SSH**: `localhost:2223` (User: `briefly`, Password: `briefly_secret`)
- **Web**: `localhost:9999`

---

## 4. Configure Your Environment

```bash
cp infra/distributed.env.example .env
```

Edit `.env` and fill in your Tailscale IP and the Alpha node's addresses.

---

## 5. Join the Pentagram Mesh

On your laptop (or inside the VM):

**If you are the Alpha Node (Seed):**
```bash
docker compose -f docker-compose.node.yml --profile data up -d --build
```

**If you are a Joiner Node (Teammate):**
```bash
docker compose -f docker-compose.node.yml up -d --build
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
| SSE events not streaming | Check Caddy has `flush_interval -1` on the `/api/v1/events/*` route |
| Git LFS hook errors | `rm -f .git/hooks/post-checkout` then re-run the git command |
