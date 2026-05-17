# Briefly — Ultra-High-Density 6-Hour Study Curriculum

This curriculum is designed for a fast-learning, high-IQ mind (estimated 130–145 IQ). It bypasses entry-level tutorials and focuses immediately on **internals, RFC execution models, protocol specs, architecture trade-offs**, and direct linkages to the Briefly codebase coordinates.

---

## 🧭 CURRICULUM OVERVIEW
Each of the 7 modules is sized for **6 hours of intense study**. Allocate 1-2 modules per day to build comprehensive systems execution readiness.

```
NixOS ──► Go & Gin ──► Distributed SQL ──► Redis Clusters ──► LangGraph ──► Stripe Webhooks ──► Proxy Topologies
```

---

## 🛠️ MODULE 1: Declarative Environments (NixOS, Flakes & Colmena)
*Target Study: How declarative system state, reproducible build layers, and Colmena system deployments prevent drift.*

### 📚 Study Materials & Links
1.  **[NixOS Manual - Profiles & Shells](https://nixos.org/manual/nixos/stable/)**: Master how Nix evaluates system expressions and outputs derivation closures.
2.  **[Zero to Nix - Nix Flakes Explained](https://zero-to-nix.com/concepts/flakes)**: Understand hermetic inputs, outputs, locking hashes (`flake.lock`), and devShell environments.
3.  **[Colmena Deployment Reference](https://zhaofengli.github.io/colmena/stable/)**: Study how atomic remote NixOS pushes are constructed and rolled back on failure.

### 🔍 Project Code Coordinates to Analyze
*   **[flake.nix](file:///home/qwerty/Briefly/flake.nix)**: Analyze how Go 1.23, Node, and Python toolchains are locked to precise system hashes.
*   **[infra/vm.nix](file:///home/qwerty/Briefly/infra/vm.nix)**: Inspect the virtual machine profile mapping network interfaces, SSH bridges, and systemd overrides.

---

## ⚙️ MODULE 2: Low-Latency Backends (Go Concurrency & Gin Web Engine)
*Target Study: The Go runtime (GMP scheduler, netpoller), HTTP request routing trie tree, and Gin context propagation.*

### 📚 Study Materials & Links
1.  **[The Go Scheduler - Go Internals](https://morsmachine.dk/go-scheduler)**: Analyze the Work-Stealing GMP scheduler model (Goroutine, Machine, Processor).
2.  **[Gin Web Framework Source - Trie Tree Router](https://github.com/gin-gonic/gin)**: Deep dive into Radix-Tree-based HTTP routing and Gin middleware execution chains.
3.  **[Go Context Package - Concurrency Control](https://pkg.go.dev/context)**: Understand how `context.Context` cancellation propagates downward to terminate unneeded background processes.

### 🔍 Project Code Coordinates to Analyze
*   **[backend/cmd/api/main.go](file:///home/qwerty/Briefly/backend/cmd/api/main.go)**: Study Gin engine setup, protected router groups, CORS handlers, and metrics registration.
*   **[backend/internal/handlers/auth.go](file:///home/qwerty/Briefly/backend/internal/handlers/auth.go)**: Audit the JWT authentication middleware context injector.

---

## 🗄️ MODULE 3: Distributed Transactions (GORM & CockroachDB)
*Target Study: Distributed SQL architectures, Raft consensus replication, datatypes JSONB indexing, and GORM ORM lifecycle hooks.*

### 📚 Study Materials & Links
1.  **[CockroachDB Architecture - Raft Consensus](https://www.cockroachlabs.com/docs/stable/architecture-overview)**: Understand Range partitions, Raft consensus replication groups, and ACID transaction isolation.
2.  **[PostgreSQL JSONB Indexing (GIN Indexes)](https://www.postgresql.org/docs/current/datatype-json.html)**: Learn how Generalized Inverted Indexes (GIN) make JSONB columns searchable at O(1) latency.
3.  **[GORM Hooks Lifecycle](https://gorm.io/docs/hooks.html)**: Understand transaction-bound hooks (`BeforeSave`, `AfterCreate`) and database rollback controls.

### 🔍 Project Code Coordinates to Analyze
*   **[models.go:UserAPIKey](file:///home/qwerty/Briefly/backend/internal/models/models.go#L55)**: Analyze the `BeforeSave` hook triggering transaction rollbacks if GCM encryption fails.
*   **[models.go:Brief](file:///home/qwerty/Briefly/backend/internal/models/models.go#L96)**: Inspect GIN indexes mapped over JSONB columns (`Goals`, `Ambiguities`).

---

## ⚡ MODULE 4: High-Performance Cache (Redis Cluster & Pub/Sub)
*Target Study: Hash slot sharding algorithms, Redis PubSub delivery mechanics, and reliable task queue recovery.*

### 📚 Study Materials & Links
1.  **[Redis Cluster Specification](https://redis.io/docs/reference/cluster-spec/)**: Learn how 16,384 hash slots partition keys across isolated nodes in a cluster.
2.  **[Redis Streams & Task Queues](https://redis.io/docs/data-types/streams/)**: Study standard blocking queue pops (`BRPOP`) vs. reliable stream consumer groups (`XREADGROUP`).
3.  **[Redis Pub/Sub Protocol](https://redis.io/docs/interact/pubsub/)**: Analyze client socket subscription loops and message routing.

### 🔍 Project Code Coordinates to Analyze
*   **[backend/internal/handlers/sse.go](file:///home/qwerty/Briefly/backend/internal/handlers/sse.go)**: Trace how Redis PubSub channels push real-time intake updates directly into Go HTTP SSE streams.
*   **[backend/internal/handlers/intake.go](file:///home/qwerty/Briefly/backend/internal/handlers/intake.go)**: Audit the `LPUSH` payload pushing structured jobs to the AI processing queue.

---

## 🧠 MODULE 5: Asynchronous AI Pipeline (Python, LangGraph & Ollama)
*Target Study: State Graph DAGs, LangChain LCEL (LangChain Expression Language), Python `asyncio` loop concurrency, and thread-safe circuit breakers.*

### 📚 Study Materials & Links
1.  **[LangGraph Conceptual Guide](https://langchainai.github.io/langgraph/concepts/high_level/)**: Learn how state-reducers compile DAG transitions and node processing loops.
2.  **[Python Asyncio - Concurrency Model](https://docs.python.org/3/library/asyncio.html)**: Study the event loop, coroutines, and cooperative multitasking via `asyncio.gather()`.
3.  **[Circuit Breaker Design Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)**: Learn the state machine transitions (Closed -> Open -> Half-Open) of SRE circuit breakers.

### 🔍 Project Code Coordinates to Analyze
*   **[ai_service/providers/\_\_init\_\_.py](file:///home/qwerty/Briefly/ai_service/providers/__init__.py)**: Trace how Gemini auth/rate exceptions trigger a thread-safe, 5-minute blacklist circuit breaker.
*   **[ai_service/agents/orchestrator.py](file:///home/qwerty/Briefly/ai_service/agents/orchestrator.py)**: Audit the asynchronous LangGraph compilation and parallel vision/transcription node gather loop.

---

## 💳 MODULE 6: SaaS Transaction Lifecycles (Stripe Security & Webhooks)
*Target Study: Replay attack prevention, cryptographic HMAC-SHA256 signature verification, and subscription state synchronization.*

### 📚 Study Materials & Links
1.  **[Stripe Webhooks Signature Verification](https://stripe.com/docs/webhooks/signatures)**: Analyze how Stripe generates signed payloads and how to prevent timing/replay attacks.
2.  **[Stripe Customer Portal API](https://stripe.com/docs/billing/subscriptions/customer-portal)**: Study how dynamic hosted customer portal links allow secure account self-management.

### 🔍 Project Code Coordinates to Analyze
*   **[backend/internal/handlers/billing.go](file:///home/qwerty/Briefly/backend/internal/handlers/billing.go)**: Study the `ConstructEvent` validation loop, maximum request body size limits, and `plan_tier` upgrades.

---

## 🌐 MODULE 7: Container Network Topology (Docker, Caddy & Overlay VPNs)
*Target Study: Tailscale wireguard overlays, docker bridge networking, Caddy reverse-proxy stream flushing, and pre-signed S3 streaming.*

### 📚 Study Materials & Links
1.  **[Tailscale WireGuard Mesh Protocol](https://tailscale.com/blog/how-tailscale-works/)**: Learn how WireGuard builds secure, direct peer-to-peer overlay tunnels.
2.  **[Docker Compose Network Drivers](https://docs.docker.com/network/drivers/)**: Study multi-container service discovery via default bridges.
3.  **[Pre-signed S3 Streaming Security](https://docs.aws.aws.amazon.com/AmazonS3/latest/userguide/ShareObjectPreSignedURL.html)**: Understand why browser-direct pre-signed uploading prevents API gateway memory exhaustions.

### 🔍 Project Code Coordinates to Analyze
*   **[docker-compose.yml](file:///home/qwerty/Briefly/docker-compose.yml)**: Trace container dependencies, volumes, networks, and environment injections.
*   **[docker-compose.node.yml](file:///home/qwerty/Briefly/docker-compose.node.yml)**: Examine clustered node configuration boundaries.
