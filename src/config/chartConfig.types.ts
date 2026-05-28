import type { PartialShapeConfig } from "../canvas/layers/ShapesLayer/ShapesLayer.types";

export type { PartialShapeConfig };

/**
 * Horizontal zoom behavior for wheel interactions.
 *
 * @example
 * ```ts
 * const zoomX: HorizontalZoomConfig = { speed: 0.05, min: 0.03, max: 20 };
 * ```
 */
export type HorizontalZoomConfig = {
	speed: number;
	min: number;
	max: number;
};

/**
 * Vertical zoom behavior used for Ctrl + wheel interactions.
 *
 * @example
 * ```ts
 * const zoomY: VerticalZoomConfig = { speed: 0.1, min: 10, max: 500 };
 * ```
 */
export type VerticalZoomConfig = {
	speed: number;
	min: number;
	max: number;
};

/**
 * Zoom settings for both axes.
 *
 * @example
 * ```ts
 * const zoom: ZoomConfig = {
 *   x: { speed: 0.05, min: 0.03, max: 20 },
 *   y: { speed: 0.1, min: 10, max: 500 },
 * };
 * ```
 */
export type ZoomConfig = {
	x: HorizontalZoomConfig;
	y: VerticalZoomConfig;
};

/**
 * Style for the live bid or ask price line.
 *
 * @example
 * ```ts
 * const line: LivePriceLineConfig = {
 *   visible: true,
 *   width: 1,
 *   opacity: 0.7,
 *   dash: [4, 4],
 *   bullishColor: "#22c55e",
 *   bearishColor: "#ef4444",
 * };
 * ```
 */
export type LivePriceLineConfig = {
	visible: boolean;
	width: number;
	opacity: number;
	dash: number[];
	bullishColor: string;
	bearishColor: string;
};

/**
 * Candle rendering behavior and live price settings.
 *
 * @example
 * ```ts
 * const candles: CandlesConfig = {
 *   defaultWidth: 8,
 *   defaultGap: 2,
 *   minBodyHeight: 1,
 *   autoFollowLatestCandle: true,
 *   autoFollowThresholdCandles: 10,
 *   rightOffsetCandles: 15,
 *   liveBidPriceLine: { visible: true, width: 1, opacity: 0.7, dash: [4, 4], bullishColor: "#22c55e", bearishColor: "#ef4444" },
 *   liveAskPriceLine: { visible: true, width: 1, opacity: 0.7, dash: [4, 6], bullishColor: "#a855f7", bearishColor: "#a855f7" },
 * };
 * ```
 */
export type CandlesConfig = {
	defaultWidth: number;
	defaultGap: number;
	minBodyHeight: number;
	autoFollowLatestCandle: boolean;
	autoFollowThresholdCandles: number;
	rightOffsetCandles: number;
	liveBidPriceLine: LivePriceLineConfig;
	liveAskPriceLine: LivePriceLineConfig;
};

/**
 * Volume layer appearance and sizing.
 *
 * @example
 * ```ts
 * const volume: VolumeConfig = {
 *   visible: true,
 *   bullishColor: "#22c55e",
 *   bearishColor: "#ef4444",
 *   opacity: 0.35,
 *   height: 200,
 *   bottomOffset: 0,
 *   minBarHeight: 1,
 * };
 * ```
 */
export type VolumeConfig = {
	visible: boolean;
	bullishColor: string;
	bearishColor: string;
	opacity: number;
	height: number;
	bottomOffset: number;
	minBarHeight: number;
};

/**
 * Crosshair line style.
 *
 * @example
 * ```ts
 * const crosshair: CrosshairConfig = {
 *   color: "rgba(255,255,255,0.35)",
 *   thickness: 1,
 *   style: "dashed",
 * };
 * ```
 */
export type CrosshairConfig = {
	color: string;
	thickness: number;
	style: "solid" | "dashed" | "dotted";
};

