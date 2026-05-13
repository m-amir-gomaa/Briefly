#!/usr/bin/env bash

# Briefly Pentagram: Teammate Onboarding Script
# Usage: ./scripts/join_cluster.sh <PRIMARY_NODE_IP>

set -e

PRIMARY_IP=$1

if [ -z "$PRIMARY_IP" ]; then
    echo "Usage: ./scripts/join_cluster.sh <PRIMARY_NODE_IP>"
    echo "Example: ./scripts/join_cluster.sh 100.64.0.5"
    exit 1
fi

echo "--- Joining Briefly Cluster ---"
echo "Primary Node IP: $PRIMARY_IP"

# 1. Create .env file for Docker Compose
echo "Generating .env configuration..."
cat <<EOF > .env
PRIMARY_NODE_IP=$PRIMARY_IP
BRIEFLY_DEMO_GEMINI_API_KEY=$BRIEFLY_DEMO_GEMINI_API_KEY
GOOGLE_API_KEY=$GOOGLE_API_KEY
EOF

# 2. Check connectivity to Primary Node (Database Port 26257)
echo "Checking connectivity to Primary Node (100.124.255.38:26257)..."
if command -v nc &> /dev/null; then
    if nc -z -w 5 "$PRIMARY_IP" 26257; then
        echo "✅ Primary node is reachable."
    else
        echo "❌ Primary node NOT reachable on port 26257. Ensure Docker is running on Alpha."
        exit 1
    fi
else
    # Fallback to ping if nc is missing
    if ping -c 1 -W 2 "$PRIMARY_IP" &> /dev/null; then
        echo "✅ Primary node is reachable (via ping)."
    else
        echo "❌ Primary node NOT reachable. Ensure you are on the same Tailscale network."
        exit 1
    fi
fi

# 3. Force clean old ghosts and Start Secondary Node Services
echo "Cleaning old containers and starting node services..."
docker rm -f api-beta worker-beta api-node worker-node &> /dev/null || true
docker compose -f docker-compose.node.yml up -d --build

echo "--- Setup Complete! ---"
echo "Your node (Beta) is now processing requests and contributing to the mesh."
