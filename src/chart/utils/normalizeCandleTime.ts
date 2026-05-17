import type { Candle } from "../../models/Candle.types";

export const normalizeCandleTime = (candle: Candle, brokerTimezoneOffsetMs?: number): Candle => {
	if (brokerTimezoneOffsetMs === undefined || candle.time >= 1e12) {
		return candle;
	}

	return {
		...candle,
		time: candle.time * 1000 - brokerTimezoneOffsetMs,
	};
};