/**
 * Placement for trade handles relative to the price line.
 *
 * @example
 * ```ts
 * const position: TradeHandlePositionConfig = {
 *   placement: "left",
 *   margin: 100,
 * };
 * ```
 */
export type TradeHandlePositionConfig = {
	placement: "left" | "center" | "right";
	margin?: number;
};

/**
 * Line styling used by trade handles and connector lines.
 *
 * @example
 * ```ts
 * const line: TradeHandleLineConfig = {
 *   width: 1,
 *   color: "#22c55e",
 *   opacity: 0.9,
 *   style: "dashed",
 *   dash: [4, 4],
 * };
 * ```
 */
export type TradeHandleLineConfig = {
	width: number;
	color: string;
	opacity: number;
	style: "solid" | "dashed" | "dotted";
	dash?: number[];
};

/**
 * Rectangular trade handle appearance.
 *
 * @example
 * ```ts
 * const handle: TradeHandleRectConfig = {
 *   height: 22,
 *   widthVolume: 60,
 *   widthPNL: 80,
 *   widthClose: 24,
 *   position: { placement: "left", margin: 100 },
 *   borderWidth: 1,
 *   borderColor: "#3b82f6",
 *   borderOpacity: 0.9,
 *   backgroundColor: "#111827",
 *   backgroundOpacity: 0.9,
 *   sectionDividerColor: "#374151",
 *   paddingX: 10,
 *   closeButtonColor: "#3b82f6",
 *   showVolumeSection: true,
 *   showPnlSection: true,
 *   showCloseSection: true,
 * };
 * ```
 */
export type TradeHandleRectConfig = {
	height: number;
	widthVolume: number;
	widthPNL: number;
	widthClose: number;
	position: TradeHandlePositionConfig;
	borderWidth: number;
	borderColor: string;
	borderOpacity: number;
	backgroundColor: string;
	backgroundOpacity: number;
	sectionDividerColor: string;
	paddingX: number;
	closeButtonColor: string;
	showVolumeSection: boolean;
	showPnlSection: boolean;
	showCloseSection: boolean;
};

/**
 * Combined trade handle line and box styling.
 *
 * @example
 * ```ts
 * const style: TradeHandleStyleConfig = {
 *   handle: { height: 22, widthVolume: 60, widthPNL: 80, widthClose: 24, position: { placement: "left", margin: 100 }, borderWidth: 1, borderColor: "#3b82f6", borderOpacity: 0.9, backgroundColor: "#111827", backgroundOpacity: 0.9, sectionDividerColor: "#374151", paddingX: 10, closeButtonColor: "#3b82f6", showVolumeSection: true, showPnlSection: true, showCloseSection: true },
 *   handleLine: { width: 1, color: "#3b82f6", opacity: 1, style: "solid" },
 * };
 * ```
 */
export type TradeHandleStyleConfig = {
	handle: TradeHandleRectConfig;
	handleLine: TradeHandleLineConfig;
};

/**
 * Positive and negative PnL text colors.
 *
 * @example
 * ```ts
 * const colors: TradePnlTextColorConfig = {
 *   positive: "#22c55e",
 *   negative: "#ef4444",
 * };
 * ```
 */
export type TradePnlTextColorConfig = {
	positive: string;
	negative: string;
};

/**
 * Side on which missing protection handles appear.
 *
 * @example `"right"`
 */
export type MissingTradeProtectionHandlePlacement = "left" | "right";

/**
 * Style for the small add-SL / add-TP handles.
 *
 * @example
 * ```ts
 * const handle: MissingTradeProtectionHandleRectConfig = {
 *   width: 32,
 *   height: 22,
 *   gapFromStartPriceHandle: 6,
 *   gapBetweenHandles: 4,
 *   placement: "right",
 *   borderWidth: 1,
 *   borderColor: "#ef4444",
 *   borderOpacity: 0.5,
 *   backgroundColor: "#2b0f12",
 *   backgroundOpacity: 0.3,
 *   textColor: "#ef4444",
 *   textOpacity: 0.6,
 *   font: "12px Arial",
 * };
 * ```
 */
