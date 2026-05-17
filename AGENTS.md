# AGENTS.md — Trading Reload Chart

Authoritative guide for humans and AI agents working on this repository. Follow this document for refactors, features, and reviews unless the user explicitly overrides it in the current task.

---

## 1. Project purpose

Trading Reload Chart is a **standalone React chart library** (canvas-based) for trading UIs. It renders candles, volume, axes, crosshair, drawing shapes, and open/past trade overlays.

- **In scope**: Presentation, interaction, and callbacks. Data comes from the parent.
- **Out of scope**: REST/WebSocket fetching, authentication, routing, SSR, non-React hosts.

---

## 2. Non-negotiable priorities

1. **Zero regressions** — Current behavior (pan, zoom, crosshair, shapes, trade drag/modify, live updates in demo) must remain identical unless the user requests a deliberate change.
2. **Controlled data model** — The library does not own candles, trades, shapes, symbol, config, or `activeShapeTool`. It renders from props and notifies the parent via callbacks.
3. **No network in library code** — `fetch`, `WebSocket`, and API URL constants live only under `demo/`.
4. **Preserve UX** — Trade SL/TP drag may use **ephemeral interaction state** during pointer drag; committed values always come from updated props after `onTradeModify`.

---

## 3. Public API

### 3.1 Component

- Name: **`TradingReload`**
- File: `src/react/TradingReload.tsx`
- Must include **`"use client"`** at the top (Next.js App Router).
- Fills **100% width and height** of the parent DOM node the consumer provides (e.g. a `motion.div` or `div` with explicit or flex-derived size).

### 3.2 Package entry

- File: `src/index.ts` re-exports:
  - `TradingReload`
  - All public types (props, callbacks, domain models, config types)
- Do not export demo code, internal chart controllers, or layer implementations unless explicitly requested.

### 3.3 Build modes

| Mode | Resolution | Output |
|------|------------|--------|
| Development (`npm run dev`) | Source under `src/` via Vite | Demo app |
| Production / consumers | Compiled, minified bundle | `dist/` with `package.json` `"exports"` and `.d.ts` types |

SSR is **not** supported. Do not import `window`/`document` at module top level in public entry files.

### 3.4 Styling

- Chart layout CSS lives in the library (e.g. `src/styles/chart.css`).
- The React component imports/applies styles internally; consumers must **not** manually import `main.css` from the repo root after refactor.
- Keep z-index stacking and axis layout equivalent to pre-refactor `main.css`.

---

## 4. `TradingReload` props contract

All data props are **controlled**. The parent is the single source of truth.

| Prop | Type | Required | Notes |
|------|------|----------|-------|
| `activeSymbol` | `string` | yes | Used for symbol-scoped logic (e.g. pip size in position shapes). |
| `candles` | `Candle[]` | yes | Historical series; times in **milliseconds UTC** unless `brokerTimezoneOffsetMs` is set. |
| `liveCandle` | `Candle \| null` | no | Forming candle; when omitted, treat as no live update. |
| `openTrades` | `OpenTrade[]` | no | Open positions overlay. |
| `pastTrades` | `PastTradeIndicator[]` | no | Historical trade markers. |
| `shapes` | `Shape[]` | yes | Parent-owned list; may be `[]`. |
| `activeShapeTool` | `ShapeToolType \| null` | yes | `null` = no new shape drawing. |
| `config` | `DeepPartial<ChartConfig>` | no | Deep-merged over defaults from `src/config/chartConfig.ts`. |
| `brokerTimezoneOffsetMs` | `number` | no | When set, converts broker-encoded Unix **seconds** to UTC ms: `time * 1000 - brokerTimezoneOffsetMs`. When unset, assume `candle.time` is already ms (or apply no conversion). |
| `className` | `string` | no | Applied to root wrapper. |
| `style` | `CSSProperties` | no | Applied to root wrapper. |
| `onShapeAdded` | `(payload: ShapeAddedPayload) => void` | no | Fired when user completes a new shape. |
| `onShapeModified` | `(payload: ShapeModifiedPayload) => void` | no | Fired when user edits a shape. |
| `onActiveShapeToolChange` | `(tool: ShapeToolType \| null) => void` | no | Fired when the library needs the parent to change the active tool (e.g. after shape added, Escape/cancel via `ShapesLayer` `onToolChange`). **Always pass `null` for cancel paths** (maps former `onToolChange`). |
| `onTradeModify` | `(payload: { ticket: number; sl?: number \| null; tp?: number \| null }) => void` | no | Fired on commit (e.g. pointer-up after SL/TP drag). Parent calls API and updates `openTrades`. |

### 4.1 Shape drawing rules

- If `activeShapeTool === null`, do not start new shapes.
- If `activeShapeTool` is set, drawing uses existing `ShapesLayer` behavior; on completion call `onShapeAdded` and `onActiveShapeToolChange(null)` (parent may also clear tool in `onShapeAdded`).
- The library **never** mutates the `shapes` array; it only invokes callbacks.

