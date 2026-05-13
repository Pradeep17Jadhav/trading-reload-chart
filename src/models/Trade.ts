//models/Trade.ts
export type TradeType = "buy" | "sell";
type TradeStatus = "open" | "closed";

export type BaseTrade = {
	ticket: number;
	symbol: string;
	volume: number;
	sl: number | null;
	tp: number | null;
	type: TradeType;
	openTime: number;
	openPrice: number;
	commission: number;
	swap: number;
	pnl: number;
};

export type OpenTrade = BaseTrade & {
	status: "open";
};
export type ClosedTrade = BaseTrade & {
	closePrice: number;
	closeTime: number;
	status: "closed";
};
