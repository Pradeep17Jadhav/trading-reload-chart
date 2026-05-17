import { COMMODITY_PAIRS, CRYPTO_PAIRS, JPY_PAIRS } from "../../../config/pairs";
import type { TradeType } from "../../../models/Trade.types";

export const getPipSize = (symbol: string): number => {
	if (JPY_PAIRS.some((p) => symbol.includes(p.slice(3)))) return 0.01;
	if (CRYPTO_PAIRS.includes(symbol)) return 1;
	if (COMMODITY_PAIRS.includes(symbol)) return 0.01;
	return 0.0001;
};

const getApproxPipValue = (symbol: string, volume: number): number => {
	if (JPY_PAIRS.includes(symbol)) return volume * 6.33806;
	if (CRYPTO_PAIRS.includes(symbol)) return volume * 1;
	if (COMMODITY_PAIRS.includes(symbol)) return volume * 10;
	return volume * 10;
};

export const calculatePotentialPnlUsd = (
	type: TradeType,
	entryPrice: number,
	targetPrice: number,
	volume: number,
	symbol: string,
): number => {
	const normalizedSymbol = symbol.split(".")[0];
	const pipSize = getPipSize(normalizedSymbol);
	const pipValue = getApproxPipValue(normalizedSymbol, volume);
	const priceDiff = type === "buy" ? targetPrice - entryPrice : entryPrice - targetPrice;
	return (priceDiff / pipSize) * pipValue;
};
