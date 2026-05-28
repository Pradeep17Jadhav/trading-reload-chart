import type {
	MissingTradeProtectionHandleRectConfig,
	PastTradeIndicatorArrowConfig,
	TemporaryTradeProtectionHandleRectConfig,
	TradeHandleLineConfig,
	TradeHandleRectConfig,
	TradeHandleStyleConfig,
} from "../../../config/chartConfig.types";
import type { ChartViewport } from "../../../models/ChartViewport.types";
import type { ClosedTrade, OpenTrade, TradeDirection } from "../../../models/Trade.types";

/**
 * Type of existing trade handle shown on open positions.
 *
 * @example `"stopLoss"`
 */
export type TradeHandleType = "startPrice" | "stopLoss" | "takeProfit";

/**
 * Type of protection handle used when a trade is missing SL or TP.
 *
 * @example `"takeProfit"`
 */
export type TradeProtectionHandleType = "stopLoss" | "takeProfit";

export type TradeHitboxKind = "existingHandle" | "missingProtectionHandle";

export type TradeHandleArea = {
	x: number;
	y: number;
	width: number;
	height: number;
};

type BaseTradeHandleHitbox = {
	x: number;
	y: number;
	width: number;
	height: number;
	trade: OpenTrade;
	type: TradeHandleType;
	price: number;
	viewport: ChartViewport;
	kind?: TradeHitboxKind;
};

export type ExistingTradeHandleHitbox = BaseTradeHandleHitbox & {
	kind?: "existingHandle";

	labelArea: TradeHandleArea;

	closeButtonArea: TradeHandleArea;
};

export type MissingTradeProtectionHandleHitbox = BaseTradeHandleHitbox & {
	kind: "missingProtectionHandle";
	type: TradeProtectionHandleType;

	labelArea: TradeHandleArea;

	closeButtonArea: TradeHandleArea;
};

export type TradeHandleHitbox = ExistingTradeHandleHitbox | MissingTradeProtectionHandleHitbox;

export type TemporaryTradeProtectionDrag = {
	visible: boolean;
	trade: OpenTrade;
	type: TradeProtectionHandleType;
	price: number;
	viewport: ChartViewport;
};

export type TradeLayerEventsOptions = {
	canvas: HTMLCanvasElement;
	getHandleHitboxes: () => TradeHandleHitbox[];
	/**
	 * Returns the current market price (latest candle close / live candle close).
	 * Used to enforce TP/SL constraints during drag.
	 */
	getCurrentPrice?: () => number;
	onDrag?: (payload: { trade: OpenTrade; type: TradeHandleType; price: number }) => void;
	onMissingProtectionDrag?: (payload: { trade: OpenTrade; type: TradeProtectionHandleType; price: number }) => void;
	onMissingProtectionDragEnd?: (payload: { trade: OpenTrade; type: TradeProtectionHandleType; price: number }) => void;
	onMissingProtectionDragCancel?: () => void;
	onTradeModified?: (payload: { ticket: number; tp?: number | null; sl?: number | null }) => void;
	onTradeCloseClicked?: (payload: { ticket: number; volume?: number }) => void;
};

export type TradeLayerOptions = {
	canvas: HTMLCanvasElement;
};

export type TradeHandleRenderState = {
	price: number;
	type: TradeHandleType;
	trade: OpenTrade;
	viewport: ChartViewport;
	y: number;
	handleStyleConfig: TradeHandleStyleConfig;
	handleConfig: TradeHandleRectConfig;
	lineConfig: TradeHandleLineConfig;
	handleX: number;
	handleY: number;
	handleWidth: number;
	handleHeight: number;
};

export type MissingProtectionHandleRenderState = {
	price: number;
	type: TradeProtectionHandleType;
	trade: OpenTrade;
	viewport: ChartViewport;
	y: number;
	config: MissingTradeProtectionHandleRectConfig;
	handleX: number;
	handleY: number;
	handleWidth: number;
	handleHeight: number;
};

export type TemporaryProtectionRenderState = {
	price: number;
	type: TradeProtectionHandleType;
	trade: OpenTrade;
	viewport: ChartViewport;
	y: number;
	handleConfig: TemporaryTradeProtectionHandleRectConfig;
	lineConfig: TradeHandleLineConfig;
	handleX: number;
	handleY: number;
	handleWidth: number;
	handleHeight: number;
};

export type PastTradeIndicatorPoint = {
	x: number;
	y: number;
	price: number;
	time: number;
};

export type PastTradeIndicatorRenderState = {
	trade: ClosedTrade;
	start: PastTradeIndicatorPoint;
	close: PastTradeIndicatorPoint;
	arrowWidth: number;
	arrowHeight: number;
};

export type DrawTradeHandleOptions = {
	price: number;
	type: TradeHandleType;
	trade: OpenTrade;
};

export type CreateHitBoxOptions = {
	price: number;
	trade: OpenTrade;
	type: TradeHandleType;
	x: number;
	y: number;
	width: number;
	height: number;
	viewport: ChartViewport;
};

export type CreateMissingProtectionHitBoxOptions = {
	price: number;
	trade: OpenTrade;
	type: TradeProtectionHandleType;
	x: number;
	y: number;
	width: number;
	height: number;
	viewport: ChartViewport;
};

export type DrawHandleLineOptions = {
	x1: number;
	x2: number;
	y: number;
	config: TradeHandleLineConfig;
};

export type DrawConnectorLineOptions = {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	config: TradeHandleLineConfig;
};

export type DrawHandleRectOptions = {
	x: number;
	y: number;
	width: number;
	config: TradeHandleRectConfig;
};

export type DrawMissingProtectionHandleRectOptions = {
	x: number;
	y: number;
	width: number;
	config: MissingTradeProtectionHandleRectConfig;
};

export type DrawTemporaryProtectionHandleRectOptions = {
	x: number;
	y: number;
	width: number;
	config: TemporaryTradeProtectionHandleRectConfig;
};

export type DrawHandleSectionsOptions = {
	handleType: TradeHandleType;
	handleX: number;
	handleY: number;
	handleWidth: number;
	handleHeight: number;
	handleConfig: TradeHandleRectConfig;
	trade: OpenTrade;
	y: number;
};

export type DrawPastTradeArrowOptions = {
	x: number;
	y: number;
	type: TradeDirection;
	width: number;
	height: number;
	config: PastTradeIndicatorArrowConfig;
};

export type HandleSection = {
	label: string;
	width: number;
	visible: boolean;
	color?: string;
};

export type LineBlockedRange = {
	x1: number;
	x2: number;
};
