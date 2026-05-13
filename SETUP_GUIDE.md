# Briefly Pentagram: Setup Guide (Distributed Edition)

This document provides temporary instructions for setting up the 5-node distributed cluster. **DELETE THIS FILE** once the team is fully synchronized.

---

## 1. Initial Setup (Your Laptop - Node Alpha)

Your laptop will act as the "Seed Node" (Alpha).

### Step 1: Start the Development Environment
Ensure you are in the `nix-shell` to have all tools available:
```bash
nix develop
```

### Step 2: Launch the Local Simulation
To test the distributed behavior on a single machine, use the new simulation profile:
```bash
docker-compose -f docker-compose.distributed.yml up -d
```
This will start:
- **Node Alpha**: API on port 8080, DB Console on 26258.
- **Node Beta**: API on port 8081 (simulating a teammate).

### Step 3: Initialize the Cluster
Run the helper script to initialize the data layers:
```bash
chmod +x setup_nodes.sh
./setup_nodes.sh
```

---

## 2. Adding Teammates (Nodes Beta-Epsilon)

Follow these steps on each teammate's laptop:

1. **Clone the Repo**: `git clone <repo_url>`
2. **Install Tailscale**: Ensure they join the team's Tailscale mesh.
3. **Environment Setup**:
   - Update `.env` with their specific `WORKER_ID` (e.g., `node-gamma`).
   - Point their `DATABASE_URL` and `REDIS_URL` to `laptop-alpha` (accessible via Tailscale).
4. **Deploy via Nix**:
   ```bash
   colmena apply --on laptop-gamma
   ```

---

## 3. Monitoring the Pentagram

- **Database Health**: Visit `http://localhost:26258` on Node Alpha. You should see all connected nodes in the "Cluster" tab.
- **Storage Health**: Visit `http://localhost:9001`. Verify that erasure coding is active.
- **SSE Events**: Use `curl -N http://localhost:8080/api/v1/events/<intake_id>` to see the distributed worker logs.

---

## 4. Troubleshooting

- **Tailscale Ping**: Ensure nodes can ping each other via their Tailscale IPs.
- **Firewall**: If nodes cannot connect, ensure port `26257` (DB) and `6379` (Redis) are open on the seed node.
- **Nix Drift**: If a node behaves differently, run `nix flake update` and redeploy.