export type MissingTradeProtectionHandleRectConfig = {
	width: number;
	height: number;
	gapFromStartPriceHandle: number;
	gapBetweenHandles: number;
	placement: MissingTradeProtectionHandlePlacement;
	borderWidth: number;
	borderColor: string;
	borderOpacity: number;
	backgroundColor: string;
	backgroundOpacity: number;
	textColor: string;
	textOpacity: number;
	font: string;
};

/**
 * Style for the temporary handle preview shown while adding SL or TP.
 *
 * @example
 * ```ts
 * const handle: TemporaryTradeProtectionHandleRectConfig = {
 *   height: 22,
 *   widthPNL: 80,
 *   position: { placement: "left", margin: 100 },
 *   borderWidth: 1,
 *   borderColor: "#22c55e",
 *   borderOpacity: 0.4,
 *   backgroundColor: "#0f2b18",
 *   backgroundOpacity: 0.9,
 *   paddingX: 10,
 *   textColor: "#22c55e",
 *   textOpacity: 0.85,
 *   font: "12px Arial",
 * };
 * ```
 */
export type TemporaryTradeProtectionHandleRectConfig = {
	height: number;
	widthPNL: number;
	position: TradeHandlePositionConfig;
	borderWidth: number;
	borderColor: string;
	borderOpacity: number;
	backgroundColor: string;
	backgroundOpacity: number;
	paddingX: number;
	textColor: string;
	textOpacity: number;
	font: string;
};

/**
 * Config for missing SL/TP affordances.
 *
 * @example
 * ```ts
 * const missingProtection: MissingTradeProtectionConfig = {
 *   visible: true,
 *   dragActivationThresholdPx: 2,
 *   slHandle: { width: 32, height: 22, gapFromStartPriceHandle: 6, gapBetweenHandles: 4, placement: "right", borderWidth: 1, borderColor: "#ef4444", borderOpacity: 0.5, backgroundColor: "#2b0f12", backgroundOpacity: 0.3, textColor: "#ef4444", textOpacity: 0.6, font: "12px Arial" },
 *   tpHandle: { width: 32, height: 22, gapFromStartPriceHandle: 6, gapBetweenHandles: 4, placement: "right", borderWidth: 1, borderColor: "#22c55e", borderOpacity: 0.5, backgroundColor: "#0f2b18", backgroundOpacity: 0.3, textColor: "#22c55e", textOpacity: 0.6, font: "12px Arial" },
 *   temporarySlHandle: { height: 22, widthPNL: 80, position: { placement: "left", margin: 100 }, borderWidth: 1, borderColor: "#ef4444", borderOpacity: 0.4, backgroundColor: "#2b0f12", backgroundOpacity: 0.9, paddingX: 10, textColor: "#ef4444", textOpacity: 0.85, font: "12px Arial" },
 *   temporaryTpHandle: { height: 22, widthPNL: 80, position: { placement: "left", margin: 100 }, borderWidth: 1, borderColor: "#22c55e", borderOpacity: 0.4, backgroundColor: "#0f2b18", backgroundOpacity: 0.9, paddingX: 10, textColor: "#22c55e", textOpacity: 0.85, font: "12px Arial" },
 *   temporarySlLine: { width: 1, color: "#ef4444", opacity: 0.9, style: "dotted", dash: [2, 4] },
 *   temporaryTpLine: { width: 1, color: "#22c55e", opacity: 0.9, style: "dotted", dash: [2, 4] },
 * };
 * ```
 */
export type MissingTradeProtectionConfig = {
	visible: boolean;
	dragActivationThresholdPx: number;
	slHandle: MissingTradeProtectionHandleRectConfig;
	tpHandle: MissingTradeProtectionHandleRectConfig;
	temporarySlHandle: TemporaryTradeProtectionHandleRectConfig;
	temporaryTpHandle: TemporaryTradeProtectionHandleRectConfig;
	temporarySlLine: TradeHandleLineConfig;
	temporaryTpLine: TradeHandleLineConfig;
};

