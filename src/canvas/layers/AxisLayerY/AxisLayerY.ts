//AxisLayerY.ts

import { CHART_CONFIG } from "../../../config/chartConfig";
import { normalizePrice } from "../../../helpers/math";
import type { ChartViewport } from "../../../models/ChartViewport";
import { priceToY } from "../helpers/LayerHelpers";
import { getPriceStep } from "./AxisLayerY.helpers";

type AxisLayerYOptions = {
	canvas: HTMLCanvasElement;
};

type AxisLayerYCrosshair = {
	visible: boolean;
	y: number;
	price: number;
};

export class AxisLayerY {
	readonly #canvas: HTMLCanvasElement;
	readonly #ctx: CanvasRenderingContext2D;

	viewport: ChartViewport | null = null;
	crosshair: AxisLayerYCrosshair = {
		visible: false,
		y: 0,
		price: 0,
	};

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

	setCrosshair(crosshair: AxisLayerYCrosshair) {
		this.crosshair = crosshair;
	}

	hideCrosshair() {
		this.crosshair.visible = false;
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

			ctx.fillStyle = axisYConfig.textColor;
			ctx.fillText(normalizePrice(price).toFixed(5), axisYConfig.labelOffsetX, y);
		}

		ctx.restore();

		this.drawCrosshairPriceLabel();
	}

	drawCrosshairPriceLabel() {
		if (!this.crosshair.visible) {
			return;
		}

		const ctx = this.#ctx;
		const canvasWidth = this.#canvas.width;
		const canvasHeight = this.#canvas.height;
		const labelConfig = CHART_CONFIG.axis.axisY.crosshairLabel;
		const label = normalizePrice(this.crosshair.price).toFixed(5);
		const rectHeight = labelConfig.height;
		const rectY = Math.max(0, Math.min(canvasHeight - rectHeight, this.crosshair.y - rectHeight / 2));

		ctx.save();

		ctx.fillStyle = labelConfig.backgroundColor;
		ctx.fillRect(0, rectY, canvasWidth, rectHeight);

		ctx.strokeStyle = labelConfig.borderColor;
		ctx.lineWidth = labelConfig.borderWidth;
		ctx.strokeRect(0, rectY, canvasWidth, rectHeight);

		ctx.font = labelConfig.font;
		ctx.fillStyle = labelConfig.textColor;
		ctx.textAlign = "left";
		ctx.textBaseline = "middle";
		ctx.fillText(label, labelConfig.paddingX, rectY + rectHeight / 2);

		ctx.restore();
	}
}
