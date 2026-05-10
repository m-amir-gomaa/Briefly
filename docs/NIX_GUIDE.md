# Briefly: Nix Development Guide

This guide provides the team with instructions on how to leverage the Nix package manager for a consistent, reproducible development environment.

## 1. Prerequisites

Ensure you have **Nix** installed with **Flakes** enabled.

### Installation
If you don't have Nix, use the [Determinate Systems installer](https://github.com/DeterminateSystems/nix-installer) (recommended):
```bash
curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | sh -s -- install
```

### Enabling Flakes
If you used the official installer, add this to `~/.config/nix/nix.conf`:
```text
experimental-features = nix-command flakes
```

---

## 2. Entering the Environment

Project Briefly defines two primary development shells in `flake.nix`.

### A. The Standard Development Shell (Default)
This shell contains everything needed to run the platform locally (Go, Python, Node, PG/Redis clients, etc.).
```bash
nix develop
```
**What's inside:**
- **Backend**: Go 1.22+, gopls, golangci-lint.
- **AI Service**: Python 3.11+, pip, venv.
- **Frontend**: Node.js 20.x, npm.
- **Infra**: PostgreSQL 16 client, Redis, Docker, Docker Compose.
- **Utils**: jq, curl, git.

### B. The Ops & Infrastructure Shell
Used by DevOps leads for deployment and secret management.
```bash
nix develop .#ops
```
**What's inside:**
- **Deployment**: `deploy-rs`.
- **Secrets**: `sops`, `age`, `ssh-to-age`.
- **Monitoring**: `htop`, `tcpdump`.
- **System**: `nixos-rebuild`.

---

## 3. Automation with Direnv (Highly Recommended)

To avoid typing `nix develop` every time you enter the directory, use **direnv**.

1. **Install direnv**: `pkgs.direnv` (already in the nix shell) or via your system manager.
2. **Setup**: Add `eval "$(direnv hook bash)"` (or your shell's equivalent) to your shell profile.
3. **Allow**: Create a `.envrc` file in the root:
   ```bash
   echo "use flake" > .envrc
   direnv allow
   ```
Now, the environment will load automatically whenever you `cd` into the repository.

---

## 4. Common Nix Commands

- **Update Dependencies**: `nix flake update` (Updates `flake.lock`).
- **Check Health**: `nix flake check` (Runs basic linting/validation).
- **Clean Environment**: `nix-collect-garbage -d` (Removes old, unused dependencies from your Nix store).

---

## 5. Why Nix?

- **Zero "It works on my machine" issues**: We all use the exact same binary versions of Go, Node, and Python.
- **No manual installs**: Simply clone the repo and `nix develop`. No need to manually install heavy runtimes.
- **Isolated Runtimes**: The project dependencies don't pollute your global system path.

---

**Questions?** Reach out to the DevOps lead or check the `flake.nix` file in the root.
