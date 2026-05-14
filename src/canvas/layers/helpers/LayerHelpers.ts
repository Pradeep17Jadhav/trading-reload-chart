/**
 * Converts a market price value
 * into canvas Y coordinate.
 *
 * Shared helper used by multiple layers
 * such as:
 *
 * - ExistingCandlesLayer
 * - TradeLayer
 * - Future drawing layers
 *
 * @example
 * const y = priceToY({
 *   price: 114.25,
 *   minPrice: 113.80,
 *   priceRange: 1.2,
 *   chartHeight: 900,
 * });
 */
export const priceToY = ({
	price,
	minPrice,
	priceRange,
	chartHeight,
}: {
	price: number;
	minPrice: number;
	priceRange: number;
	chartHeight: number;
}) => {
	const normalizedPrice = (price - minPrice) / priceRange;

	return chartHeight - normalizedPrice * chartHeight;
};