/**
 * Full trade handle configuration.
 *
 * @example
 * ```ts
 * const tradeHandles: TradeHandlesConfig = {
 *   font: "12px Arial",
 *   textColor: "#ffffff",
 *   textOpacity: 0.8,
 *   pnlTextColors: { positive: "#22c55e", negative: "#ef4444" },
 *   slHandle: { handle: { height: 22, widthVolume: 60, widthPNL: 80, widthClose: 24, position: { placement: "left", margin: 100 }, borderWidth: 1, borderColor: "#ef4444", borderOpacity: 0.4, backgroundColor: "#2b0f12", backgroundOpacity: 0.9, sectionDividerColor: "#374151", paddingX: 10, closeButtonColor: "#ef4444", showVolumeSection: false, showPnlSection: true, showCloseSection: true }, handleLine: { width: 1, color: "#ef4444", opacity: 0.9, style: "dashed", dash: [4, 4] } },
 *   tpHandle: { handle: { height: 22, widthVolume: 60, widthPNL: 80, widthClose: 24, position: { placement: "left", margin: 100 }, borderWidth: 1, borderColor: "#22c55e", borderOpacity: 0.4, backgroundColor: "#0f2b18", backgroundOpacity: 0.9, sectionDividerColor: "#374151", paddingX: 10, closeButtonColor: "#22c55e", showVolumeSection: false, showPnlSection: true, showCloseSection: true }, handleLine: { width: 1, color: "#22c55e", opacity: 0.9, style: "dashed", dash: [4, 4] } },
 *   startPriceHandle: { handle: { height: 22, widthVolume: 60, widthPNL: 80, widthClose: 24, position: { placement: "left", margin: 100 }, borderWidth: 1, borderColor: "#3b82f6", borderOpacity: 0.9, backgroundColor: "#111827", backgroundOpacity: 0.9, sectionDividerColor: "#374151", paddingX: 10, closeButtonColor: "#3b82f6", showVolumeSection: true, showPnlSection: true, showCloseSection: true }, handleLine: { width: 1, color: "#3b82f6", opacity: 1, style: "solid" } },
 *   missingProtectionHandles: { visible: true, dragActivationThresholdPx: 2, slHandle: { width: 32, height: 22, gapFromStartPriceHandle: 6, gapBetweenHandles: 4, placement: "right", borderWidth: 1, borderColor: "#ef4444", borderOpacity: 0.5, backgroundColor: "#2b0f12", backgroundOpacity: 0.3, textColor: "#ef4444", textOpacity: 0.6, font: "12px Arial" }, tpHandle: { width: 32, height: 22, gapFromStartPriceHandle: 6, gapBetweenHandles: 4, placement: "right", borderWidth: 1, borderColor: "#22c55e", borderOpacity: 0.5, backgroundColor: "#0f2b18", backgroundOpacity: 0.3, textColor: "#22c55e", textOpacity: 0.6, font: "12px Arial" }, temporarySlHandle: { height: 22, widthPNL: 80, position: { placement: "left", margin: 100 }, borderWidth: 1, borderColor: "#ef4444", borderOpacity: 0.4, backgroundColor: "#2b0f12", backgroundOpacity: 0.9, paddingX: 10, textColor: "#ef4444", textOpacity: 0.85, font: "12px Arial" }, temporaryTpHandle: { height: 22, widthPNL: 80, position: { placement: "left", margin: 100 }, borderWidth: 1, borderColor: "#22c55e", borderOpacity: 0.4, backgroundColor: "#0f2b18", backgroundOpacity: 0.9, paddingX: 10, textColor: "#22c55e", textOpacity: 0.85, font: "12px Arial" }, temporarySlLine: { width: 1, color: "#ef4444", opacity: 0.9, style: "dotted", dash: [2, 4] }, temporaryTpLine: { width: 1, color: "#22c55e", opacity: 0.9, style: "dotted", dash: [2, 4] } },
 * };
 * ```
 */
