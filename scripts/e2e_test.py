#!/usr/bin/env python3
import httpx
import asyncio
import time
import sys

API_URL = "http://localhost:8082"  # api-alpha port as defined in docker-compose

async def run_e2e_test():
    print("🚀 Starting Briefly End-to-End Test...")

    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Health Check
        try:
            resp = await client.get(f"{API_URL}/api/v1/intake/health") # Assuming a health endpoint exists or just check 404
        except Exception:
            # If health is not implemented, just check if we can reach the server
            try:
                await client.get(API_URL)
            except Exception as e:
                print(f"❌ API Server not reachable at {API_URL}: {e}")
                sys.exit(1)

        print("✅ API Server is reachable.")

        # 2. Submit Text Intake
        print("📥 Submitting test intake...")
        payload = {
            "raw_text": "I want to build a high-performance distributed AI platform for project briefing called 'Briefly'. It should use Go, Python, and CockroachDB. The goal is to make project discovery seamless for creative agencies.",
        }
        
        # Force multipart/form-data
        files = {"dummy": ("dummy.txt", "dummy content")}
        resp = await client.post(f"{API_URL}/api/v1/intake", data=payload, files=files)
        if resp.status_code != 202:
            print(f"❌ Failed to submit intake: {resp.status_code} - {resp.text}")
            sys.exit(1)

        data = resp.json()
        intake_id = data.get("intake_id")
        print(f"✅ Intake submitted! ID: {intake_id}")

        # 3. Subscribe to SSE and wait for COMPLETED
        print(f"📡 Connecting to event stream for intake {intake_id}...")
        
        start_time = time.time()
        timeout = 60  # 60 seconds timeout for AI processing
        
        try:
            async with client.stream("GET", f"{API_URL}/api/v1/events/{intake_id}") as response:
                async for line in response.aiter_lines():
                    if line.startswith("data:"):
                        event = line.replace("data:", "").strip()
                        print(f"🔔 Event received: {event}")
                        
                        if event == "COMPLETED":
                            print("🎉 AI Processing COMPLETED!")
                            break
                        if event == "FAILED":
                            print("❌ AI Processing FAILED!")
                            sys.exit(1)
                    
                    if time.time() - start_time > timeout:
                        print("❌ Timeout waiting for AI processing.")
                        sys.exit(1)
        except Exception as e:
            print(f"❌ SSE Connection Error: {e}")
            sys.exit(1)

        # 4. Verify Final Brief
        print("🔍 Verifying final brief...")
        resp = await client.get(f"{API_URL}/api/v1/intake/{intake_id}")
        if resp.status_code != 200:
            print(f"❌ Failed to fetch final intake status: {resp.status_code}")
            sys.exit(1)

        final_data = resp.json()
        brief = final_data.get("brief")
        
        if not brief:
            print("❌ No brief found in intake record.")
            sys.exit(1)
            
        print("✅ Brief content verified!")
        print(f"📝 Summary Preview: {brief.get('summary')[:100]}...")
        print(f"🔗 Public Token: {brief.get('share_token')}")
        
        print("\n✨ E2E Test Passed Successfully!")

if __name__ == "__main__":
    asyncio.run(run_e2e_test())
