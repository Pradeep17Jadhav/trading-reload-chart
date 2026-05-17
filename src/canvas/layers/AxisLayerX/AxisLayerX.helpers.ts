import type { Candle } from "../../../models/Candle.types";

/**
 * Nice tick intervals in milliseconds.
 * Only these values are ever used as label spacing on the X axis.
 */
const NICE_INTERVALS_MS = [
	5 * 60 * 1000, // 5 min
	15 * 60 * 1000, // 15 min
	30 * 60 * 1000, // 30 min
	60 * 60 * 1000, // 1 h
	90 * 60 * 1000, // 1.5 h
	3 * 60 * 60 * 1000, // 3 h
	6 * 60 * 60 * 1000, // 6 h
	12 * 60 * 60 * 1000, // 12 h
	24 * 60 * 60 * 1000, // 24 h
];

/**
 * Detect candle timeframe from the data.
 * Uses median of the first few inter-candle gaps to be robust against gaps.
 */
export const detectCandleTimeframeMs = (candles: Candle[]): number => {
	if (candles.length < 2) return 15 * 60 * 1000;

	const diffs: number[] = [];

	for (let i = 1; i < Math.min(candles.length, 10); i++) {
		diffs.push(candles[i].time - candles[i - 1].time);
	}

	diffs.sort((a, b) => a - b);

	return diffs[Math.floor(diffs.length / 2)];
};

/**
 * Pick the smallest nice interval (in ms) that keeps labels from overlapping.
 */
export const getXAxisNiceIntervalMs = ({
	candleSpacing,
	candleTimeframeMs,
	labelWidth,
	minLabelGap,
}: {
	candleSpacing: number;
	candleTimeframeMs: number;
	labelWidth: number;
	minLabelGap: number;
}): number => {
	if (candleSpacing <= 0 || candleTimeframeMs <= 0) return NICE_INTERVALS_MS[0];

	const minPixelsNeeded = labelWidth + minLabelGap;

	for (const intervalMs of NICE_INTERVALS_MS) {
		const candlesPerInterval = intervalMs / candleTimeframeMs;
		const pixelsPerInterval = candlesPerInterval * candleSpacing;

		if (pixelsPerInterval >= minPixelsNeeded) {
			return intervalMs;
		}
	}

	// Zoomed out further than 24 h per label — use multiples of 24 h
	const msPerDay = 24 * 60 * 60 * 1000;
	const candlesPerDay = msPerDay / candleTimeframeMs;
	const pixelsPerDay = candlesPerDay * candleSpacing;
	const multiplier = Math.ceil(minPixelsNeeded / pixelsPerDay);

	return msPerDay * multiplier;
};

/**
 * Returns true when a timestamp is aligned to the given interval boundary
 * using local (browser) time values, so labels display at round local times.
 */
export const isAlignedToInterval = (timestamp: number, intervalMs: number): boolean => {
	const date = new Date(timestamp);
	const msFromLocalMidnight =
		(date.getHours() * 60 + date.getMinutes()) * 60 * 1000 + date.getSeconds() * 1000 + date.getMilliseconds();

	if (intervalMs >= 24 * 60 * 60 * 1000) {
		return msFromLocalMidnight === 0;
	}

	return msFromLocalMidnight % intervalMs === 0;
};

/**
 * Format a timestamp for the X axis.
 * At midnight (00:00 local) shows the day-of-month number (e.g. "15")
 * so the viewer knows a new day started.
 * All other times show HH:MM.
 */
export const formatXAxisLabel = (timestamp: number): string => {
	const date = new Date(timestamp);
	const hours = date.getHours();
	const minutes = date.getMinutes();

	if (hours === 0 && minutes === 0) {
		return String(date.getDate());
	}

	return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

/**
 * Full date + time format for the crosshair tooltip.
 * Example: "Wed 15 May 10.35"
 */
export const formatTimeDayDateHHMM = (timestamp: number): string => {
	const date = new Date(timestamp);
	const day = date.toLocaleDateString("en-US", {
		weekday: "short",
	});
	const month = date.toLocaleDateString("en-US", {
		month: "short",
	});
	const dayOfMonth = date.getDate();
	const hours = date.getHours().toString().padStart(2, "0");
	const minutes = date.getMinutes().toString().padStart(2, "0");

	return `${day} ${dayOfMonth} ${month} ${hours}.${minutes}`;
};
