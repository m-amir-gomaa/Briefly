# 🔮 Pentagram: Team Connection & Setup Guide

This guide contains the exact steps and commands every teammate needs to join the **Briefly Pentagram** distributed mesh.

---

## 1. Tailscale: Joining the Private Mesh

Tailscale creates a secure, encrypted network (a "tailnet") between all our laptops. This allows Node Beta to talk to Node Alpha's database as if they were on the same local network.

### Steps for Teammates:

1.  **Install Tailscale**:
    *   **Linux (Physical or KVM)**: `curl -fsSL https://tailscale.com/install.sh | sh`
    *   **Windows (WSL Users)**: **IMPORTANT**: Install the [Tailscale Windows Client](https://tailscale.com/download) on your **Host machine**, not inside WSL. WSL will automatically inherit the connection.
    *   **macOS**: Download from the App Store.

2.  **Authenticate (Join the Mesh)**:
    If on Linux/KVM, run:
    ```bash
    sudo tailscale up --authkey=tskey-auth-EXAMPLE_KEY_HERE
    ```
    If on Windows, simply log in to the Tailscale tray icon.

3.  **Find Your Mesh IP**:
    ```bash
    tailscale ip -4
    ```

4.  **Verify Connection**:
    Try to ping the **Alpha Node** (the Seed):
    ```bash
    ping <ALPHA_NODE_IP>
    ```

---

## 2. Nix: The Reproducible Dev Environment

We use **Nix Flakes** to ensure every developer has the exact same version of Go, Python, and Node. **Do not install these manually.**

### What you need to know:

*   **The Command**: `nix develop`
    *   Run this the moment you `cd` into the repo.
*   **WSL Performance (CRITICAL)**: 
    *   **DO NOT** clone this repo into `/mnt/c/`. It will be extremely slow.
    *   **ALWAYS** clone into your Linux home directory (e.g., `~/projects/Briefly`).

### Why we use it:
- **Zero Conflicts**: We all use the same binary versions.
- **Instant Setup**: No need to spend 2 hours installing dependencies.

---

## 3. Launching Your Node (The Pentagram Command)

Once Tailscale is up and you are in the `nix develop` shell:

1.  **Configure Environment**:
    ```bash
    cp infra/distributed.env.example .env
    ```
    Edit `.env` and set:
    *   `WORKER_ID=node-beta` (or your assigned name)
    *   `DATABASE_URL` pointing to Node Alpha's Tailscale IP.

2.  **Start Your Local Services**:
    ```bash
    docker compose -f docker-compose.node.yml up -d
    ```

3.  **Check Your Status**:
    ```bash
    # See your local services
    docker ps
    
    # Check if you can hit the Alpha node's proxy
    curl http://<ALPHA_IP>:80/api/v1/health
    ```

    > **For non-technical team members / UI testing on phones**:
    > You can bypass the local setup and just visit the public Tailscale Funnel link:
    > `https://briefly-vm.tail0c7099.ts.net/`

---

## 🛠️ Infrastructure Hurdles (Troubleshooting)

### KVM / QEMU Issues
If you are running the Briefly VM on KVM:
*   **Clock Drift**: CockroachDB will shut down if your clock drifts >500ms. Ensure `chrony` is running on your host.
*   **Nested Virtualization**: If your host is already a VM, ensure `KVM` is passed through, or performance will be unusable.
*   **MTU Mismatch**: Tailscale adds overhead. If Docker containers can't reach the internet, try setting Docker MTU to `1280` in `daemon.json`.

### WSL2 Issues
*   **Networking**: If you can't ping Node Alpha, restart WSL (`wsl --shutdown` in PowerShell).
*   **Systemd**: If you insist on running Tailscale *inside* WSL, you must enable systemd in `/etc/wsl.conf`.

---

## 🚀 Commands Summary (Copy-Paste for Team)

**Dev Lead to Team:**
> "Hey team, follow these steps to join the cluster:
> 1. Install Tailscale and Nix.
> 2. Run: `sudo tailscale up` to join the mesh.
> 3. Run: `nix develop` in the repo root.
> 4. Run: `cp infra/distributed.env.example .env` and update your Alpha IP.
> 5. Run: `docker compose -f docker-compose.node.yml up -d` to start your node."

---

> [!IMPORTANT]
> **Privacy Note**: Tailscale only routes traffic intended for our private mesh IPs. It does not monitor your personal internet traffic.
