export const getPriceStep = ({ priceRange, canvasHeight }: { priceRange: number; canvasHeight: number }) => {
	/**
	 * Desired vertical spacing
	 * between price labels.
	 */
	const targetPixelGap = 80;

	/**
	 * Approximate visible
	 * label count.
	 */
	const approximateLabelCount = canvasHeight / targetPixelGap;

	/**
	 * Raw logical step.
	 */
	const rawStep = priceRange / approximateLabelCount;

	/**
	 * Normalize to
	 * psychological values.
	 *
	 * Examples:
	 * 0.0037 -> 0.005
	 * 37 -> 50
	 * 438 -> 500
	 */
	const magnitude = 10 ** Math.floor(Math.log10(rawStep));

	const normalizedSteps = [1, 2, 5, 10];

	for (const normalizedStep of normalizedSteps) {
		const step = normalizedStep * magnitude;

		if (step >= rawStep) {
			return step;
		}
	}

	return 10 * magnitude;
};