export type TradeHandlesConfig = {
	font: string;
	textColor: string;
	textOpacity: number;
	pnlTextColors: TradePnlTextColorConfig;
	slHandle: TradeHandleStyleConfig;
	tpHandle: TradeHandleStyleConfig;
	startPriceHandle: TradeHandleStyleConfig;
	missingProtectionHandles: MissingTradeProtectionConfig;
};

/**
 * Arrow appearance for closed trade markers.
 *
 * @example
 * ```ts
 * const arrow: ClosedTradeIndicatorArrowConfig = {
 *   visible: true,
 *   width: 60,
 *   height: 30,
 *   headHeightRatio: 0.45,
 *   shaftWidthRatio: 6,
 *   buyColor: "#22c55e",
 *   sellColor: "#ef4444",
 *   buyBorderColor: "#ffffff",
 *   sellBorderColor: "#ffffff",
 *   borderWidth: 1,
 *   opacity: 1,
 * };
 * ```
 */
export type ClosedTradeIndicatorArrowConfig = {
	visible: boolean;
	width: number;
	height: number;
	headHeightRatio: number;
	shaftWidthRatio: number;
	buyColor: string;
	sellColor: string;
	buyBorderColor: string;
	sellBorderColor: string;
	borderWidth: number;
	opacity: number;
};

/**
 * Historical trade marker configuration.
 *
 * @example
 * ```ts
 * const closedTrades: ClosedTradeIndicatorsConfig = {
 *   visible: true,
 *   arrow: { visible: true, width: 60, height: 30, headHeightRatio: 0.45, shaftWidthRatio: 6, buyColor: "#22c55e", sellColor: "#ef4444", buyBorderColor: "#ffffff", sellBorderColor: "#ffffff", borderWidth: 1, opacity: 1 },
 *   connectorLine: { width: 1, color: "#ffffff", opacity: 0.65, style: "dotted", dash: [2, 4] },
 * };
 * ```
 */
export type ClosedTradeIndicatorsConfig = {
	visible: boolean;
	arrow: ClosedTradeIndicatorArrowConfig;
	connectorLine: TradeHandleLineConfig;
};

/**
 * Core bullish, bearish, and background colors.
 *
 * @example
 * ```ts
 * const colors: ColorsConfig = {
 *   bullish: "#22c55e",
 *   bearish: "#ef4444",
 *   background: "#0b1220",
 * };
 * ```
 */
export type ColorsConfig = {
	bullish: string;
	bearish: string;
	background: string;
};

/**
 * Crosshair label box shown on the axes.
 *
 * @example
 * ```ts
 * const label: AxisCrosshairLabelConfig = {
 *   backgroundColor: "#111827",
 *   borderColor: "#111827",
 *   borderWidth: 1,
 *   textColor: "#ffffff",
 *   font: "12px Arial",
 *   paddingX: 8,
 *   height: 26,
 * };
 * ```
 */
export type AxisCrosshairLabelConfig = {
	backgroundColor: string;
	borderColor: string;
	borderWidth: number;
	textColor: string;
	font: string;
	paddingX: number;
	height: number;
};

/**
 * Y-axis styling and metrics.
 *
 * @example
 * ```ts
 * const axisY: AxisYConfig = {
 *   width: 80,
 *   backgroundColor: "#0b1220",
 *   borderColor: "#1f2937",
 *   borderWidth: 1,
 *   textColor: "#cbd5e1",
 *   font: "12px Arial",
 *   textAlign: "left",
 *   tickCount: 12,
 *   tickColor: "#334155",
 *   tickWidth: 1,
 *   tickLength: 4,
 *   tickGap: 64,
 *   labelOffsetX: 8,
 *   crosshairLabel: { backgroundColor: "#111827", borderColor: "#111827", borderWidth: 1, textColor: "#ffffff", font: "12px Arial", paddingX: 8, height: 20 },
 * };
 * ```
 */