### 4.2 Trade modify rules

- During drag: **local/ephemeral preview state** inside the chart controller is allowed (SL/TP line follows pointer).
- On pointer-up: call `onTradeModify` with `{ ticket, sl?, tp? }`; clear ephemeral state.
- When `openTrades` prop updates from parent, render from props (authoritative).

### 4.3 Config merge

- Default: `CHART_CONFIG` from `src/config/chartConfig.ts` (and nested `chartShapeConfig`, `colors`, etc.).
- Merge `config` prop **deeply** into defaults; partial overrides must not wipe sibling keys.

---

## 5. Demo / dev harness (temporary)

Location: **`demo/`** at repository root.

Purpose: Stand in for the future parent React app until it exists. **Not published** in the library bundle.

| File | Responsibility |
|------|----------------|
| `demo/main.tsx` | Vite entry; mounts `TradingReload` with `createRoot`. |
| `demo/DemoApp.tsx` | Local React state mirroring future parent (candles, trades, shapes, tool). |
| `demo/demoApi.ts` | `fetch`, WebSocket, `API_BASE_URL`, `WS_BASE_URL`. |
| `demo/demoDefaults.ts` | Hardcoded symbol, initial shapes, `activeShapeTool`, merged config, `brokerTimezoneOffsetMs`, timeframe `15m`, `limit=500`. |
| `demo/createDemoShapes.ts` | Logic moved from legacy `main.ts` `createDemoShapes`. |

Rules:

- Root `index.html` script entry points to **`demo/main.tsx`** (or equivalent), not library internals.
- Demo may optimistically update local state on `onTradeModify` after API success (current behavior).
- Delete `demo/` only when the user confirms the parent app replaces it.

---

## 6. Target directory structure

After refactor, code is organized by **role**, not by historical file sprawl.

```txt
trading-reload-chart/
├── AGENTS.md
├── index.html                 # Dev: loads demo entry only
├── package.json
├── vite.config.ts             # App dev + library build profiles
├── tsconfig.json
├── biome.json
│
├── demo/                      # Temporary; see §5
│
├── src/
│   ├── index.ts               # Public exports only
│   │
│   ├── react/
│   │   ├── TradingReload.tsx
│   │   └── TradingReload.types.ts
│   │
│   ├── chart/                 # Framework-agnostic chart runtime (used by React)
│   │   ├── ChartController.ts       # Layer lifecycle, renderAll, resize
│   │   ├── ChartController.types.ts
│   │   ├── interaction/
│   │   │   ├── PointerInteraction.ts
│   │   │   ├── WheelInteraction.ts
│   │   │   └── CrosshairInteraction.ts
│   │   └── utils/
│   │       ├── mergeChartConfig.ts
│   │       ├── normalizeCandleTime.ts
│   │       └── getCanvasPoint.ts
│   │
│   ├── canvas/
│   │   └── layers/
│   │       ├── {LayerName}.ts           # Single-file layers
│   │       └── {LayerName}/             # Multi-file layers
│   │           ├── {LayerName}.ts
│   │           ├── {LayerName}.types.ts
│   │           ├── {LayerName}.helpers.ts
│   │           └── ...
│   │       └── helpers/
│   │           └── LayerHelpers.ts
│   │
│   ├── config/
│   │   ├── chartConfig.ts
│   │   ├── chartConfig.types.ts
│   │   ├── colors.ts
│   │   ├── pairs.ts
│   │   └── ChartShapeConfig/
│   │       └── chartShapeConfig.ts
│   │
│   ├── models/
│   │   ├── Candle.ts
│   │   ├── Trade.ts
│   │   ├── ChartViewport.ts
│   │   └── ...
│   │
│   ├── helpers/               # Shared pure utilities (no layer-specific logic)
│   │   └── math.ts
│   │
│   ├── core/                  # Low-level math/coordinates (no React, no DOM orchestration)
│   │   └── CoordinateSystem.ts
│   │
│   └── styles/
│       └── chart.css          # Former main.css content
│
└── dist/                      # Gitignored; library build output
```

### 6.1 What not to add without need

- Empty placeholder files (`ChartEngine.ts`, `worker/*`, duplicate `VolumeLayer.ts`, etc.) — remove **after** refactor completes.
- Vanilla public class API — React wrapper owns the lifecycle.
- `constants/` top-level folder unless it holds values shared across `config/` and `models/`; prefer `config/` for chart constants.

---

## 7. File and naming conventions

