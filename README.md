# Monopo Aveugle

A hidden-board multiplayer property game inspired by Magic the Noah. Built with SvelteKit, TypeScript, Tailwind CSS, and Vite. One browser hosts the game; other devices join with a six-digit room number.

## Run

Requires Node.js 22.12 or newer.

```sh
npm install
npm run dev
```

Open the address printed by Vite. For a local multiplayer test use a second browser profile or private window; tabs in the same browser share a session. The host is a separate observer and needs no name. The default 20-tile board supports 2–4 players, excluding the host; adjust tiles before launching other lobby sizes. Player names are unique within a room after case, whitespace, and Unicode normalization.

```sh
npm run check
npm test
npm run build
# With the dev server running:
node scripts/smoke.mjs
```

Production: `npm run build`, then `node build`. Set `ORIGIN` to the public site origin behind a reverse proxy. Use HTTPS for remote sessions.

## Architecture

```text
src/lib/game/types.ts            Shared domain types and default settings
src/lib/game/geometry.ts         Eight-direction ports and reciprocal connection invariants
src/lib/game/appearance.ts       Tile effects, property shapes, avatars and colors
src/lib/game/rulebook.ts         Player-facing item and wheel descriptions
src/lib/notebook/model.ts        Vector objects, attached endpoints and draft validation
src/lib/server/games/
  board.ts                      Board generation and graph connectivity
  engine.ts                     Lobby settings, authorization, and turn transitions
  effects.ts                    Tile effects and both wheels
  inventory.ts                  Consumable items and house construction
  random.ts                     Random selection and event logging
  store.ts                      Room lifecycle, sessions, and atomic actions
  visibility.ts                 Host/player projections and timed reveal filtering
src/lib/components/
  GameSettings.svelte           Host settings form
  Notebook.svelte               Device-local drawing notebook
  board/                        Shared SVG tile/avatar glyphs and the host board
  game/                         Player list, contextual turn controls and movement compass
  ThemeToggle.svelte            Light/dark preference (light by default)
src/routes/
  +page.svelte                  Host/join entry
  game/[code]/                  Lobby and game interface
  rules/                        Complete player-facing rulebook
  settings/                     Language preference
  api/games/                    Create/join and authenticated room API
tests/                          Domain, privacy, session, and lifecycle tests
scripts/smoke.mjs               HTTP integration verification
```

Server modules are never shipped as client game logic. Clients poll every second, submit intentions, and receive a filtered view with contextual action permissions. Movement accepts a compass direction rather than a destination ID, and player views contain no destination identifiers. The store clones a game before applying an action so rejected commands cannot partially mutate authoritative state. Public player IDs are separate from opaque HTTP-only session cookies.

## Implemented

- Host/join rooms, lobby validation, start/end controls, five-minute host expiry and device reconnect window.
- Random hidden starts, directed tile graph, host board, private player locations, turn rotation and movement validation.
- All seven tile kinds, ownership, rent, shop inflation, eight consumable item types, monopolies and houses.
- Both eight-outcome wheels, nested rolls, player-target choices, map changes, public/private event records.
- Independent 30-second reveal timers that pause play until everyone finishes.
- Host settings with post-launch locks, player balances/inventories, private drawing notebook saved per device, JSON record download after the game ends.
- Light/dark themes; SVG host board with effect colors, ownership fills, group shapes, colored wrap routes, two-way lines, one-way arrows, and customizable player avatars.
- Vector map notebook with all tile/avatar types, right-click editing, attached straight lines/arrows, draggable objects/endpoints, undo/redo, and SVG export. Drafts are stored by room and player on the device. Earlier bitmap drawings are not imported into the vector model.

## Remaining specification work

The original `TODO` is the complete design specification; this implementation is a playable foundation, not completion of every checkbox.

- Dice-expression/range settings and manual/host dice entry: current values are fixed whole-number settings and randomness is automatic. Default shop values approximate the specified dice distributions.
- Exact connection distribution controls and generated curved/loop routes: the board currently uses straight eight-direction paths and colored wrap connections. Endpoint direction slots and reciprocal metadata are maintained during map changes.
- Configurable rent expressions and per-item/per-group price settings: current prices use shared base settings and rent doubles per house.
- A replay timeline/player: the export currently contains the final state and event record, rather than state snapshots or deterministic random inputs.
- Additional translations: the language selector currently exposes English only.

Rooms and sessions are held in memory in one Node process and disappear on restart. Use shared persistent storage and scheduled expiry before a multi-process deployment. The rules do not specify bankruptcy or an automatic winning condition; the host ends the game. Wheel recursion has a defensive depth limit of 20.
