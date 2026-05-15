/**
 * Converts a market price value
 * into canvas Y coordinate.
 *
 * Shared helper used by multiple layers
 * such as:
 *
 * - ExistingCandlesLayer
 * - TradeLayer
 * - AxisLayerY
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

/**
 * Converts a canvas Y coordinate
 * into a market price value.
 *
 * Used by the crosshair labels.
 */
export const yToPrice = ({
	y,
	minPrice,
	priceRange,
	chartHeight,
}: {
	y: number;
	minPrice: number;
	priceRange: number;
	chartHeight: number;
}) => {
	const normalizedY = 1 - y / chartHeight;

	return minPrice + normalizedY * priceRange;
};
