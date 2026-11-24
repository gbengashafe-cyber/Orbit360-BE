# ORBIT 360 Backend Agent Instructions

These instructions apply to the entire backend repository.

## Repository architecture and conventions

- The backend is an Express 5 application written in TypeScript, using Sequelize 6 with MySQL.
- Feature code lives under `src/features/<feature>/`. Follow the existing module boundaries and naming patterns: routes, controllers, services, repositories, models, and validators. Keep HTTP handling in controllers, business transitions in services, and reusable persistence queries in repositories where the feature already uses that layer.
- Register routes in `src/app.ts` and follow the existing route and middleware conventions. Preserve existing authentication, permissions, ownership checks, and response formats.
- Use the shared `ApiResponse` / `ApiError` helpers and existing Zod validation patterns. Do not introduce parallel validation, logging, mail, persistence, or response systems.
- Use TypeScript types that match the persisted model and actual workflow data. Avoid `any` where existing types can express the payload; do not weaken schemas to hide mismatches.
- Sequelize model attributes generally use the existing camelCase convention and are mapped to the database schema by the repository's Sequelize configuration. Pass the transaction through every write that belongs to one business operation.
- Avoid logging personal data, secrets, notification message bodies, complaint contents, or email addresses. Follow the relevant feature's privacy rules.

## Database changes

- Schema changes require a Sequelize CLI migration under `migrations/`, using the repository's `.cjs` migration conventions.
- Migrations should be additive and idempotent where practical, name constraints and indexes explicitly, and keep `down` limited to objects created by that migration.
- Do not use model synchronization or hand-written production schema changes as a substitute for migrations. Do not run migrations, seeds, or destructive database operations unless the user explicitly authorizes them.
- Do not add or alter schema for a feature without identifying the need and obtaining approval when the change exceeds the requested scope.

## Tests and verification

- Inspect existing tests and the feature's current status transitions before changing behavior.
- Add focused tests for changed behavior, including validation, ownership/recipient selection, state-transition conditions, transaction boundaries, and failure handling as applicable.
- Run the focused tests, then `npm test` and `npx.cmd tsc --noEmit` for backend changes when the local environment supports them. Report environmental failures separately from code failures.
- Do not modify tests or fixtures to conceal a failing behavior.

## Notification assessment is mandatory

For every new feature or workflow change, assess its meaningful business events and whether they warrant employee notifications. Identify state transitions, recipients and why they should receive a notification, dispatch timing, message content, category, privacy needs, idempotency, and tests. Report events deliberately excluded and why. Do not invent recipients or product rules; ask for approval when they are unclear.

Before implementing any notification-related work, read [`docs/NOTIFICATIONS.md`](docs/NOTIFICATIONS.md) and follow the Notification Integration Standard there. All modules must reuse the central Notification Center. Do not create module-specific notification tables, services, or APIs.

## Git and workspace safety

- Inspect `git status`, the current branch, repository instructions, and relevant diffs before editing.
- Preserve existing user changes. Never reset, clean, overwrite, revert, stash, or switch branches unless explicitly requested.
- Do not stage, commit, or push without explicit user approval. Do not include unrelated changes in a requested change.
- Make the smallest scoped change that satisfies the request. Do not perform unrelated refactors or opportunistic bug fixes.
- If the requested work requires a broader change, destructive action, or unclear product behavior, report the concrete issue and obtain approval before proceeding.
