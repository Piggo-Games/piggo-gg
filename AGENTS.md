# Repository Guidelines

## Project Structure & Module Organization
- Monorepo managed by Bun workspaces: `core` (engine, shared game logic), `web` (React front end served from `web/res`), `server` (API + matchmaking, Prisma-backed), and `docs` (static bundle for GitHub Pages).
- Shared TypeScript config lives at `tsconfig.json`; Assets (SVG/audio) sit under `web/res` and are copied into `docs` for production pages.
- Server-side database schema and migrations live in `server/src/db`.

## Build, Test, and Development Commands
- Install deps once: `bun install`.
- Full dev stack: `bun dev` (starts `web` dev server and `server` watcher). HTTPS variant: `bun dev-https`.
- Production-ish run: `bun prod` (generates Prisma client then starts server) or separately `bun --cwd server start`.
- Web only: `bun --cwd web dev` to watch+serve, `bun --cwd web dev-https` for SSL.
- Server only: `bun --cwd server dev` (uses local Postgres at `postgresql://postgres@localhost:5432/piggo`).
- Prisma workflows: `bun gen` (generate client), `bun db` (local migrate dev), `bun --cwd server prisma:deploy` (apply migrations).
- Static site build: `bun pages` (rebuilds `docs/`, preserves `docs/CNAME`).

## Coding Style & Naming Conventions
- TypeScript-first, ESNext targets; strict null checks and `noImplicitAny` enabled. Avoid `any`; prefer explicit types and discriminated unions.
- Two-space indentation; named exports are common (see `core/src/runtime/World.ts`).
- Import shared modules via workspace aliases like `@piggo-gg/core`. File names PascalCase.
- favor pure helpers in `core/src/utils`.
- never use JS `class`, instead declare a type and function with the same name returning an instance of the type

## Testing Guidelines
- No automated test suite is currently present.

## Commit & Pull Request Guidelines
- Recent history favors short, versioned summaries (e.g., `v0.49.3 better Lobby UI (#522)`). Use imperative mood for non-release work and include scope + PR/issue reference when available.
- PRs should include: what/why, how to verify (commands or lobby steps), and screenshots/video for UI changes. Link issues or Notion tickets when relevant.
- Keep changes cohesive; prefer a focused commit or two over large mixed updates. Run relevant build steps (`bun pages` for docs changes, `bun prod` sanity for server changes) before requesting review.

## Security & Configuration Tips
- Do not commit secrets. Local SSL certs in `web/` are for development only. Set `DATABASE_URL` via environment, not checked-in files.
- When touching auth or matchmaking paths, note whether the change affects both `web` and `server`; coordinate schema changes with regenerated Prisma client (`bun gen`).
