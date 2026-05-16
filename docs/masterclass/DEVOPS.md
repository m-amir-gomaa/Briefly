# Masterclass: Briefly DevOps Infrastructure

This guide explains the "Ultimate" single-node infrastructure that powers Project Briefly. This architecture was chosen for its extreme stability, observability, and ease of deployment.

## 1. The Foundation: NixOS & Virtualization
We use **NixOS** to define the entire server environment declaratively.
- **Why?**: Unlike traditional Linux distros where you install packages manually, NixOS ensures that the exact same environment is recreated every time you build the VM.
- **`vm.nix`**: Defines the hardware, user (`briefly`), and core services (like Tailscale and Docker).
- **The VM**: We build a QEMU-compatible virtual machine image that can run on your laptop or a cloud provider without configuration drift.

## 2. Networking: Tailscale Funnel
The platform is exposed to the public internet via **Tailscale Funnel**.
- **How it works**:
    1.  The VM runs on your local machine's private network.
    2.  Tailscale creates a secure tunnel between your VM and the global Tailscale network.
    3.  **Funnel** acts as a public entry point, routing HTTPS traffic from `https://briefly-vm.tail0c7099.ts.net/` directly to port 80 inside your VM.
- **Benefit**: Zero-config SSL and no port forwarding required on your home router.

## 3. Container Orchestration: Docker Compose
While NixOS manages the host, **Docker Compose** manages the application stack.
- **PostgreSQL (CockroachDB Mode)**: High-performance relational database.
- **Redis**: Acts as the message broker between the Go Backend and the Python AI Worker.
- **MinIO**: S3-compatible storage for media uploads (audio/images).
- **Caddy**: The edge server. It handles the "Gateway" logic, proxying traffic to the frontend or the API.

## 4. Continuous Deployment: Watchtower
We implemented a professional CD loop:
1.  **CI**: GitHub Actions builds and pushes Docker images to GitHub Container Registry (`ghcr.io`).
2.  **CD**: **Watchtower** runs as a container on the VM. It polls the registry every 5 minutes. If a new image is found, it pulls it and restarts the service gracefully.

## 5. Monitoring: Prometheus & Grafana
- **Prometheus**: Scrapes metrics from the Go API and Python Worker.
- **Grafana**: Provides a visual dashboard to monitor CPU, Memory, and AI pipeline health.
