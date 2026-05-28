/**
 * Single OHLCV candle used by the chart.
 *
 * @example
 * ```ts
 * const candle: Candle = {
 *   time: 1716883200000,
 *   open: 1.084,
 *   high: 1.086,
 *   low: 1.0835,
 *   close: 1.0852,
 *   volume: 1200,
 *   ask: 1.0853,
 *   isClosed: true,
 * };
 * ```
 */
export type Candle = {
	/**
	 * Unix timestamp in milliseconds.
	 *
	 * @example `1716883200000`
	 */
	time: number;

	/**
	 * Candle open price.
	 *
	 * @example `1.084`
	 */
	open: number;

	/**
	 * Candle high price.
	 *
	 * @example `1.086`
	 */
	high: number;

	/**
	 * Candle low price.
	 *
	 * @example `1.0835`
	 */
	low: number;

	/**
	 * Candle close price.
	 *
	 * @example `1.0852`
	 */
	close: number;

	/**
	 * Tick or broker volume.
	 *
	 * @example `1200`
	 */
	volume: number;

	/**
	 * Current ask price during this candle.
	 *
	 * @example `1.0853`
	 */
	ask: number;

	/**
	 * `false` while the realtime candle is still forming.
	 *
	 * @example `true`
	 */
	isClosed: boolean;
};
