import type { WatermarkPosition } from "../../../config/chartConfig.types";
import type { ResolveWatermarkTextPlacementOptions, WatermarkTextPlacement } from "./WatermarkLayer.types";

const TEXT_ANCHORS: Record<WatermarkPosition, Omit<WatermarkTextPlacement, "x" | "y">> = {
	center: { textAlign: "center", textBaseline: "middle" },
	"top-center": { textAlign: "center", textBaseline: "top" },
	"bottom-center": { textAlign: "center", textBaseline: "bottom" },
	"left-center": { textAlign: "left", textBaseline: "middle" },
	"right-center": { textAlign: "right", textBaseline: "middle" },
};

const getHorizontalOffset = ({ position, width, padding }: ResolveWatermarkTextPlacementOptions) => {
	switch (position) {
		case "left-center":
			return padding;

		case "right-center":
			return width - padding;

		default:
			return width / 2;
	}
};

const getVerticalOffset = ({ position, height, padding }: ResolveWatermarkTextPlacementOptions) => {
	switch (position) {
		case "top-center":
			return padding;

		case "bottom-center":
			return height - padding;

		default:
			return height / 2;
	}
};

/**
 * Resolves the canvas text anchor for a watermark position.
 *
 * `textAlign` and `textBaseline` are returned alongside the coordinates so the
 * caller can apply them to the context before measuring or drawing the text.
 *
 * @example
 * ```ts
 * const { x, y, textAlign, textBaseline } = resolveWatermarkTextPlacement({
 *   position: "bottom-center",
 *   width: 800,
 *   height: 600,
 *   padding: 16,
 * });
 * ```
 */
export const resolveWatermarkTextPlacement = (
	options: ResolveWatermarkTextPlacementOptions,
): WatermarkTextPlacement => ({
	...TEXT_ANCHORS[options.position],
	x: getHorizontalOffset(options),
	y: getVerticalOffset(options),
});

/**
 * Clamps an opacity into the `0` - `1` range accepted by the canvas context.
 *
 * @example
 * ```ts
 * clampWatermarkOpacity(1.4); // 1
 * ```
 */
export const clampWatermarkOpacity = (opacity: number) =>
	Number.isFinite(opacity) ? Math.min(Math.max(opacity, 0), 1) : 1;
