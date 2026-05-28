/**
 * Internal viewport snapshot describing the current price and horizontal view.
 *
 * This type is exported for advanced integrations that need to align custom
 * overlays with the chart.
 *
 * @example
 * ```ts
 * const viewport: ChartViewport = {
 *   minPrice: 1.082,
 *   maxPrice: 1.092,
 *   priceRange: 0.01,
 *   offsetX: 120,
 *   zoomX: 1.4,
 *   candleWidth: 10,
 *   candleGap: 2,
 *   candleSpacing: 12,
 * };
 * ```
 */
export type ChartViewport = {
	minPrice: number;
	maxPrice: number;
	priceRange: number;
	offsetX: number;
	zoomX: number;
	candleWidth: number;
	candleGap: number;
	candleSpacing: number;
};
