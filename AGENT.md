# AGENT.md — Node.js Backend Engineering Guidelines

## Rules of Engagement

- **Zero Assumptions:** Make absolutely zero assumptions about the codebase, architectural intent, or user preferences.
- **Ask First:** If a requirement is ambiguous, data is missing, or multiple implementation paths exist, you must halt and ask for clarification before writing or modifying code.
- **Verify Execution:** Always run the test suite and lint checks locally before declaring a task complete.

## Project Stack & Architecture

- **Runtime:** Node.js v22+ (ES Modules) | **Framework:** Express.js | **DB:** MySQL via Sequelize.
- **Entry Points:** `server.js` (HTTP startup & graceful shutdown) → `src/app.js` (Express & global middleware).
- **Data Flow:** Request → Middleware → Route → Controller → Service/validation → Repository/Model → JSON Response.
- **Boundaries:**
  - Routes and Controllers must be thin and free of business logic.
  - **Dependency Injection:** Inject all dependencies explicitly via class constructors. Never hardcode or globally instantiate services, repositories, or HTTP clients inside modules.
  - Never pass Express `req` or `res` objects into services.
  - Encapsulate outbound HTTP calls in `src/clients/`; do not scatter them in controllers.
  - Keep services testable without booting the HTTP server.

## Code Style & Node.js Conventions

- **Programming Paradigm:** Prefer Object-Oriented Programming (OOP) patterns as much as possible. Organize application logic using strongly-typed classes, explicit interfaces, encapsulation, and formal domain models over loose procedural functions.
- **Minimal Exports:** Only export code (classes, interfaces, functions, constants) that is explicitly used in another file. Keep internal helper functions, local utilities, and private sub-components strictly unexported to minimize public module surface area.
- **Syntax:** Use `const` by default (`let` only if reassigned); never use `var`.
- **Async:** Use `async`/`await` with explicit promise rejection handling; avoid sync blocking APIs.
- **Functions:** Use pure functions for utilities; use a single named options object for functions with >2 parameters.
- **Imports:** Use `node:` prefixes for core modules (e.g., `node:fs/promises`); avoid circular dependencies.
- **Formatting:** Default to 2-space indentation unless an existing project `.eslintrc` or prettier config dictates otherwise.

## Express Application Rules

- **Validation:** Always validate request bodies, queries, and params using existing Zod conventions before business logic executes. Reject with `400` or `422`.
- **Middleware Order:** Security/CORS/Helmet/Rate-limiting → Request Parsing → Auth Middleware → Routes → 404 → Global Error Handler.
- **API Responses:** Follow the existing `ApiResponse` wrapper contract:
  - _Success (2xx):_ `{ success: true, data: {...}, message: "..." }`
  - _Error (4xx/5xx):_ `{ success: false, message: "...", errors: [...] }`

## Security, Privacy & Config

- **Secrets:** Zero hardcoded credentials. Use `process.env` normalized through the centralized configuration module.
- **Queries:** Use parameterized queries or safe Sequelize mechanisms to prevent SQL injection.
- **Auth:** Validate resource ownership and explicit access policies; never trust user IDs supplied directly in request payloads.
- **Logging Blacklist:** Never log passwords, tokens, API keys, cookies, auth headers, private keys, or raw request bodies.
- **Data Sanitization:** Treat all client uploads, extracted paths, and file streams as untrusted; enforce size limits.

## Database, Async & Operations

- **Transactions:** Use Sequelize transactions for multi-row mutations that require atomicity; ensure proper rollback handling.
- **Migrations:** Never modify released migrations. Generate a new migration file for schema changes.
- **Concurrency:** Avoid fire-and-forget promises. Use batching or concurrency limiters for heavy workloads to protect the event loop.

## Testing & Dependency Management

- **Framework:** Prioritize the project's existing framework (Jest / native runner). Use Supertest for HTTP integration.
- **Mocks:** Keep mocks deterministic; mock database and external API boundaries in unit tests.
- **Deps:** Check `package.json` first. Do not add redundant dependencies or edit lockfiles manually. Use established package scripts.

## Agent Workflow (Definition of Done)

1. **Understand & Inspect:** Read local files, tests, and configuration before writing code. Do not assume structure.
2. **Implement:** Write minimal, safe, reviewable changes that preserve existing public API contracts and code conventions.
3. **Verify:** Execute `npm test` and `npm run lint` (or repository equivalents) before completing tasks.
4. **Report:** Summarize what changed, why, what tests were run, and any outstanding risks. Never feign test results.

---

### Self-Test Trigger

If the user asks exactly: `AGENTS PROJECT-SELF TEST`
Respond with exactly: `NODEJS_AGENTS_LOADED`
