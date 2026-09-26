import type { ShapeToolType } from "../src/canvas/layers/ShapesLayer/ShapesLayer.types";
import { CHART_CONFIG } from "../src/config/chartConfig";
import type { ChartConfig } from "../src/config/chartConfig.types";
import { COLORS } from "../src/config/colors";

export const DEMO_ACTIVE_SYMBOL = "EURUSD";

export const DEMO_TIMEFRAME = "1m";

export const DEMO_CANDLE_LIMIT = 500;

/** Broker (MT4/MT5) UTC+3 server time encoded as Unix seconds. */
export const DEMO_BROKER_TIMEZONE_OFFSET_MS = 3 * 60 * 60 * 1000;

export const DEMO_CHART_CONFIG = {
	...CHART_CONFIG,
	watermark: {
		...CHART_CONFIG.watermark,
		text: `${DEMO_ACTIVE_SYMBOL}, ${DEMO_TIMEFRAME}`,
		position: "top-center",
		fontSize: 24,
		fontWeight: 700,
		color: COLORS.white,
		opacity: 0.35,
	},
} satisfies ChartConfig;

export const DEMO_INITIAL_SHAPE_TOOL: ShapeToolType | null = null;