| Kind | Convention | Example |
|------|------------|---------|
| React component | PascalCase, one primary export | `TradingReload.tsx` |
| Props / callback types | `{Component}.types.ts` or colocated `*.types.ts` | `TradingReload.types.ts` |
| Chart controller / services | PascalCase class or factory | `ChartController.ts` |
| Canvas layer | `{Name}Layer.ts` or folder `{Name}Layer/` | `TradeLayer/TradeLayer.ts` |
| Layer helpers | `{Layer}.helpers.ts` | `AxisLayerX.helpers.ts` |
| Layer types | `{Layer}.types.ts` | `ShapesLayer.types.ts` |
| Shape implementations | `{Kind}Shape.ts` | `FibRetracementShape.ts` |
| Domain models | Singular noun, `src/models/` | `Candle.ts`, `Trade.ts` |
| Config | `src/config/`; types in `chartConfig.types.ts` | `CHART_CONFIG` |
| Pure helpers | camelCase functions, `src/helpers/` or `chart/utils/` | `clamp.ts` |
| CSS | kebab-case file under `src/styles/` | `chart.css` |
| Demo files | `demo` prefix or folder scope | `demoApi.ts`, `DemoApp.tsx` |

### 7.1 Imports

- Use **path aliases** only if already configured in `tsconfig`/`vite`; otherwise relative imports within `src/`.
- Public consumers import from package root (`import { TradingReload, type Candle } from 'trading-reload-chart'`).
- Layers import models and config; models must **not** import layers.
- `chart/` may import `canvas/`, `config/`, `models/`, `helpers/`, `core/`; must **not** import `react/` or `demo/`.

### 7.2 TypeScript

- `verbatimModuleSyntax`: use `import type` for type-only imports.
- Prefer `type` over `interface` unless extending is needed.
- No `any`; use `unknown` + narrowing at API boundaries (demo only).

---

## 8. Layer and rendering rules

- Keep **multi-canvas layer separation** (volume, candles, shapes, trades, overlay, axes).
- `renderAll` order must match current behavior: volume → candles → shapes → trades → axes → crosshair.
- Resize uses **container** `clientWidth` / `clientHeight`, not `window` dimensions.
- Attach pointer/wheel listeners to the **chart container** (or canvases within it), not `window`, unless a specific global behavior is required and documented.
- Do not allocate objects inside hot render paths when avoidable.

---

## 9. Refactoring workflow

When the user says to start refactoring:

1. Extract `ChartController` (or equivalent) from legacy `main.ts` logic without behavior changes.
2. Implement `TradingReload` as a thin React wrapper (ref + effect lifecycle + prop sync).
3. Move API/WebSocket/demo state to `demo/`.
4. Wire `src/index.ts` and Vite library build.
5. Delete obsolete empty files and duplicate stubs **last**, after `tsc` and manual smoke check.
6. Run `npm run format` and `npm run lint:fix`.
7. Compare behavior against last committed version (manual checklist); fix before finishing.

### 9.1 Manual regression checklist

- [ ] Chart fills parent container and resizes correctly
- [ ] Pan (drag), horizontal wheel zoom, Ctrl+wheel vertical zoom
- [ ] Crosshair + axis labels on move; hidden on leave
- [ ] Live candle updates (demo WebSocket)
- [ ] Open trades overlay + past trade markers (demo)
- [ ] Shape tools: draw each tool type; edit handles; Escape cancels tool
- [ ] `onShapeAdded` / `onShapeModified` / `onActiveShapeToolChange` fire correctly
- [ ] Trade SL/TP drag preview and `onTradeModify` on release
- [ ] Missing protection drag handles behave as before

Automated tests are **not** required in this phase.

---

## 10. Dependencies

- Add **React 18+** as `peerDependencies` (`react`, `react-dom`).
- Add `@types/react`, `@types/react-dom` as `devDependencies` for this repo’s demo and types emit.
- Do not add SSR frameworks, state libraries, or UI kits to the library package.

---

## 11. Code quality

- Match existing Biome settings (tabs, double quotes, line width 120).
- No drive-by refactors unrelated to the task.
- Reuse existing helpers (`LayerHelpers`, `TradeLayer.helpers`, `getPipSize`, etc.) before duplicating.
- `console.log` in shape/trade handlers is demo-level only; library callbacks should not log unless debugging behind a flag.

---

## 12. Git and commits

- Do not commit unless the user asks.
- Do not push unless the user asks.
- Never commit secrets (`.env`, API keys).

---

## 13. Explicitly rejected patterns

- Internal state for `candles`, `shapes`, `openTrades`, `activeShapeTool`, or merged `config`
- `fetch` / `WebSocket` inside `src/` (outside `demo/`)
- `window.setActiveShapeTool` as public API (demo may use React state instead)
- Publishing `demo/` in npm package `"files"`
- SSR or `next/dynamic` SSR patterns for this component
- Replacing canvas architecture with a single canvas without user approval

---

## 14. Answered product decisions (reference)

| Topic | Decision |
|-------|----------|
| Tool after shape drawn | `onActiveShapeToolChange(null)` |
| ShapesLayer cancel / `onToolChange` | `onActiveShapeToolChange(null)` |
| Sizing | 100% of parent element |
| Types export | Yes, from `src/index.ts` |
| Trade drag | Ephemeral preview during drag; props authoritative after parent updates |

---

*Last updated: refactor planning phase. Update this file when the public API or folder layout changes.*
