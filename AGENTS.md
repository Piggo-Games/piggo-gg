# Repository Guidelines

## Project Structure & Module Organization
- Monorepo managed by Bun workspaces: `core` (engine, shared game logic), `web` (front end served from `web/res`), `server` (API + matchmaking, Prisma-backed), and `docs` (static bundle for GitHub Pages).
- Shared TypeScript config lives at `tsconfig.json`; Assets (SVG/audio) sit under `web/res` and are copied into `docs` for production pages.
- Server-side database schema and migrations live in `server/src/db`.

## Workspace Map & Entrypoints
- `core/` — ECS engine and game content. Entrypoint `main.ts`; key dirs: `src/runtime` (World loop/DefaultWorld), `src/ecs` (components, systems, entities, actions, commands, renderables), `src/games/*` (GameBuilder configs), `src/net` (Client + syncers), `src/graphics` (Three/Pixi renderers + shaders), `src/html` (DOM overlays), `src/sound`.
- `web/` — website running Piggo client. `src/components/Canvas.tsx` initializes a `World` with Pixi + Three. `Root` mounts to `#root`. `bun dev-compile` outputs to `res/` alongside static assets that flow into `docs/`.
- `server/` — Bun websocket + HTTP API in `src/Api.ts` (msgpack). Each lobby has a `ServerWorld` (`src/ServerWorld.ts`) running a `World` in server mode with `NetServerSystem`. Prisma schema + migrations live under `src/db`.
- `docs/` — generated static bundle (`bun pages`) copied from `web/res` (keeps `docs/CNAME`).
- `electron/` — desktop wrapper in `electron/src/main.ts` that runs the Piggo client.

## Coding Style & Naming Conventions
- TypeScript-first, ESNext targets; strict null checks and `noImplicitAny` enabled. Avoid `any`; prefer explicit types and discriminated unions
- Two-space indentation; named exports (no default export)
- Import shared modules via workspace aliases like `@piggo-gg/core`
- File names PascalCase
- pure helper functions in `core/src/utils`
- never use JS `class`, instead declare a type and function with the same name returning an instance of the type

## Engine Architecture Cheatsheet
- ECS: entities are plain objects built in `core/src/ecs/entities/*` with components from `core/src/ecs/components`; systems live in `core/src/ecs/systems` (client/gameplay/net) and are created via `SystemBuilder`/`ClientSystemBuilder`. Systems with `data` get a networked `SystemEntity` for sync.
- Runtime: `core/src/runtime/World.ts` owns tick/time, tick buffers (`actions`, `messages`, `entitiesAtTick`), and runs systems by priority every `tickrate`; `onRender` forwards to systems when a renderer is active. `DefaultWorld` wires base systems (Random, Expires, Control, Input, Command, NPC, Action, Position) and commands (GameCommand, DebugCommand).
- Games: each `core/src/games/*` module exports a `GameBuilder` describing renderer (`three`/`pixi`), netcode (`delay` or `rollback`), starting entities, systems, state, and settings. `world.setGame` clears transient entities/blocks, swaps systems, updates renderer activation, and pointer-locks certain games.
- Netcode: client stack in `core/src/net` (`Client`, `DelaySyncer`, `RollbackSyncer`) plus `NetClientRead/WriteSystem` (msgpack over websockets). Server stack is `server/src/ServerWorld.ts` + `NetServerSystem` broadcasting tick data/actions; lobby/world management and auth endpoints live in `server/src/Api.ts`.
- Rendering/UI: `core/src/graphics` holds `ThreeRenderer`, `PixiRenderer`, cameras, shaders; drawables sit under `core/src/ecs/renderables` and UI entities under `core/src/ecs/entities/ui`. DOM overlays live in `core/src/html` components (HDiv/HButton/HtmlText/etc.) attached in game definitions.

## Testing Guidelines
- Use `bun tests` after source code changes to catch compilation/runtime errors.

## Commit & Pull Request Guidelines
- Recent history favors short, versioned summaries (e.g., `v0.49.3 better Lobby UI (#522)`). Use imperative mood for non-release work and include scope + PR/issue reference when available.
- PRs should include: what/why, how to verify (commands or lobby steps), and screenshots/video for UI changes. Link issues or Notion tickets when relevant.
- Keep changes cohesive; prefer a focused commit or two over large mixed updates. Run relevant build steps (`bun pages` for docs changes, `bun prod` sanity for server changes) before requesting review.