export type AxisYConfig = {
	width: number;
	backgroundColor: string;
	borderColor: string;
	borderWidth: number;
	textColor: string;
	font: string;
	textAlign: CanvasTextAlign;
	tickCount: number;
	tickColor: string;
	tickWidth: number;
	tickLength: number;
	tickGap: number;
	labelOffsetX: number;
	crosshairLabel: AxisCrosshairLabelConfig;
};

/**
 * X-axis styling and metrics.
 *
 * @example
 * ```ts
 * const axisX: AxisXConfig = {
 *   height: 30,
 *   backgroundColor: "#0b1220",
 *   borderColor: "#1f2937",
 *   borderWidth: 1,
 *   textColor: "#cbd5e1",
 *   font: "12px Arial",
 *   textAlign: "center",
 *   tickColor: "#334155",
 *   tickWidth: 1,
 *   tickLength: 4,
 *   labelOffsetY: 16,
 *   minLabelGap: 16,
 *   crosshairLabel: { backgroundColor: "#111827", borderColor: "#111827", borderWidth: 1, textColor: "#ffffff", font: "12px Arial", paddingX: 8, height: 26 },
 * };
 * ```
 */
export type AxisXConfig = {
	height: number;
	backgroundColor: string;
	borderColor: string;
	borderWidth: number;
	textColor: string;
	font: string;
	textAlign: CanvasTextAlign;
	tickColor: string;
	tickWidth: number;
	tickLength: number;
	labelOffsetY: number;
	minLabelGap: number;
	crosshairLabel: AxisCrosshairLabelConfig;
};

/**
 * Both chart axes grouped together.
 *
 * @example
 * ```ts
 * const axis: AxisConfig = {
 *   axisX: { height: 30, backgroundColor: "#0b1220", borderColor: "#1f2937", borderWidth: 1, textColor: "#cbd5e1", font: "12px Arial", textAlign: "center", tickColor: "#334155", tickWidth: 1, tickLength: 4, labelOffsetY: 16, minLabelGap: 16, crosshairLabel: { backgroundColor: "#111827", borderColor: "#111827", borderWidth: 1, textColor: "#ffffff", font: "12px Arial", paddingX: 8, height: 26 } },
 *   axisY: { width: 80, backgroundColor: "#0b1220", borderColor: "#1f2937", borderWidth: 1, textColor: "#cbd5e1", font: "12px Arial", textAlign: "left", tickCount: 12, tickColor: "#334155", tickWidth: 1, tickLength: 4, tickGap: 64, labelOffsetX: 8, crosshairLabel: { backgroundColor: "#111827", borderColor: "#111827", borderWidth: 1, textColor: "#ffffff", font: "12px Arial", paddingX: 8, height: 20 } },
 * };
 * ```
 */
export type AxisConfig = {
	axisX: AxisXConfig;
	axisY: AxisYConfig;
};

/**
 * Line style for previous-day high/low overlays.
 *
 * @example
 * ```ts
 * const line: PreviousDayHighLowLineConfig = {
 *   color: "#94a3b8",
 *   width: 1,
 *   opacity: 0.8,
 *   dash: [4, 4],
 * };
 * ```
 */
export type PreviousDayHighLowLineConfig = {
	color: string;
	width: number;
	opacity: number;
	dash: number[];
};

/**
 * Text style for previous-day high/low labels.
 *
 * @example
 * ```ts
 * const text: PreviousDayHighLowTextConfig = {
 *   color: "#e2e8f0",
 *   font: "12px Arial",
 *   paddingX: 8,
 * };
 * ```
 */
export type PreviousDayHighLowTextConfig = {
	color: string;
	font: string;
	paddingX: number;
};

