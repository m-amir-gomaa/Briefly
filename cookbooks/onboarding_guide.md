# Briefly Team Onboarding Guide

Welcome! This guide will get you from zero to a running node in Briefly's **Pentagram** distributed overlay mesh.

---

## 1. Local Prerequisites
Ensure the following tools are installed:
*   **Nix** (for reproducible dev shell versions)
*   **Docker & Docker Compose** v2
*   **Tailscale** (to join the private overlay VPN)

---

## 2. Clone & Enter the Dev Shell
Nix locks down exact versions of Go 1.23, Python 3.11, and Node:
```bash
git clone https://github.com/m-amir-gomaa/Briefly.git
cd Briefly
nix develop
```

---

## 3. Configure Your Overlay Environment
Copy the distributed environment template:
```bash
cp infra/distributed.env.example .env
```
Open `.env` and configure:
*   `ENCRYPTION_KEY`: A cryptographically secure 32-byte string (e.g. `super_secret_encryption_key_32_c`).
*   `JWT_SECRET`: Secret for signing JSON Web Tokens.
*   `STRIPE_SECRET_KEY` & `STRIPE_PRO_PRICE_ID`: Stripe keys.

---

## 4. Join the Pentagram Mesh

**Alpha Node (Seed Server):**
```bash
docker compose -f docker-compose.node.yml --profile data up -d --build
```

**Joiner Node (Teammates):**
```bash
docker compose -f docker-compose.node.yml up -d --build
```

---

## 5. System Health Audits
Verify the stack compiles and runs flawlessly:

```bash
# Check container status
docker compose ps

# Go Backend Compilation Audit
go build -o /dev/null ./cmd/api

# React TypeScript Type Audit
npx tsc --noEmit
```
All checks must pass with zero compilation errors.
