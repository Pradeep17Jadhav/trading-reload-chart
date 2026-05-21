export type Candle = {
	/**
	 * Unix timestamp in milliseconds
	 */
	time: number;

	/**
	 * OHLC prices
	 */
	open: number;
	high: number;
	low: number;
	close: number;

	/**
	 * Tick or broker volume
	 */
	volume: number;

	/**
	 * Current ask price during this candle
	 */
	ask: number;

	/**
	 * False while realtime candle is forming
	 */
	isClosed: boolean;
};