/**
 * Previous day high/low annotation styling.
 *
 * @example
 * ```ts
 * const previousDayHighLow: PreviousDayHighLowConfig = {
 *   line: { color: "#94a3b8", width: 1, opacity: 0.8, dash: [4, 4] },
 *   text: { color: "#e2e8f0", font: "12px Arial", paddingX: 8 },
 * };
 * ```
 */
export type PreviousDayHighLowConfig = {
	line: PreviousDayHighLowLineConfig;
	text: PreviousDayHighLowTextConfig;
};

/**
 * Full public chart configuration.
 *
 * Consumers usually pass `DeepPartial<ChartConfig>` to the `config` prop so
 * they can override only a few values.
 *
 * @example
 * ```ts
 * const config: ChartConfig = {
 *   zoom: { x: { speed: 0.05, min: 0.03, max: 20 }, y: { speed: 0.1, min: 10, max: 500 } },
 *   candles: { defaultWidth: 8, defaultGap: 2, minBodyHeight: 1, autoFollowLatestCandle: true, autoFollowThresholdCandles: 10, rightOffsetCandles: 15, liveBidPriceLine: { visible: true, width: 1, opacity: 0.7, dash: [4, 4], bullishColor: "#22c55e", bearishColor: "#ef4444" }, liveAskPriceLine: { visible: true, width: 1, opacity: 0.7, dash: [4, 6], bullishColor: "#a855f7", bearishColor: "#a855f7" } },
 *   volume: { visible: true, bullishColor: "#22c55e", bearishColor: "#ef4444", opacity: 0.35, height: 200, bottomOffset: 0, minBarHeight: 1 },
 *   crosshair: { color: "rgba(255,255,255,0.35)", thickness: 1, style: "dashed" },
 *   tradeHandles: {} as TradeHandlesConfig,
 *   closedTradeIndicators: { visible: true, arrow: { visible: true, width: 60, height: 30, headHeightRatio: 0.45, shaftWidthRatio: 6, buyColor: "#22c55e", sellColor: "#ef4444", buyBorderColor: "#ffffff", sellBorderColor: "#ffffff", borderWidth: 1, opacity: 1 }, connectorLine: { width: 1, color: "#ffffff", opacity: 0.65, style: "dotted", dash: [2, 4] } },
 *   colors: { bullish: "#22c55e", bearish: "#ef4444", background: "#0b1220" },
 *   axis: { axisX: { height: 30, backgroundColor: "#0b1220", borderColor: "#1f2937", borderWidth: 1, textColor: "#cbd5e1", font: "12px Arial", textAlign: "center", tickColor: "#334155", tickWidth: 1, tickLength: 4, labelOffsetY: 16, minLabelGap: 16, crosshairLabel: { backgroundColor: "#111827", borderColor: "#111827", borderWidth: 1, textColor: "#ffffff", font: "12px Arial", paddingX: 8, height: 26 } }, axisY: { width: 80, backgroundColor: "#0b1220", borderColor: "#1f2937", borderWidth: 1, textColor: "#cbd5e1", font: "12px Arial", textAlign: "left", tickCount: 12, tickColor: "#334155", tickWidth: 1, tickLength: 4, tickGap: 64, labelOffsetX: 8, crosshairLabel: { backgroundColor: "#111827", borderColor: "#111827", borderWidth: 1, textColor: "#ffffff", font: "12px Arial", paddingX: 8, height: 20 } } },
 *   shapes: { trendline: { lineColor: "#22c55e" } },
 * };
 * ```
 */
export type ChartConfig = {
	zoom: ZoomConfig;
	candles: CandlesConfig;
	volume: VolumeConfig;
	crosshair: CrosshairConfig;
	tradeHandles: TradeHandlesConfig;
	closedTradeIndicators: ClosedTradeIndicatorsConfig;
	colors: ColorsConfig;
	axis: AxisConfig;
	shapes: PartialShapeConfig;
};
