import type { TradeType } from "../src/models/Trade.types";

export type TradeHistoryApiItem = {
	commission: number;
	endPrice: number;
	endTime: number;
	pnl: number;
	sl: number | null;
	startPrice: number;
	startTime: number;
	swap: number;
	symbol: string;
	tp: number | null;
	type: TradeType;
	volume: number;
};

export type TradeHistoryApiResponse = {
	count: number;
	history: TradeHistoryApiItem[];
};

export type TradeModifyRequest = {
	ticket: number;
	sl?: number | null;
	tp?: number | null;
};
