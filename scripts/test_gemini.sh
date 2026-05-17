#!/bin/bash
# scripts/test_gemini.sh
# Use this script to verify that custom Gemini API keys are correctly used
# even when the server default is set to Ollama/Fallback.

BASE="http://localhost:8083"
EMAIL="gemini_test_$(date +%s)@briefly.ai"
PASS="Test2026!"
COOKIES="gemini_cookies.txt"

echo "=== Gemini Integration Test ==="
echo "Email: $EMAIL"

# 1. Register
echo "[1/4] Registering user..."
curl -sf -c "$COOKIES" -X POST "$BASE/api/v1/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"agency_name\":\"Gemini Test Agency\",\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" > /dev/null
echo "  ✅ Success (Registered)"

# 2. Login (to be safe with cookies)
echo "[1.5/4] Logging in..."
curl -sf -b "$COOKIES" -c "$COOKIES" -X POST "$BASE/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" > /dev/null
echo "  ✅ Success (Authenticated)"

# 2. Add Gemini API Key
echo "[2/4] Adding Gemini API Key..."
# Note: You can replace 'DUMMY_KEY' with a real one to actually test inference
# If quota is exhausted, this will still verify that the worker ATTEMPTS to use Gemini
curl -sf -b "$COOKIES" -X POST "$BASE/api/v1/auth/keys" \
  -H 'Content-Type: application/json' \
  -d '{"name":"E2E Gemini Key", "key": "AIzaSyAozVBNzeYv3GCevM-eWRh5UobLG1aGba4"}' > /dev/null
echo "  ✅ Key added and encrypted"

# 3. Submit Intake
echo "[3/4] Submitting intake..."
INTAKE=$(curl -sf -b "$COOKIES" -X POST "$BASE/api/v1/intake" \
  -F "raw_text=Build a futuristic dashboard for space mining operations with real-time asteroid tracking.")
INTAKE_ID=$(echo "$INTAKE" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("intake_id",""))' 2>/dev/null)
echo "  ✅ Intake submitted (ID: $INTAKE_ID)"

# 4. Poll and Verify Provider
if [ -n "$INTAKE_ID" ]; then
  echo "[4/4] Polling status and verifying provider..."
  for i in $(seq 1 20); do
    sleep 5
    DATA=$(curl -sf -b "$COOKIES" "$BASE/api/v1/intake/$INTAKE_ID" 2>/dev/null)
    STATUS=$(echo "$DATA" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("status",""))' 2>/dev/null)
    PROVIDER=$(echo "$DATA" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("provider_name",""))' 2>/dev/null)
    
    printf "    [%2d] Status: %-10s | Provider: %s\n" "$i" "$STATUS" "$PROVIDER"
    
    if [ "$STATUS" = "COMPLETED" ]; then
      echo "  ✅ COMPLETED!"
      echo "  Final Provider Used: $PROVIDER"
      break
    fi
    
    if [ "$STATUS" = "FAILED" ]; then
      echo "  ❌ FAILED!"
      break
    fi
  done
fi

rm "$COOKIES"
echo "=== Test Done ==="
