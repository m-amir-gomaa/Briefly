#!/bin/bash
# Briefly E2E API Test — uses correct multipart form for intake
BASE="http://localhost:8083"
TS=$(date +%s)
EMAIL="e2e_${TS}@briefly.ai"
COOKIES="/tmp/bc_${TS}.txt"

echo "=== Briefly E2E Suite ==="
echo "Email: $EMAIL"
echo ""

echo "[1/5] Register"
REG=$(curl -sf -c "$COOKIES" -X POST "$BASE/api/v1/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"agency_name\":\"E2E Agency\",\"email\":\"$EMAIL\",\"password\":\"Test2026!\"}")
if echo "$REG" | grep -q '"email"'; then
  echo "  ✅ Registered: $(echo "$REG" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("user",{}).get("email",""))' 2>/dev/null)"
else
  echo "  ❌ FAIL: $REG"
  exit 1
fi

echo ""
echo "[2/5] GET /me"
ME=$(curl -sf -b "$COOKIES" "$BASE/api/v1/auth/me")
echo "  ✅ $(echo "$ME" | python3 -c 'import sys,json; d=json.load(sys.stdin); u=d.get("user",d); print(u.get("email",""), "| plan:", u.get("plan_tier",""))' 2>/dev/null)"

echo ""
echo "[3/5] PATCH /me"
UPD=$(curl -sf -b "$COOKIES" -X PATCH "$BASE/api/v1/auth/me" \
  -H 'Content-Type: application/json' \
  -d '{"agency_name":"Updated E2E Agency"}')
echo "  ✅ $(echo "$UPD" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("message",""))' 2>/dev/null)"

echo ""
echo "[4/5] Submit text intake (multipart, Gemini)"
INTAKE=$(curl -sf -b "$COOKIES" -X POST "$BASE/api/v1/intake" \
  -F "raw_text=Build an intelligent freelance marketplace for UI/UX designers with AI project matching and instant invoicing.")
echo "  Response: $INTAKE"
INTAKE_ID=$(echo "$INTAKE" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("intake_id",""))' 2>/dev/null)
echo "  Intake ID: $INTAKE_ID"

if [ -n "$INTAKE_ID" ]; then
  echo "  Polling status (max 90s)..."
  for i in $(seq 1 18); do
    sleep 5
    IDATA=$(curl -sf -b "$COOKIES" "$BASE/api/v1/intake/$INTAKE_ID" 2>/dev/null)
    STATUS=$(echo "$IDATA" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("status",""))' 2>/dev/null)
    printf "    [%2d] %s\n" "$i" "$STATUS"
    if [ "$STATUS" = "completed" ]; then
      echo "  ✅ COMPLETED!"
      python3 << PYEOF
import json, sys

data = json.loads("""$IDATA""")
b = data.get('brief') or {}
summary = str(b.get('summary', ''))[:200]
cot = str(data.get('cot_log', ''))[:200]
print(f"  Summary: {summary}")
print(f"  Provider/COT: {cot}")
PYEOF
      break
    fi
    if [ "$STATUS" = "failed" ]; then
      echo "  ❌ FAILED"
      break
    fi
  done
fi

echo ""
echo "[5/5] Ollama health check"
TAGS=$(curl -sf http://localhost:11434/api/tags 2>/dev/null)
if [ -n "$TAGS" ]; then
  echo "$TAGS" | python3 -c 'import sys,json; print("  ✅ Models:", [m["name"] for m in json.load(sys.stdin).get("models",[])])' 2>/dev/null
else
  echo "  ❌ Ollama not reachable"
fi

echo ""
echo "=== Done ==="
