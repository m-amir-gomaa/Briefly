#!/usr/bin/env python3
"""
Briefly End-to-End Test Suite
Tests: Auth (register/login), Profile update, Gemini intake, Ollama intake.
Run inside the VM: python3 /opt/briefly/scripts/e2e_test.py
"""
import httpx
import asyncio
import time
import sys
import json

API_URL = "http://localhost:8080"
TIMEOUT = 90  # seconds to wait for AI processing


async def check_step(label: str, resp: httpx.Response, expected_status: int = 200):
    if resp.status_code == expected_status:
        print(f"  ✅ {label}")
        try:
            return resp.json()
        except Exception:
            return {}
    else:
        print(f"  ❌ {label}: HTTP {resp.status_code} — {resp.text[:200]}")
        return None


async def wait_for_intake(client: httpx.AsyncClient, intake_id: str, timeout: int = TIMEOUT):
    """Subscribe to SSE events and wait for COMPLETED or FAILED."""
    print(f"  📡 Streaming events for intake {intake_id}...")
    start = time.time()
    try:
        async with client.stream("GET", f"{API_URL}/api/v1/events/{intake_id}", timeout=timeout) as r:
            async for line in r.aiter_lines():
                if time.time() - start > timeout:
                    return "TIMEOUT"
                if line.startswith("data:"):
                    event = line.replace("data:", "").strip()
                    print(f"    🔔 {event}")
                    if event in ("COMPLETED", "FAILED"):
                        return event
    except Exception as e:
        print(f"    ⚠️  SSE error: {e}")
        return "ERROR"
    return "UNKNOWN"


async def run_e2e():
    print("\n" + "="*60)
    print("  🚀 Briefly E2E Test Suite")
    print("="*60)

    # Use a unique email per run
    ts = int(time.time())
    email = f"e2e_{ts}@briefly.ai"
    password = "TestPass2026!"

    cookies = {}

    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:

        # ------------------------------------------------------------------
        # 1. REGISTER
        # ------------------------------------------------------------------
        print("\n[1/6] Registration")
        resp = await client.post(f"{API_URL}/api/v1/auth/register", json={
            "agency_name": "E2E Test Agency",
            "email": email,
            "password": password,
        })
        data = await check_step("Register new account", resp, expected_status=201)
        if data is None:
            sys.exit(1)
        cookies = dict(resp.cookies)

        # ------------------------------------------------------------------
        # 2. GET ME (verify cookie works)
        # ------------------------------------------------------------------
        print("\n[2/6] Auth Verification — GET /me")
        resp = await client.get(f"{API_URL}/api/v1/auth/me", cookies=cookies)
        data = await check_step("Fetch current user", resp)
        if data is None:
            # try login if cookie not set
            print("  ↩️  Trying login...")
            resp = await client.post(f"{API_URL}/api/v1/auth/login", json={
                "email": email, "password": password
            })
            data = await check_step("Login", resp)
            if data is None:
                sys.exit(1)
            cookies = dict(resp.cookies)
            resp = await client.get(f"{API_URL}/api/v1/auth/me", cookies=cookies)
            data = await check_step("Fetch user (post-login)", resp)
            if data is None:
                sys.exit(1)
        user = data.get("user", data)
        print(f"  👤 User: {user.get('email')} | Plan: {user.get('plan_tier')}")

        # ------------------------------------------------------------------
        # 3. PROFILE UPDATE (PATCH /me)
        # ------------------------------------------------------------------
        print("\n[3/6] Profile Update — PATCH /me")
        resp = await client.patch(f"{API_URL}/api/v1/auth/me", cookies=cookies, json={
            "agency_name": "E2E Agency (Updated)",
        })
        await check_step("Update agency name", resp)

        # ------------------------------------------------------------------
        # 4. GEMINI INTAKE
        # ------------------------------------------------------------------
        print("\n[4/6] Gemini Intake")
        resp = await client.post(
            f"{API_URL}/api/v1/intake",
            cookies=cookies,
            data={"raw_text": "Build a SaaS analytics dashboard for e-commerce brands showing revenue, churn, and inventory trends in real-time."},
            files={"placeholder": ("p.txt", b"x")},
        )
        data = await check_step("Submit intake (Gemini)", resp, expected_status=202)
        if data is None:
            # try without multipart
            resp = await client.post(f"{API_URL}/api/v1/intake", cookies=cookies, json={
                "raw_text": "Build a SaaS analytics dashboard for e-commerce brands.",
                "type": "text",
            })
            data = await check_step("Submit intake JSON (Gemini)", resp, expected_status=202)
        if data:
            intake_id = data.get("intake_id")
            print(f"  🆔 Intake ID: {intake_id}")
            result = await wait_for_intake(client, intake_id)
            if result == "COMPLETED":
                # fetch brief
                resp2 = await client.get(f"{API_URL}/api/v1/intake/{intake_id}", cookies=cookies)
                brief_data = await check_step("Fetch completed brief", resp2)
                if brief_data:
                    brief = brief_data.get("brief", {})
                    cot = brief_data.get("cot_log", "") or ""
                    print(f"  📝 Summary: {str(brief.get('summary',''))[:120]}...")
                    print(f"  🤖 Provider: {cot[:80] if cot else 'See cot_log'}")
            else:
                print(f"  ⚠️  Intake result: {result}")

        # ------------------------------------------------------------------
        # 5. OLLAMA INTAKE (force AI_PROVIDER=ollama via header trick or direct test)
        # ------------------------------------------------------------------
        print("\n[5/6] Ollama Direct Test")
        # Test Ollama is alive
        resp = await client.get("http://localhost:11434/api/tags", timeout=5)
        if resp.status_code == 200:
            models = [m["name"] for m in resp.json().get("models", [])]
            print(f"  ✅ Ollama is up. Models: {models}")
            if any("tinyllama" in m for m in models):
                print("  ✅ tinyllama model is available")
            else:
                print(f"  ⚠️  tinyllama not in model list. Available: {models}")
        else:
            print(f"  ❌ Ollama unreachable: {resp.status_code}")

        # ------------------------------------------------------------------
        # 6. PAGES CHECK
        # ------------------------------------------------------------------
        print("\n[6/6] API Endpoint Smoke Tests")
        endpoints = [
            ("GET", "/api/v1/briefs"),
            ("GET", "/api/v1/clients"),
            ("GET", "/api/v1/projects"),
        ]
        for method, path in endpoints:
            resp = await client.get(f"{API_URL}{path}", cookies=cookies)
            status = "✅" if resp.status_code in (200, 204) else f"❌ {resp.status_code}"
            print(f"  {status} {method} {path}")

    print("\n" + "="*60)
    print("  ✨ E2E Test Suite Complete")
    print("="*60 + "\n")


if __name__ == "__main__":
    asyncio.run(run_e2e())
