# Briefly: Development & Testing Guide

Welcome to the Briefly development team! This guide covers how to develop, test, and contribute to the platform.

---

## 1. Local Development Setup

### Prerequisites
- **Nix**: Required for the reproducible development shell.
- **Docker & Docker Compose**: Required for running the local stack.

### Getting Started
1. **Enter the Dev Shell**:
   ```bash
   nix develop
   ```
2. **Start the local stack**:
   ```bash
   docker compose up -d --build
   ```
   This starts:
   - **Frontend**: http://localhost:3000
   - **Go API**: http://localhost:8080
   - **CockroachDB Console**: http://localhost:26258
   - **MinIO Console**: http://localhost:9001

---

## 2. Testing Your Changes

### Backend (Go)
Run all backend tests:
```bash
cd backend
go test -v ./...
```

### AI Service (Python)
We use `pytest` for AI service testing (if applicable):
```bash
cd ai_service
pytest
```

### Frontend (React)
Vite provides a fast development server. Check for linting errors before pushing:
```bash
cd frontend
npm run lint
```

---

## 3. CI/CD Workflow (GitHub Actions)

We have automated CI/CD set up in `.github/workflows/ci.yml`.

### Automated Checks on Every Push
When you push to `main` or create a PR:
1. **Backend Tests**: Runs `go test` on Go 1.23.
2. **Dependency Audit**: Runs `go mod tidy` to ensure `go.sum` is clean.
3. **Build Validation**: Docker images are built to verify no compilation errors.

### Deployments
Successful builds on `main` are automatically pushed to the GitHub Container Registry (GHCR).

---

## 4. Contributing Rules
1. **Never push directly to `main`** for major features. Use feature branches.
2. **Follow the Cookbooks**: 
   - `cookbooks/frontend_cookbook.md`
   - `cookbooks/backend_cookbook.md`
   - `cookbooks/ai_cookbook.md`
3. **Document Your Changes**: Update the relevant cookbook if you change a shared API contract or design pattern.

---

## 5. Exposing Your Local Work (Preview)
If you need to show your local work to the team:
```bash
cloudflared tunnel --url http://localhost:80
```
This will give you a public URL (e.g., `https://random-words.trycloudflare.com`) that points to your local Nginx proxy.
