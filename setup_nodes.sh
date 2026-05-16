#!/bin/bash

set -e

echo "--- Briefly Node Setup ---"

# 1. Join Tailscale
if ! tailscale status &> /dev/null; then
    echo "Joining Tailscale mesh..."
    if [ -z "$TAILSCALE_AUTHKEY" ]; then
        echo "Error: TAILSCALE_AUTHKEY environment variable is not set."
        exit 1
    fi
    tailscale up --authkey=${TAILSCALE_AUTHKEY}
else
    echo "Tailscale is already connected."
    tailscale status
fi

# 2. Verify Docker
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Please ensure Docker is installed."
    exit 1
fi

echo "--- Node Setup Complete ---"
echo "To start the application, ensure your .env file is populated and run:"
echo "docker-compose up -d"
