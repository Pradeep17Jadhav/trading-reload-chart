import { CHART_CONFIG } from "../src/config/chartConfig";
import type { ShapeToolType } from "../src/canvas/layers/ShapesLayer/ShapesLayer.types";

export const DEMO_ACTIVE_SYMBOL = "BTCUSD";

export const DEMO_TIMEFRAME = "15m";

export const DEMO_CANDLE_LIMIT = 500;

/** Broker (MT4/MT5) UTC+3 server time encoded as Unix seconds. */
export const DEMO_BROKER_TIMEZONE_OFFSET_MS = 3 * 60 * 60 * 1000;

export const DEMO_CHART_CONFIG = CHART_CONFIG;

export const DEMO_INITIAL_SHAPE_TOOL: ShapeToolType | null = null;
