/**
 * Visible candle index range for the current viewport.
 *
 * @example
 * ```ts
 * const range: VisibleRange = {
 *   startIndex: 120,
 *   endIndex: 240,
 * };
 * ```
 */
export type VisibleRange = {
	startIndex: number;
	endIndex: number;
};
