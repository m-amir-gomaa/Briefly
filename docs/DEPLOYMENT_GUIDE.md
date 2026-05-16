# Briefly Deployment Guide

This guide explains how to spin up the entire Briefly platform in a single, perfectly configured NixOS Virtual Machine with an automated public connection to the internet via Tailscale Funnel.

## The Architecture

- **Host Machine**: Your laptop runs Nix.
- **The VM**: A strictly isolated NixOS QEMU Virtual Machine (`infra/vm.nix`).
- **The Stack**: Inside the VM, Docker Compose manages the API, AI Worker, Postgres, Redis, MinIO, and Caddy.
- **The Networking**: The VM runs a `systemd` service (`tailscale-funnel`) that automatically forwards the internal port 80 to the public internet using your Tailscale MagicDNS name (e.g., `https://laptop.tailnet.ts.net`).

## 1. Prerequisites

1. Nix installed with Flakes enabled.
2. A `.env` file containing your production secrets (e.g., `DB_PASSWORD`, `JWT_SECRET`, `MINIO_PASSWORD`, `GOOGLE_API_KEY`) must be present in the root of your `Briefly` directory.

## 2. Building the Virtual Machine

To compile the entire operating system and all dependencies, run the following from the root of the repository:

```bash
nix build .#vm
```

This will create a `result/` symlink containing your executable VM.

## 3. Running the Platform

1. **Boot the VM** in the background:
   ```bash
   ./result/bin/run-briefly-vm-vm &
   ```
2. **Connect to the VM**:
   NixOS automatically forwards the SSH port. The standard password is `briefly_secret`.
   ```bash
   ssh -p 2223 briefly@localhost
   ```
3. **Start the Stack**:
   Once inside the VM, navigate to the mounted workspace and start the Docker Compose cluster:
   ```bash
   cd /opt/briefly
   docker-compose up -d
   ```

## 4. Public Internet Access

You don't need to do anything else! The `tailscale-funnel` service runs automatically inside the VM on boot. As soon as Caddy starts serving traffic on port 80, Tailscale will funnel it securely to the public internet.

You can visit your application at your static Tailscale URL:
`https://<your-machine-name>.<your-tailnet>.ts.net`

*(Make sure your Tailscale Admin Console has Funnel and HTTPS Certificates enabled for your network).*
