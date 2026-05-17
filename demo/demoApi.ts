import type { PastTradeIndicator } from "../src/canvas/layers/TradeLayer/TradeLayer.types";
import type { Candle } from "../src/models/Candle";
import type { OpenTrade, TradeType } from "../src/models/Trade";
import {
	DEMO_ACTIVE_SYMBOL,
	DEMO_BROKER_TIMEZONE_OFFSET_MS,
	DEMO_CANDLE_LIMIT,
	DEMO_TIMEFRAME,
} from "./demoDefaults";

export const API_BASE_URL = "https://api-tradingreload.pradeepjadhav.com";
export const WS_BASE_URL = "wss://api-tradingreload.pradeepjadhav.com";

export const normalizeCandleFromApi = (candle: Candle): Candle =>
	candle.time < 1e12
		? { ...candle, time: candle.time * 1000 - DEMO_BROKER_TIMEZONE_OFFSET_MS }
		: candle;

type TradeHistoryApiItem = {
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

type TradeHistoryApiResponse = {
	count: number;
	history: TradeHistoryApiItem[];
};

const normalizeSymbol = (symbol: string) => symbol.split(".")[0].toUpperCase();

const isTradeForActiveSymbol = (symbol: unknown) => {
	if (typeof symbol !== "string") {
		return false;
	}

	return normalizeSymbol(symbol) === normalizeSymbol(DEMO_ACTIVE_SYMBOL);
};

const getFiniteNumber = (value: unknown) => {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return null;
	}

	return value;
};

const normalizePastTradeIndicator = (trade: TradeHistoryApiItem): PastTradeIndicator | null => {
	const startTime = getFiniteNumber(trade.startTime);
	const closeTime = getFiniteNumber(trade.endTime);
	const openPrice = getFiniteNumber(trade.startPrice);
	const closePrice = getFiniteNumber(trade.endPrice);

	if (startTime === null || closeTime === null || openPrice === null || closePrice === null) {
		return null;
	}

	return {
		symbol: trade.symbol,
		type: trade.type,
		startTime,
		closeTime,
		openPrice,
		closePrice,
		volume: trade.volume,
		commission: trade.commission,
		swap: trade.swap,
		pnl: trade.pnl,
		sl: trade.sl,
		tp: trade.tp,
	};
};

export const fetchHistoricalCandles = async (): Promise<Candle[]> => {
	const response = await fetch(
		`${API_BASE_URL}/candles?symbol=${DEMO_ACTIVE_SYMBOL}&tf=${DEMO_TIMEFRAME}&limit=${DEMO_CANDLE_LIMIT}`,
	);

	if (!response.ok) {
		throw new Error(`Failed to fetch candles: ${response.status}`);
	}

	const data = await response.json();

	return ((data.candles ?? []) as Candle[]).map(normalizeCandleFromApi);
};

export const fetchPastTrades = async (): Promise<PastTradeIndicator[]> => {
	const response = await fetch(`${API_BASE_URL}/history`, {
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch trade history: ${response.status}`);
	}

	const data = (await response.json()) as TradeHistoryApiResponse;
	const history = Array.isArray(data.history) ? data.history : [];
	const activeSymbolHistory = history.filter((trade) => isTradeForActiveSymbol(trade.symbol));

	const pastTrades = activeSymbolHistory
		.map(normalizePastTradeIndicator)
		.filter((trade): trade is PastTradeIndicator => trade !== null);

	const invalidTradeCount = activeSymbolHistory.length - pastTrades.length;

	if (invalidTradeCount > 0) {
		console.warn(
			`Skipped ${invalidTradeCount} historical trade(s) because start/end time or open/close price was missing.`,
		);
	}

	return pastTrades;
};

export const subscribeOpenTrades = (onPositions: (positions: OpenTrade[]) => void) => {
	const socket = new WebSocket(`${WS_BASE_URL}/ws/positions`);

	socket.addEventListener("message", (event) => {
		try {
			const data = JSON.parse(event.data as string);

			if (!data.positions) {
				return;
			}

			onPositions((data.positions ?? []) as OpenTrade[]);
		} catch (error) {
			console.error("Failed to load open trades", error);
		}
	});

	return () => {
		socket.close();
	};
};

export const subscribeLiveCandles = (onCandle: (candle: Candle) => void) => {
	const socket = new WebSocket(`${WS_BASE_URL}/ws/candles?symbol=${DEMO_ACTIVE_SYMBOL}&tf=${DEMO_TIMEFRAME}`);

	socket.addEventListener("message", (event) => {
		try {
			const data = JSON.parse(event.data as string);

			if (!data.candle) {
				return;
			}

			onCandle(normalizeCandleFromApi(data.candle as Candle));
		} catch (error) {
			console.error("Failed to parse websocket candle", error);
		}
	});

	socket.addEventListener("error", (error) => {
		console.error("WebSocket error", error);
	});

	return () => {
		socket.close();
	};
};

export type TradeModifyRequest = {
	ticket: number;
	sl?: number | null;
	tp?: number | null;
};

export const modifyTrade = async (payload: TradeModifyRequest) => {
	const body = {
		ticket: payload.ticket,
		...(payload.tp !== undefined ? { tp: payload.tp } : {}),
		...(payload.sl !== undefined ? { sl: payload.sl } : {}),
	};

	const response = await fetch(`${API_BASE_URL}/trade/modify`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error(`Failed to modify the trade: ${response.status}`);
	}

	return {
		data: await response.json(),
		fallbackPayload: body,
	};
};

export const getModifiedTradeFromResponse = (data: unknown): Partial<OpenTrade> | null => {
	if (!data || typeof data !== "object") {
		return null;
	}

	const responseData = data as {
		ticket?: number;
		sl?: number | null;
		tp?: number | null;
		trade?: Partial<OpenTrade>;
		position?: Partial<OpenTrade>;
		order?: Partial<OpenTrade>;
	};

	if (responseData.ticket !== undefined) {
		return {
			ticket: responseData.ticket,
			...(responseData.sl !== undefined ? { sl: responseData.sl } : {}),
			...(responseData.tp !== undefined ? { tp: responseData.tp } : {}),
		};
	}

	return responseData.trade ?? responseData.position ?? responseData.order ?? null;
};
