# Briefly Team Onboarding Guide

Welcome to the team! This guide will help you set up the Briefly platform on your machine and join our private development mesh.

## 1. Prerequisites
You must have **Nix** installed. If you don't, run:
```bash
curl -L https://nixos.org/nix/install | sh
```

## 2. Standardize Your Environment
Clone the repository and enter the development shell. This will automatically install all necessary tools (Go, Node, Python, Docker, etc.) for this project only.

```bash
git clone https://github.com/mina-fady1/Briefly.git
cd Briefly
nix develop
```

## 3. Join the Private Mesh (Tailscale)
We use Tailscale to connect our laptops securely without touching router settings.

1.  **Install Tailscale**: `sudo pkgs.tailscale` (or download from tailscale.com).
2.  **Log in**: `sudo tailscale up`.
3.  **Ask the Lead**: Give your "Tailscale IP" (found via `tailscale ip -4`) to the Team Lead.

## 4. Setting up the Virtual Machine
We run the platform in an isolated NixOS VM to keep your host machine clean.

```bash
# Start the VM (Headless)
nix-shell infra/vm.nix
```

The VM will start and map the following ports to your local machine:
*   `localhost:9999` -> The Website/API
*   `localhost:2223` -> SSH access to the VM

## 5. Giving the Team Lead Access
To allow the Team Lead to help you debug or scale, they need SSH access to your VM.

1.  **Enable SSH Forwarding**:
    Ensure your Tailscale is up.
2.  **Provide SSH Command**:
    Your teammates can now connect to your VM via:
    ```bash
    ssh -p 2223 briefly@<YOUR-TAILSCALE-IP>
    ```

## 6. Running the Stack
Once inside the VM (or from your host if you have Docker installed):
```bash
cd Briefly
docker-compose up -d --build
```

---

### **Troubleshooting**
*   **"Nginx 404"**: Ensure the `frontend` container is finished building (`docker ps`).
*   **"Connection Refused"**: Check if the VM is actually running (`pgrep qemu`).
