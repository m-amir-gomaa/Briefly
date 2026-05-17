#!/bin/bash
# Final QA test — check actual AI content quality
BASE="http://localhost:8083"
TS=$(date +%s)
EMAIL="qa_${TS}@briefly.ai"
COOKIES="/tmp/qa_${TS}.txt"

curl -sf -c "$COOKIES" -X POST "$BASE/api/v1/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"agency_name\":\"QA\",\"email\":\"$EMAIL\",\"password\":\"Pass2026!\"}" > /dev/null

INTAKE=$(curl -sf -b "$COOKIES" -X POST "$BASE/api/v1/intake" \
  -F "raw_text=Build a freelance marketplace for architects and interior designers with AI project matching, milestone-based payments, and portfolio showcasing.")

INTAKE_ID=$(echo "$INTAKE" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("intake_id",""))' 2>/dev/null)
echo "Intake ID: $INTAKE_ID"

for i in $(seq 1 18); do
  sleep 5
  IDATA=$(curl -sf -b "$COOKIES" "$BASE/api/v1/intake/$INTAKE_ID")
  STATUS=$(echo "$IDATA" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("status",""))' 2>/dev/null)
  printf "  [%2d] %s\n" "$i" "$STATUS"
  if [ "$STATUS" = "COMPLETED" ]; then
    echo "$IDATA" | python3 << 'PYEOF'
import sys, json
d = json.load(sys.stdin)
b = d.get('brief') or {}
print("Summary:", b.get('summary','(empty)'))
print("Engine:", b.get('cot_log','(empty)'))
goals = b.get('goals') or []
print("Goals:")
for g in goals:
    if isinstance(g, dict):
        print("  -", g.get('title',''), ":", g.get('detail',''))
    else:
        print("  -", g)
print("KPIs:", b.get('success_criteria', []))
PYEOF
    break
  fi
done
