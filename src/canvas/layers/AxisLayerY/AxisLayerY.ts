//AxisLayerY.ts

import { CHART_CONFIG } from "../../../config/chartConfig";
import { normalizePrice } from "../../../helpers/math";
import type { ChartViewport } from "../../../models/ChartViewport";
import { priceToY } from "../helpers/LayerHelpers";
import { getPriceStep } from "./AxisLayerY.helpers";

type AxisLayerYOptions = {
	canvas: HTMLCanvasElement;
};

export class AxisLayerY {
	readonly #canvas: HTMLCanvasElement;

	readonly #ctx: CanvasRenderingContext2D;

	viewport: ChartViewport | null = null;

	constructor(options: AxisLayerYOptions) {
		this.#canvas = options.canvas;

		const ctx = this.#canvas.getContext("2d");

		if (!ctx) {
			throw new Error("Canvas 2D context not supported");
		}

		this.#ctx = ctx;
	}

	setViewport(viewport: ChartViewport) {
		this.viewport = viewport;
	}

	render() {
		if (!this.viewport) {
			return;
		}

		const ctx = this.#ctx;

		const canvasWidth = this.#canvas.width;

		const canvasHeight = this.#canvas.height;

		const axisYConfig = CHART_CONFIG.axis.axisY;

		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		/**
		 * =========================
		 * Background
		 * =========================
		 */
		ctx.save();

		ctx.fillStyle = axisYConfig.backgroundColor;

		ctx.fillRect(0, 0, canvasWidth, canvasHeight);

		ctx.restore();

		/**
		 * =========================
		 * Border Left
		 * =========================
		 */
		ctx.save();

		ctx.strokeStyle = axisYConfig.borderColor;

		ctx.lineWidth = axisYConfig.borderWidth;

		ctx.beginPath();

		ctx.moveTo(0, 0);

		ctx.lineTo(0, canvasHeight);

		ctx.stroke();

		ctx.restore();

		/**
		 * =========================
		 * Price Labels
		 * =========================
		 */

		ctx.save();

		ctx.font = axisYConfig.font;

		ctx.fillStyle = axisYConfig.textColor;

		ctx.textAlign = axisYConfig.textAlign;

		ctx.textBaseline = "middle";

		const step = getPriceStep({
			priceRange: this.viewport.priceRange,
			canvasHeight,
		});

		const startPrice = Math.floor(this.viewport.minPrice / step) * step;

		const endPrice = this.viewport.maxPrice + step;

		for (let price = startPrice; price <= endPrice; price += step) {
			const y = priceToY({
				price,
				minPrice: this.viewport.minPrice,
				priceRange: this.viewport.priceRange,
				chartHeight: canvasHeight,
			});

			if (y < 0 || y > canvasHeight) {
				continue;
			}

			ctx.strokeStyle = axisYConfig.tickColor;

			ctx.lineWidth = axisYConfig.tickWidth;

			ctx.beginPath();

			ctx.moveTo(0, y);

			ctx.lineTo(axisYConfig.tickLength, y);

			ctx.stroke();

			/**
			 * Price Label
			 */
			ctx.fillText(normalizePrice(price).toFixed(5), axisYConfig.labelOffsetX, y);
		}

		ctx.restore();
	}
}
