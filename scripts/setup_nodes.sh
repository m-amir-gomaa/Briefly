#!/bin/bash
# Briefly Pentagram: Node Initialization Script

set -e

echo "🔮 Initializing Pentagram Node..."

# 1. Verify Tailscale
if ! command -v tailscale &> /dev/null; then
    echo "❌ Tailscale not found. Please install it first."
    exit 1
fi

TS_IP=$(tailscale ip -4)
echo "✅ Detected Tailscale IP: $TS_IP"

# 2. Pull latest images
echo "🔄 Pulling latest service images..."
docker compose -f docker-compose.distributed.yml pull

# 3. Start local node services
echo "🚀 Starting Node services..."
docker compose -f docker-compose.distributed.yml up -d

echo "✨ Node is now part of the Pentagram."
echo "🔗 Tailscale IP: $TS_IP"
echo "🌐 API (Local): http://localhost:8080"
