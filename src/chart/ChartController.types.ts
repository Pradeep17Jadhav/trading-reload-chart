import type {
	Shape,
	ShapeAddedPayload,
	ShapeModifiedPayload,
	ShapeSelectedPayload,
	ShapeToolType,
} from "../canvas/layers/ShapesLayer/ShapesLayer.types";
import type { ChartConfig } from "../config/chartConfig.types";
import type { Candle } from "../models/Candle.types";
import type { ClosedTrade, OpenTrade } from "../models/Trade.types";
import type { DeepPartial } from "./utils/deepPartial.types";

/**
 * Payload emitted when the user commits a stop-loss or take-profit change.
 *
 * @example
 * ```ts
 * const payload: TradeModifyPayload = {
 *   ticket: 101245,
 *   sl: 1.0835,
 *   tp: 1.091,
 * };
 * ```
 */
export type TradeModifyPayload = {
	/** Trade ticket identifier.
	 *
	 * @example `101245`
	 */
	ticket: number;

	/** New stop-loss value, or `null` to clear it.
	 *
	 * @example `1.0835`
	 */
	sl?: number | null;

	/** New take-profit value, or `null` to clear it.
	 *
	 * @example `1.091`
	 */
	tp?: number | null;
};

/**
 * Previous day high and low values used by overlays or external tooling.
 *
 * @example
 * ```ts
 * const previousDay: PreviousDay = {
 *   high: 1.0924,
 *   low: 1.0811,
 * };
 * ```
 */
export type PreviousDay = {
	/**
	 * Trading symbol for the previous day data.
	 *
	 * @example `"EURUSD"`
	 */
	symbol: string;

	/** Previous day high price.
	 *
	 * @example `1.0924`
	 */
	high: number;

	/** Previous day low price.
	 *
	 * @example `1.0811`
	 */
	low: number;
};

/**
 * Controlled props consumed by the internal chart controller and by
 * {@link TradingReload}.
 *
 * @example
 * ```ts
 * const props: ChartControllerProps = {
 *   activeSymbol: "EURUSD",
 *   candles,
 *   liveCandle,
 *   openTrades,
 *   closedTrades,
 *   shapes,
 *   activeShapeTool,
 *   onShapeAdded: ({ shape }) => setShapes((prev) => [...prev, shape]),
 *   onActiveShapeToolChange: setActiveShapeTool,
 * };
 * ```
 */
export type ChartControllerProps = {
	/**
	 * Trading symbol for the current chart.
	 *
	 * @example `"EURUSD"`
	 */
	activeSymbol: string;

	/**
	 * Historical candles shown by the chart.
	 *
	 * `time` values are expected in UTC milliseconds unless you also pass
	 * `brokerTimezoneOffsetMs`.
	 *
	 * @example
	 * ```ts
	 * candles: [{ time: 1716883200000, open: 1.084, high: 1.086, low: 1.083, close: 1.085, volume: 1200, ask: 1.0851, isClosed: true }]
	 * ```
	 */
	candles: Candle[];

	/**
	 * Forming realtime candle. Pass `null` when there is no live update.
	 *
	 * @example
	 * ```ts
	 * liveCandle: { time: 1716884100000, open: 1.085, high: 1.0862, low: 1.0848, close: 1.086, volume: 320, ask: 1.0861, isClosed: false }
	 * ```
	 */
	liveCandle: Candle | null;

	/**
	 * Parent-owned list of currently open trades rendered on the chart.
	 *
	 * @example
	 * ```ts
	 * openTrades: [{ ticket: 101245, symbol: "EURUSD", volume: 0.5, sl: 1.0835, tp: 1.091, type: "buy", openTime: 1716883200000, openPrice: 1.085, commission: 0, swap: 0, pnl: 12.5, status: "open" }]
	 * ```
	 */
	openTrades: OpenTrade[];

	/**
	 * Completed trades rendered as historical markers.
	 *
	 * @example
	 * ```ts
	 * closedTrades: [{ ticket: 101245, symbol: "EURUSD", type: "sell", openTime: 1716796800000, openPrice: 1.089, closeTime: 1716800400000, closePrice: 1.086, volume: 1, sl: 1.091, tp: 1.086, commission: 0, swap: 0, pnl: 30, status: "closed" }]
	 * ```
	 */
	closedTrades: ClosedTrade[];

	/**
	 * Parent-owned shapes rendered and edited by the chart.
	 *
	 * @example
	 * ```ts
	 * shapes: [{ id: "shape-1", type: "trendline", vertices: [{ time: 1716883200000, price: 1.084 }, { time: 1716886800000, price: 1.088 }] }]
	 * ```
	 */
	shapes: Shape[];

	/**
	 * Currently active drawing tool, or `null` when shape creation is disabled.
	 *
	 * @example `"rectangle"`
	 */
	activeShapeTool: ShapeToolType | null;

	/**
	 * Partial chart config merged on top of the library defaults.
	 *
	 * @example
	 * ```ts
	 * config: { colors: { background: "#0d1117" }, candles: { defaultWidth: 10 } }
	 * ```
	 */
	config?: DeepPartial<ChartConfig>;

	/**
	 * Optional broker timezone offset used to normalize broker-encoded candle
	 * timestamps.
	 *
	 * @example `19800000`
	 */
	brokerTimezoneOffsetMs?: number;

	/**
	 * Optional previous day high/low values for related overlays.
	 *
	 * @example
	 * ```ts
	 * previousDay: { high: 1.0924, low: 1.0811 }
	 * ```
	 */
	previousDay?: PreviousDay | null;

	/**
	 * Called after the user completes a brand-new shape.
	 *
	 * @example
	 * ```ts
	 * onShapeAdded: ({ shape }) => setShapes((prev) => [...prev, shape])
	 * ```
	 */
	onShapeAdded?: (payload: ShapeAddedPayload) => void;

	/**
	 * Called after the user edits an existing shape.
	 *
	 * @example
	 * ```ts
	 * onShapeModified: ({ id, shape }) => updateShape(id, shape)
	 * ```
	 */
	onShapeModified?: (payload: ShapeModifiedPayload) => void;

	/**
	 * Called when the selected shape changes, or `null` when selection clears.
	 *
	 * @example
	 * ```ts
	 * onShapeSelected: (payload) => setSelectedShape(payload?.shapeId ?? null)
	 * ```
	 */
	onShapeSelected?: (payload: ShapeSelectedPayload | null) => void;

	/**
	 * Called when the chart wants the parent to change the active drawing tool.
	 *
	 * The chart sends `null` after a completed draw or Escape/cancel path.
	 *
	 * @example
	 * ```ts
	 * onActiveShapeToolChange: setActiveShapeTool
	 * ```
	 */
	onActiveShapeToolChange?: (tool: ShapeToolType | null) => void;

	/**
	 * Called when the user commits an SL/TP modification on pointer release.
	 *
	 * @example
	 * ```ts
	 * onTradeModify: async ({ ticket, sl, tp }) => {
	 *   await api.modifyTrade({ ticket, sl, tp });
	 * }
	 * ```
	 */
	onTradeModify?: (payload: TradeModifyPayload) => void;

	/**
	 * Called when the user clicks the close button on a trade handle.
	 *
	 * @example
	 * ```ts
	 * onTradeClose: ({ ticket }) => api.closeTrade(ticket)
	 * ```
	 */
	onTradeClose?: (payload: { ticket: number }) => void;
};
