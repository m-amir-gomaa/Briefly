# 🔮 Briefly: Real-Time AI Project Briefing

Briefly is a professional AI-powered platform designed to eliminate the friction between project discovery and execution. It transforms fragmented project context (voice memos, sketches, text) into high-fidelity, client-ready project briefs in seconds.

Built for the **Distributed Mesh**, Briefly leverages a 5-node pentagram architecture to ensure high availability and distributed AI processing.

## 🚀 Key Features
- **Multi-Modal Ingestion**: Upload voice recordings, project sketches (OCR), or raw text notes.
- **Real-Time Orchestration**: Watch the AI analyze your project in real-time via Server-Sent Events (SSE).
- **LangGraph Intelligence**: A complex AI state machine powered by Gemini 1.5 Flash for deep context extraction.
- **Distributed Pentagram**: High-availability storage and compute across a mesh of up to 5 nodes.
- **Client Sign-off**: Shareable public links for instant client review and confirmation.

## 🏗️ Tech Stack
- **Frontend**: Vite 6, React 19, Tailwind CSS 4, Zustand.
- **Backend**: Go 1.23, Gin, GORM.
- **AI Service**: Python 3.11, LangChain, LangGraph, Google Gemini 1.5 Flash.
- **Infrastructure**: CockroachDB (Distributed SQL), Redis (Task Queue), MinIO (Distributed S3), NixOS, Docker.

## 📦 Getting Started

### 1. Prerequisites
Ensure you have the following installed:
- **Nix** (with Flakes enabled)
- **Docker** & **Docker Compose**
- **Tailscale** (for distributed mesh connectivity)

### 2. Local Development
```bash
# Enter the development environment
nix develop

# Start the local stack
docker compose up -d

# Start the frontend
cd frontend && npm install && npm run dev
```

### 3. Distributed Mesh Deployment
Follow the **[Setup Guide](docs/SETUP_GUIDE.md)** to join a Pentagram cluster.

## 📖 Documentation
- **[Architecture Overview](docs/architecture/BRIEFLY_MASTER_ARCHITECTURE.md)**
- **[API Specification](docs/API_DOCUMENTATION.md)**
- **[Cookbooks](cookbooks/)**
- **[Team Onboarding](docs/TEAM_SETUP_GUIDE.md)**

## 🛡️ Security
Briefly uses a distributed security model. AI keys are managed per-user and injected into the processing pipeline via secure environment variables.

---

**Built for the Future of Professional Services.** 🦾🚀
