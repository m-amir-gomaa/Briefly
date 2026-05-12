# Briefly Pentagram: Node Onboarding & System Guide

Welcome to the **Pentagram**. We are running a 5-node distributed mesh (Alpha, Beta, Gamma, Delta, Epsilon). This system is a hybrid of V0.4 (Stable Frontend/Backend logic) and V0.5 (Infrastructure & AI Pipeline).

## 1. System Overview
- **Architecture**: Distributed Mesh (Tailscale + Docker Compose).
- **Database**: CockroachDB (distributed SQL) + Redis Cluster.
- **AI Engine**: LangGraph + Gemini 1.5 Flash (Pinned to commit `c7c545e`).
- **Frontend**: V0.4 Agency Dashboard (Tailwind + Vite).

## 2. Prerequisites
- **Tailscale**: Connect to the team network to enable inter-node communication.
- **Docker**: All services run in containers via `docker-compose.distributed.yml`.
- **Environment**: Ensure your `.env` contains `GOOGLE_API_KEY` and `NODE_IP` (your Tailscale IP).

## 3. Joining the Cluster
1. **Prepare your node**:
   ```bash
   ./scripts/setup_nodes.sh
   ```
2. **Launch the stack**:
   ```bash
   docker compose -f docker-compose.distributed.yml up -d --build
   ```
3. **Verify Connection**:
   Check if your node appears in the CockroachDB console at `http://<ALPHA_IP>:26258`.

## 4. Components
### 🚀 Backend (Go)
The backend is running V0.4 logic with Pentagram distributed patches. It handles multi-node connection pooling to CockroachDB and distributed Redis.
- Port: `8080`

### 🧠 AI Service (Python)
Pinned to commit `c7c545e09a4e6b43fe9b2dbc69b83bd06eac570b`. This version includes advanced LangGraph "FIX"es and is aligned with the `Intake` terminology.
- Port: `8001`

### 🌐 Frontend (Vite)
Stable V0.4 frontend. Your friend should use this as the base for all UI changes.
- Port: `3000`

## 5. Troubleshooting
- **Terminology**: If the worker fails with a `NameError` related to `ShipmentState`, ensure you have the latest terminology alignment patch (use `IntakeState`).
- **DB Migrations**: The system auto-migrates. If you see constraint errors on first run, they are non-fatal.
