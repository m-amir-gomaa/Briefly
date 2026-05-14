# Briefly Platform: Demo Materials

## 1. Intricate Architecture UML

This diagram details the comprehensive architecture powering the Briefly platform, specifically reflecting the deployment state for the demo.

```mermaid
flowchart TB
    %% --- Client Layer ---
    subgraph Client_Layer [Client & Edge Tier]
        Browser[("🌐 Web Browser\n(React + Vite + Zustand)")]
        CF_WAF["🛡️ Cloudflare WAF\n(DDoS & Rate Limiting)"]
    end

    %% --- Ingress Layer (Briefly-VM) ---
    subgraph Ingress_Layer [Ingress & Proxy Layer]
        Caddy["🕸️ Caddy Reverse Proxy\n(TLS Termination & Routing)"]
        Tailscale["🦎 Tailscale Mesh\n(Secure Internal Networking)"]
    end

    %% --- Application Layer ---
    subgraph Application_Layer [Application Tier (Go + Python)]
        Go_API_Alpha["🚀 Go API (Alpha)\n(Gin, GORM, SSE)"]
        Go_API_Beta["🚀 Go API (Beta)\n(Gin, GORM, SSE)"]
        
        Py_Worker_Alpha["🧠 AI Worker (Alpha)\n(Python, LangGraph, FastAPI)"]
        Py_Worker_Beta["🧠 AI Worker (Beta)\n(Python, LangGraph, FastAPI)"]
    end

    %% --- Persistence & Caching Layer ---
    subgraph Data_Layer [Data & Persistence Tier]
        CRDB[("🦖 CockroachDB\n(Distributed SQL)") ]
        Redis[("⚡ Redis\n(KV Cache & Message Queue)")]
        MinIO[("📦 MinIO / R2\n(S3-Compatible Object Storage)")]
    end

    %% --- External AI Layer ---
    subgraph External_AI [External Intelligence]
        Gemini["✨ Google Gemini 1.5 Flash\n(Multimodal Inference)"]
    end

    %% --- Network Flow ---
    Browser -- "1. Upload Assets / Request Web UI" --> CF_WAF
    CF_WAF -- "2. Proxy Traffic" --> Tailscale
    Tailscale -- "3. Forward to VM" --> Caddy

    %% --- Caddy Routing ---
    Caddy -- "4a. Static Assets (/*)" --> Browser
    Caddy -- "4b. API Requests (/api/*)" --> Go_API_Alpha
    Caddy -. "4c. Real-Time Status Stream (SSE)" .-> Go_API_Beta

    %% --- Backend Operations ---
    Go_API_Alpha -- "5. Store Metadata" --> CRDB
    Go_API_Alpha -- "6. Upload Media Files" --> MinIO
    Go_API_Alpha -- "7. Publish Intake Job (LPUSH)" --> Redis
    
    %% --- Worker Operations ---
    Redis -- "8. Consume Job (BRPOP)" --> Py_Worker_Alpha
    Redis -- "8. Consume Job (BRPOP)" --> Py_Worker_Beta
    
    Py_Worker_Alpha -- "9. Fetch Media" --> MinIO
    Py_Worker_Alpha -- "10. Async Inference" --> Gemini
    Py_Worker_Alpha -- "11. Save Results" --> CRDB
    Py_Worker_Alpha -- "12. Publish Event Update" --> Redis

    %% --- SSE Delivery ---
    Redis -- "13. Listen for Updates" --> Go_API_Alpha
    Go_API_Alpha -. "14. Push Event Datagram" .-> Browser
```

---

## 2. Demo Presentation Script

**Title**: Briefly - The AI-Powered Project Intake Platform
**Estimated Time**: 5-7 Minutes

### Introduction (1 minute)
* **Action**: Have the browser open to `https://briefly-vm.tail0c7099.ts.net/` on the login screen.
* **Speaker**: "Hello everyone. Today, I'm excited to show you **Briefly**, an intelligent platform designed to completely automate and streamline the project intake process for agencies and freelancers."
* **Speaker**: "Instead of messy email chains, scattered Google Docs, and unorganized voice notes, Briefly ingests multi-modal data and uses agentic AI to synthesize a perfect, actionable brief."

### Step 1: Authentication & Dashboard (1 minute)
* **Action**: Click "Sign in with Google" and log in. Land on the empty/active Dashboard.
* **Speaker**: "We use secure Google OAuth for instant onboarding. Once logged in, you're greeted by the Agency Dashboard, giving you a top-down view of all your client project requests."
* **Speaker**: "Let's imagine a client just sent over a messy collection of assets: a voice memo explaining their vision, a couple of screenshots, and a rough text document. Let's create a new intake for this."

### Step 2: The Multi-Modal Intake (1.5 minutes)
* **Action**: Click "New Intake". Drag and drop a sample audio file (.mp3) and a text snippet into the dropzone. Click "Submit".
* **Speaker**: "Here is where the magic happens. We just dropped raw, unstructured audio and text into the system. As soon as I hit submit, our Go backend securely uploads these assets to our MinIO S3 storage."
* **Speaker**: "It then queues a job in Redis, which is instantly picked up by our asynchronous Python LangGraph workers."

### Step 3: Real-Time SSE & AI Processing (1.5 minutes)
* **Action**: Stay on the processing screen. Let the audience watch the real-time status updates (e.g., 'Transcribing Audio', 'Extracting Goals').
* **Speaker**: "Notice the live updates on the screen. We aren't doing any messy polling here. Our Go backend uses Server-Sent Events (SSE) to stream real-time progression from the AI workers straight to the browser."
* **Speaker**: "Behind the scenes, our Python workers are utilizing Google's Gemini 1.5 Flash in a parallel fan-out architecture. It's transcribing the audio and analyzing the text simultaneously to cut processing time in half."

### Step 4: The Final Brief & Architecture (1.5 minutes)
* **Action**: Once the brief is generated, click into the final result showing the structured goals and ambiguities.
* **Speaker**: "And we're done. In seconds, Briefly has taken chaotic input and generated a structured, professional living document. It has identified the core goals and, more importantly, detected ambiguities—flagging missing information we need to ask the client."
* **Speaker**: *(Show the UML Diagram)* "This speed and reliability are possible because of our robust architecture. A high-concurrency Go API handles all client traffic and streams, while Python workers handle heavy AI compute, fully decoupled via a Redis message queue, and persisted safely in a distributed CockroachDB cluster."
* **Speaker**: "Thank you. Any questions?"
