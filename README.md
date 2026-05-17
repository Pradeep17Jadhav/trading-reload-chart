# Trading Chart Library by Pradeep

A high-performance HTML Canvas based trading chart application built with TypeScript.

This project focuses on rendering large financial datasets efficiently while providing smooth interactions such as zooming, panning, crosshair tracking, and real-time market visualization.

The application is designed with a layered canvas rendering architecture to minimize unnecessary redraws and improve rendering performance.

---

# Features

## Rendering Engine

- High-performance HTML Canvas rendering
- Layer-based rendering architecture
- Optimized redraw cycles
- Separate candle and overlay canvases
- Device pixel ratio scaling support
- Smooth rendering during drag and zoom interactions

## Chart Interactions

- Horizontal zoom
- Vertical zoom
- Mouse wheel zooming
- Ctrl + wheel vertical scaling
- Chart panning
- Crosshair tracking
- Real-time mouse position handling
- Pointer event support
- Resize-aware rendering

## Trading Visualization

- Candlestick rendering
- Price scaling
- Time scaling
- Dynamic candle spacing
- Price range calculation
- Grid alignment support
- Crosshair price and time tracking

## Developer Experience

- Written fully in TypeScript
- Modular architecture
- Layer-based rendering system
- Strong typing support
- Simple extensibility model
- Easy integration with APIs and WebSockets

---

# Tech Stack

| Technology  | Purpose                           |
| ----------- | --------------------------------- |
| TypeScript  | Core application logic            |
| HTML Canvas | High-performance rendering        |
| Vite        | Development server and build tool |
| CSS         | Styling                           |

---

# Project Structure

```txt
src/
├── canvas/
│   ├── layers/
│   │   ├── ExistingCandlesLayer.ts
│   │   ├── CrosshairLayer.ts
│   │   └── ...
│   ├── utils/
│   └── renderer/
│
├── models/
│   ├── Candle.ts
│   └── ...
│
├── utils/
├── constants/
├── config/
├── main.ts
└── main.css
```

---

# Architecture Overview

The chart uses a multi-layer canvas architecture.

## Candle Canvas

Responsible for rendering:

- Candlesticks
- Historical data
- Static chart visuals
- Grid structures

This layer redraws only when required.

## Overlay Canvas

Responsible for rendering:

- Crosshair
- Hover interactions
- Temporary overlays
- Pointer-driven visuals

This layer updates frequently without forcing candle redraws.

---

# Installation

## Clone Repository

```bash
git clone <your-repository-url>
cd <project-name>
```

## Install Dependencies

```bash
npm install
```

## Start Development Server

```bash
npm run dev
```

## Build Production Version

```bash
npm run build
```

## Preview Production Build

```bash
npm run preview
```

---

# Development Workflow

## Start Local Development

```bash
npm run dev
```

Vite will start a local development server with hot module replacement.

## Type Checking

```bash
npm run typecheck
```

## Linting

```bash
npm run lint
```

## Formatting

```bash
npm run format
```

---

# Data Model

## Candle Structure

```ts
export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};
```

---

# Rendering Pipeline

The rendering pipeline is optimized to reduce unnecessary work.

## Pipeline Steps

1. Receive dataset
2. Calculate visible range
3. Compute candle positions
4. Convert prices to Y coordinates
5. Draw visible candles only
6. Draw overlays separately
7. Render crosshair layer

---

# Coordinate System

## X Axis

The horizontal axis represents time.

Values are calculated based on:

- Candle width
- Candle gap
- Current zoom level
- Horizontal offset

## Y Axis

The vertical axis represents price.

Values are calculated using:

- Current visible price range
- Min/max visible prices
- Dynamic scaling
- Zoom multiplier

---

# Zoom System

The chart supports independent X and Y axis zooming.

## Horizontal Zoom

Triggered using:

- Mouse wheel
- Trackpad gestures

Adjusts:

- Candle spacing
- Visible candle count
- Horizontal scaling

## Vertical Zoom

Triggered using:

- Ctrl + Mouse wheel

Adjusts:

- Price scaling
- Visible price range
- Vertical compression/expansion

---

# Input Handling

The application uses pointer-driven interaction handling.

## Supported Events

```ts
pointerdown;
pointermove;
pointerup;
pointerleave;
pointerenter;
wheel;
resize;
```

---

# Performance Optimizations

## Layer Separation

Overlay rendering is separated from heavy candle rendering.

## Partial Redraws

Only visible data is rendered.

## Device Pixel Ratio Scaling

Canvas dimensions are scaled for high-DPI displays.

## Efficient Coordinate Conversion

Coordinate calculations are minimized during frame rendering.

## Lightweight Rendering Loops

Rendering avoids unnecessary object creation inside hot paths.

---

# Example Usage

## Basic Initialization

```ts
import type { Candle } from "./models/Candle";

const candles: Candle[] = [
  {
    time: 1710000000,
    open: 100,
    high: 110,
    low: 95,
    close: 108,
  },
];
```

---

# Interaction Controls

| Action             | Result             |
| ------------------ | ------------------ |
| Mouse Move         | Move crosshair     |
| Mouse Drag         | Pan chart          |
| Mouse Wheel        | Horizontal zoom    |
| Ctrl + Mouse Wheel | Vertical zoom      |
| Resize Window      | Recalculate layout |

---

# Configuration

Example chart configuration:

```ts
export const CHART_CONFIG = {
  zoom: {
    x: {
      speed: 0.1,
      min: 5,
      max: 500,
    },
    y: {
      speed: 0.1,
      min: 0.5,
      max: 10,
    },
  },
};
```

---

# Future Improvements

## Planned Features

- Real-time WebSocket streaming
- Technical indicators
- Drawing tools
- Order book visualization
- Trade markers
- Multi-timeframe support
- Volume profile
- Price alerts
- Replay mode
- Mobile gesture support
- GPU acceleration experiments
- Offscreen canvas rendering
- Virtualized datasets

---

# Scalability Goals

The architecture is designed to support:

- Large candle datasets
- Real-time updates
- High-frequency redraws
- Multiple chart instances
- Professional trading interfaces

---

# Browser Support

| Browser | Supported |
| ------- | --------- |
| Chrome  | Yes       |
| Edge    | Yes       |
| Firefox | Yes       |
| Safari  | Yes       |

---

# Recommended Improvements

## Rendering

- Dirty rectangle rendering
- WebGL renderer
- OffscreenCanvas workers
- Frame scheduling optimizations

## Interaction System

- Touch gestures
- Kinetic scrolling
- Zoom centering
- Inertial panning

## Data System

- Incremental candle loading
- Historical pagination
- Streaming APIs
- Binary transport support

---

# Design Philosophy

This project focuses on:

- Performance first
- Minimal rendering overhead
- Modular architecture
- Strong TypeScript safety
- Extensibility
- Professional trading UX

---

# Contributing

## Setup

```bash
npm install
npm run dev
```

## Guidelines

- Keep rendering logic optimized
- Avoid allocations in hot paths
- Maintain strict TypeScript typing
- Prefer modular architecture
- Benchmark rendering-heavy changes

---

# License

MIT License

---

# Author

Built by Pradeep.
