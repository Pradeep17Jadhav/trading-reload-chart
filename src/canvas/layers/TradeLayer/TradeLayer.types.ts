import type { ChartViewport } from "../../../models/ChartViewport";
import type { OpenTrade } from "../../../models/Trade";

export type TradeHandleType = "startPrice" | "stopLoss" | "takeProfit";

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
