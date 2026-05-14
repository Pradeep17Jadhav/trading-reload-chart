import type { ChartViewport } from "../../../models/ChartViewport";
import type { OpenTrade } from "../../../models/Trade";

export type TradeHandleType = "startPrice" | "stopLoss" | "takeProfit";

export type TradeHandleHitbox = {
	x: number;
	y: number;
	width: number;
	height: number;
	trade: OpenTrade;
	type: TradeHandleType;
	price: number;
	viewport: ChartViewport;

	labelArea: {
		x: number;
		y: number;
		width: number;
		height: number;
	};

	closeButtonArea: {
		x: number;
		y: number;
		width: number;
		height: number;
	};
};

export type TradeLayerEventsOptions = {
	canvas: HTMLCanvasElement;
	getHandleHitboxes: () => TradeHandleHitbox[];
	onDrag?: (payload: { trade: OpenTrade; type: TradeHandleType; price: number }) => void;
	onTradeModified?: (payload: { ticket: number; tp?: number | null; sl?: number | null }) => void;
	onTradeCloseClicked?: (payload: { ticket: number; volume?: number }) => void;
};

export type TradeLayerOptions = {
	canvas: HTMLCanvasElement;
};
