export const normalizePrice = (price: number, precision = 5) => {
	return Number(price.toFixed(precision));
};
