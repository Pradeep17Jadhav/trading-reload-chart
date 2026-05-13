import type { OpenTrade } from "../../../models/Trade";

export type TradeHandleType = "startPrice" | "stopLoss" | "takeProfit";

export type TradeHandleHitbox = {
	x: number;
	y: number;
	width: number;
	height: number;
	trade: OpenTrade;
	type: TradeHandleType;
};

export type TradeLayerEventsOptions = {
	canvas: HTMLCanvasElement;
	getHandleHitboxes: () => TradeHandleHitbox[];
};

export type TradeLayerOptions = {
	canvas: HTMLCanvasElement;
};
