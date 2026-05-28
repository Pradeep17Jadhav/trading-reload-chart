/**
 * Recursive partial type used for config overrides.
 *
 * @example
 * ```ts
 * const config: DeepPartial<ChartConfig> = {
 *   colors: { background: "#0d1117" },
 *   candles: { defaultWidth: 10 },
 * };
 * ```
 */
export type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
