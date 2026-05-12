#!/bin/bash
# Briefly Cluster: Node Initialization Script
# Works for any number of nodes — 2, 3, or more.
# Run this on EACH laptop joining the cluster.

set -e

NODES_JSON="$(dirname "$0")/../infra/nodes.json"

echo "🔮 Briefly Node Setup"
echo "─────────────────────────────────"

# ── 1. Verify Tailscale ───────────────────────────────────────
if ! command -v tailscale &> /dev/null; then
    echo "❌ Tailscale not found. Install it first: https://tailscale.com/download"
    exit 1
fi

if ! tailscale status &> /dev/null; then
    echo "❌ Tailscale is not connected. Run: sudo tailscale up"
    exit 1
fi

MY_IP=$(tailscale ip -4)
echo "✅ Tailscale IP: $MY_IP"

# ── 2. Detect role from nodes.json ────────────────────────────
if ! command -v jq &> /dev/null; then
    echo "⚠️  jq not found — cannot auto-detect role from nodes.json."
    echo "   Install jq or manually set NODE_ROLE in your .env"
    NODE_ROLE="unknown"
else
    NODE_ROLE=$(jq -r --arg ip "$MY_IP" \
        '.[] | select(.tailscaleIP == $ip) | .role' "$NODES_JSON" 2>/dev/null || echo "")

    if [ -z "$NODE_ROLE" ]; then
        echo "⚠️  Your IP ($MY_IP) is not in infra/nodes.json."
        echo "   Add an entry to nodes.json and re-run this script."
        echo "   Defaulting to 'worker' role."
        NODE_ROLE="worker"
    else
        echo "✅ Role detected from nodes.json: $NODE_ROLE"
    fi
fi

LEAD_IP=$(jq -r '.[] | select(.role == "lead") | .tailscaleIP' "$NODES_JSON" 2>/dev/null || echo "")
echo "✅ Lead node IP: ${LEAD_IP:-"(not found in nodes.json)"}"

# ── 3. Create .env if it doesn't exist ────────────────────────
ENV_FILE="$(dirname "$0")/../.env"
if [ ! -f "$ENV_FILE" ]; then
    echo "📝 Creating .env from .env.example..."
    cp "$(dirname "$0")/../.env.example" "$ENV_FILE"

    # Patch NODE_IP and NODE_ROLE automatically
    sed -i "s|NODE_IP=.*|NODE_IP=$MY_IP|" "$ENV_FILE"
    sed -i "s|NODE_ROLE=.*|NODE_ROLE=$NODE_ROLE|" "$ENV_FILE"

    # For worker nodes, patch the lead node's IP into the URLs
    if [ "$NODE_ROLE" = "worker" ] && [ -n "$LEAD_IP" ]; then
        sed -i "s|crdb-alpha:26257|$LEAD_IP:26257|" "$ENV_FILE"
        sed -i "s|redis://redis-alpha:6379|redis://$LEAD_IP:6379|" "$ENV_FILE"
        sed -i "s|minio-alpha:9000|$LEAD_IP:9000|" "$ENV_FILE"
        sed -i "s|http://api-alpha:8080|http://$LEAD_IP:8080|" "$ENV_FILE"
        echo "✅ Worker node URLs patched to point at lead ($LEAD_IP)"
    fi

    echo "⚠️  .env created. Add your GOOGLE_API_KEY before starting the stack."
else
    echo "ℹ️  .env already exists — skipping creation."
fi

# ── 4. Pull and start the stack ───────────────────────────────
COMPOSE_FILE="$(dirname "$0")/../docker-compose.distributed.yml"
echo ""
echo "🚀 Starting the distributed stack..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build

# ── 5. Report status ──────────────────────────────────────────
echo ""
echo "✨ Node is running."
echo "   Role:          $NODE_ROLE"
echo "   Tailscale IP:  $MY_IP"
echo "   Local API:     http://localhost:8080"
if [ "$NODE_ROLE" = "lead" ]; then
    echo "   CockroachDB:   http://localhost:26258"
    echo "   MinIO:         http://localhost:9001"
fi
echo ""
echo "📋 Share your Tailscale IP ($MY_IP) with the team lead"
echo "   and add yourself to infra/nodes.json."
