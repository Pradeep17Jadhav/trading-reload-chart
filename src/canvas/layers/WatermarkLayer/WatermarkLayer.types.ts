import type { WatermarkConfig } from "../../../config/chartConfig.types";

/**
 * Constructor options for {@link WatermarkLayer}.
 *
 * @example
 * ```ts
 * const layer = new WatermarkLayer({
 *   canvas,
 *   config: { ...CHART_CONFIG.watermark, text: "USDJPY, 15m" },
 * });
 * ```
 */
export type WatermarkLayerOptions = {
	/** Canvas the watermark is painted on. */
	canvas: HTMLCanvasElement;

	/** Resolved watermark configuration. */
	config: WatermarkConfig;
};

/**
 * Text anchor resolved from a {@link WatermarkPosition} and the plot size.
 *
 * All values are in CSS pixels.
 *
 * @example
 * ```ts
 * const placement: WatermarkTextPlacement = {
 * 	x: 400,
 * 	y: 16,
 * 	textAlign: "center",
 * 	textBaseline: "top",
 * };
 * ```
 */
export type WatermarkTextPlacement = {
	/** Horizontal anchor point. */
	x: number;

	/** Vertical anchor point. */
	y: number;

	/** Canvas text alignment applied before measuring. */
	textAlign: CanvasTextAlign;

	/** Canvas text baseline applied before measuring. */
	textBaseline: CanvasTextBaseline;
};

/**
 * Inputs used to resolve the watermark text anchor.
 *
 * @example
 * ```ts
 * const placement = resolveWatermarkTextPlacement({
 *   position: "top-center",
 *   width: 800,
 *   height: 600,
 *   padding: 16,
 * });
 * ```
 */
export type ResolveWatermarkTextPlacementOptions = {
	/** Configured watermark position. */
	position: WatermarkConfig["position"];

	/** Plot width in CSS pixels. */
	width: number;

	/** Plot height in CSS pixels. */
	height: number;

	/** Padding between the watermark and the plot edge. */
	padding: number;
};
