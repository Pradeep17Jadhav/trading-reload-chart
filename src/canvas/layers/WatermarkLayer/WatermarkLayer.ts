import type { WatermarkConfig } from "../../../config/chartConfig.types";
import { clampWatermarkOpacity, resolveWatermarkTextPlacement } from "./WatermarkLayer.helpers";
import type { WatermarkLayerOptions } from "./WatermarkLayer.types";

/**
 * Text watermark drawn on its own canvas beneath the candlestick and
 * interaction layers, so it never intercepts pointer events and is always
 * painted over by candles, shapes, trades, and the crosshair.
 *
 * @example
 * ```ts
 * const layer = new WatermarkLayer({
 *   canvas,
 *   config: { ...CHART_CONFIG.watermark, text: "USDJPY, 15m" },
 * });
 * layer.resize(800, 600);
 * layer.render();
 * ```
 */
export class WatermarkLayer {
	readonly #canvas: HTMLCanvasElement;

	readonly #ctx: CanvasRenderingContext2D;

	#config: WatermarkConfig;

	/** Plot size in CSS pixels, used to resolve the text anchor. */
	#width = 0;

	#height = 0;

	constructor(options: WatermarkLayerOptions) {
		this.#canvas = options.canvas;
		this.#config = options.config;

		const ctx = this.#canvas.getContext("2d");

		if (!ctx) {
			throw new Error("Canvas 2D context not supported");
		}

		this.#ctx = ctx;
	}

	setConfig(config: WatermarkConfig) {
		this.#config = config;
	}

	/**
	 * Resizes the canvas and stores the plot size used for placement.
	 *
	 * @example
	 * ```ts
	 * layer.resize(800, 600);
	 * ```
	 */
	resize(width: number, height: number) {
		this.#width = width;
		this.#height = height;
	}

	/**
	 * Clears the canvas and paints the watermark when it has text.
	 *
	 * @example
	 * ```ts
	 * layer.render();
	 * ```
	 */
	render() {
		const ctx = this.#ctx;
		const { text } = this.#config;

		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);

		if (!text || this.#width <= 0 || this.#height <= 0) {
			return;
		}

		const { x, y, textAlign, textBaseline } = resolveWatermarkTextPlacement({
			position: this.#config.position,
			width: this.#width,
			height: this.#height,
			padding: this.#config.padding,
		});

		ctx.save();

		ctx.font = this.#getFont();
		ctx.textAlign = textAlign;
		ctx.textBaseline = textBaseline;
		ctx.fillStyle = this.#config.color;
		ctx.globalAlpha = clampWatermarkOpacity(this.#config.opacity);
		ctx.fillText(text, x, y);

		ctx.restore();
	}

	#getFont() {
		const { fontSize, fontWeight, fontFamily } = this.#config;
		return `${fontWeight} ${fontSize}px ${fontFamily}`;
	}
}
