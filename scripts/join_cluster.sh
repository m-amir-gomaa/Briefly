#!/bin/bash

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

# 2. Check Tailscale connectivity
echo "Checking connectivity to Primary Node..."
if ping -c 1 "$PRIMARY_IP" &> /dev/null; then
    echo "✅ Primary node is reachable."
else
    echo "❌ Primary node NOT reachable. Ensure you are on the same Tailscale network."
    exit 1
fi

# 3. Start Secondary Node Services
echo "Starting api-beta and worker-beta..."
docker compose -f docker-compose.distributed.yml up -d --build api-beta worker-beta

echo "--- Setup Complete! ---"
echo "Your node (Beta) is now processing requests and contributing to the mesh."
