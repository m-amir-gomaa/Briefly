# Briefly Pentagram: Node Initialization Script

This script helps initialize the distributed storage and database clusters on a new node.

```bash
#!/bin/bash

set -e

echo "--- Briefly Node Setup ---"

# 1. Initialize CockroachDB
if ! command -v cockroach &> /dev/null; then
    echo "CockroachDB not found. Please install it via nix-shell."
    exit 1
fi

echo "Initializing CockroachDB..."
# If this is the seed node (laptop-alpha)
if [ "$HOSTNAME" == "laptop-alpha" ]; then
    cockroach init --insecure --host=localhost:26257
else
    echo "Waiting for laptop-alpha to join..."
fi

# 2. Setup MinIO Credentials
echo "Setting up MinIO credentials..."
mkdir -p /etc/nixos/secrets
if [ ! -f /etc/nixos/secrets/minio-credentials ]; then
    echo "MINIO_ROOT_USER=briefly_admin" > /etc/nixos/secrets/minio-credentials
    echo "MINIO_ROOT_PASSWORD=briefly_storage_secret" >> /etc/nixos/secrets/minio-credentials
    chmod 600 /etc/nixos/secrets/minio-credentials
fi

# 3. Join Tailscale
if ! tailscale status &> /dev/null; then
    echo "Joining Tailscale mesh..."
    tailscale up --authkey=${TAILSCALE_AUTHKEY}
fi

echo "--- Node Setup Complete ---"
```
