# Trading Chart Library by Pradeep

A **React chart library** (HTML Canvas) for trading UIs: candlesticks, volume, axes, crosshair, drawing tools, and open/past trade overlays. Data and state are **controlled by the parent** via props and callbacks.

The repo includes a **demo app** under `demo/` (Vite dev server) that loads live/historical data from an API. That harness is not published in the npm package.

For architecture, conventions, and agent guidelines, see [AGENTS.md](./AGENTS.md).

---

## Requirements

- Node.js 18+
- npm (or compatible package manager)
- React **18.3+** or **19** (peer dependency when consuming the library)

---

## Quick start (local development)

1. **Clone and install**

```bash
git clone <repository-url>
cd trading-reload-chart
npm install
```

2. **Run the demo** (hot reload, port **8999** by default)

```bash
npm run dev
```

Open the URL Vite prints (typically `http://localhost:8999`). The demo mounts `TradingReload` with sample API/WebSocket wiring in `demo/`.

3. **Optional checks**

```bash
npm run typecheck   # TypeScript
npm run lint        # Biome
npm run format      # Biome format
```

---

## Build commands

| Script               | Purpose                                     |
| -------------------- | ------------------------------------------- |
| `npm run dev`        | Demo app from source (`demo/main.tsx`)      |
| `npm run build`      | **Library** build → `dist/` (ESM + `.d.ts`) |
| `npm run build:demo` | Static **demo** site build                  |
| `npm run preview`    | Preview last Vite build                     |

### Production library build

```bash
npm run build
```

Output (gitignored):

- `dist/trading-reload-chart.js` — ESM bundle (React externalized)
- `dist/index.d.ts` — public TypeScript declarations

`package.json` exposes the library via `"exports"`, `"main"`, `"module"`, and `"types"`. Only `dist/` is included in `"files"` for publishing.

### Demo production build

```bash
npm run build:demo
npm run preview
```

---

## Using the library in React / Next.js

The chart is **client-only** (canvas + DOM). It does **not** support SSR.

### 1. Install the package

**From npm** (after publish):

```bash
npm install trading-reload-chart react react-dom
```

**Directly from GitHub**:

```bash
npm install git+https://github.com/Pradeep17Jadhav/trading-reload-chart.git#main
```

**From this repo** (local path or `npm pack`):

```bash
# In trading-reload-chart repo
npm run build
npm pack
# In your app
npm install /path/to/trading-reload-chart/trading-reload-chart-1.0.0.tgz
```

Or link during development:

```bash
cd trading-reload-chart && npm run build && npm link
cd your-app && npm link trading-reload-chart
```

### 2. Next.js App Router

Use a client boundary. The component already includes `"use client"`.

```tsx
"use client";

import { useState } from "react";
import {
  TradingReload,
  type Candle,
  type Shape,
  type ShapeToolType,
  type OpenTrade,
} from "trading-reload-chart";

export function ChartPanel() {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [activeShapeTool, setActiveShapeTool] = useState<ShapeToolType | null>(
    null,
  );

  return (
    <div className="h-full w-full min-h-[400px]">
      <TradingReload
        activeSymbol="EURUSD"
        candles={candles}
        shapes={shapes}
        activeShapeTool={activeShapeTool}
        onShapeAdded={(payload) => {
          setShapes((prev) => [...prev, payload.shape]);
          setActiveShapeTool(null);
        }}
        onActiveShapeToolChange={setActiveShapeTool}
      />
    </div>
  );
}
```

- Give the parent a **defined height** (flex child, `h-full`, or fixed `min-height`). `TradingReload` fills **100%** of that container.
- Do **not** import chart CSS manually; styles ship with the component (`src/styles/chart.css`).

### 3. Vite / Create React App

Same import; wrap the chart in a sized container:

```tsx
import { TradingReload, type Candle } from "trading-reload-chart";

export function App() {
  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <TradingReload
        activeSymbol="EURUSD"
        candles={candles}
        shapes={[]}
        activeShapeTool={null}
      />
    </div>
  );
}
```

### 4. Public API surface

Import from the package root:

| Export                                       | Description          |
| -------------------------------------------- | -------------------- |
| `TradingReload`                              | Main React component |
| `TradingReloadProps`                         | Component props      |
| `Candle`, `OpenTrade`, `ClosedTrade`, …      | Domain types         |
| `Shape`, `ShapeToolType`, shape payloads     | Drawing types        |
| `ChartConfig`, `CHART_CONFIG`, `DeepPartial` | Configuration        |
| `PastTradeIndicator`, trade handle types     | Trade overlay types  |

Controlled props (parent owns state): `candles`, `liveCandle`, `openTrades`, `pastTrades`, `shapes`, `activeShapeTool`, `config`, `activeSymbol`.

Callbacks: `onShapeAdded`, `onShapeModified`, `onActiveShapeToolChange`, `onTradeModify`.

See [AGENTS.md](./AGENTS.md) for the full props contract.

---

## Project layout

```txt
trading-reload-chart/
├── demo/                 # Dev harness (API/WebSocket); not published
├── src/
│   ├── index.ts          # Public exports
│   ├── react/            # TradingReload component
│   ├── chart/            # ChartController, DOM, utils
│   ├── canvas/layers/    # Canvas layers (candles, shapes, trades, …)
│   ├── config/           # CHART_CONFIG and types
│   ├── models/           # Candle, Trade, ChartViewport, … (*.types.ts)
│   ├── helpers/          # Shared pure utilities
│   ├── core/             # Coordinate math
│   └── styles/           # chart.css
├── dist/                 # Library build output
├── AGENTS.md
└── vite.config.ts        # `dev` = demo; `build --mode library` = package
```

Type declarations live in **`*.types.ts`** files next to implementation code (see AGENTS.md).

---

## Features

- Layered canvas rendering (volume, candles, shapes, trades, axes, crosshair)
- Pan, horizontal wheel zoom, Ctrl+wheel vertical zoom
- Drawing tools (trendline, rectangle, path, fib, long/short position)
- Open trade SL/TP drag with `onTradeModify` on release
- Past trade markers
- Deep-merge chart `config` over defaults

---

## Interaction

| Action                 | Result                                        |
| ---------------------- | --------------------------------------------- |
| Drag                   | Pan chart                                     |
| Mouse wheel            | Horizontal zoom                               |
| Ctrl + wheel           | Vertical zoom                                 |
| Move pointer           | Crosshair + axis labels                       |
| Escape (while drawing) | Cancel tool (`onActiveShapeToolChange(null)`) |

---

## Browser support

Modern evergreen browsers with Canvas 2D (Chrome, Edge, Firefox, Safari).

---

## License

Commercial, proprietary license. Use of this library requires a paid license,
subscription, or other written authorization from Pradeep Jadhav. See
[LICENSE](./LICENSE).
