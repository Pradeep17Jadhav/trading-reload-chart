// AxisLayerY.ts

import { CHART_CONFIG } from "../../../config/chartConfig";
import { normalizePrice } from "../../../helpers/math";
import type { ChartViewport } from "../../../models/ChartViewport.types";
import { priceToY } from "../helpers/LayerHelpers";
import { getPriceStep } from "./AxisLayerY.helpers";
import type { AxisLayerYCrosshair, AxisLayerYOptions } from "./AxisLayerY.types";

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
		this.clearCanvas();
		this.drawBackground();
		this.drawLeftBorder();
		this.drawPriceLabels();
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
		const rectY = this.getCrosshairLabelY(rectHeight, canvasHeight);

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

	private clearCanvas() {
		this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
	}

	private drawBackground() {
		const ctx = this.#ctx;
		const axisYConfig = CHART_CONFIG.axis.axisY;

		ctx.save();
		ctx.fillStyle = axisYConfig.backgroundColor;
		ctx.fillRect(0, 0, this.#canvas.width, this.#canvas.height);
		ctx.restore();
	}

	private drawLeftBorder() {
		const ctx = this.#ctx;
		const axisYConfig = CHART_CONFIG.axis.axisY;

		ctx.save();
		ctx.strokeStyle = axisYConfig.borderColor;
		ctx.lineWidth = axisYConfig.borderWidth;
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(0, this.#canvas.height);
		ctx.stroke();
		ctx.restore();
	}

	private drawPriceLabels() {
		if (!this.viewport) {
			return;
		}

		const ctx = this.#ctx;
		const canvasHeight = this.#canvas.height;
		const axisYConfig = CHART_CONFIG.axis.axisY;
		const step = getPriceStep({
			priceRange: this.viewport.priceRange,
			canvasHeight,
		});

		ctx.save();
		ctx.font = axisYConfig.font;
		ctx.fillStyle = axisYConfig.textColor;
		ctx.textAlign = axisYConfig.textAlign;
		ctx.textBaseline = "middle";

		const { startPrice, endPrice } = this.getVisiblePriceRange(step);

		for (let price = startPrice; price <= endPrice; price += step) {
			const y = this.getPriceY(price, canvasHeight);

			if (this.isPriceOutsideCanvas(y, canvasHeight)) {
				continue;
			}

			this.drawTick(y);
			this.drawPriceLabel(price, y);
		}

		ctx.restore();
	}

	private getVisiblePriceRange(step: number) {
		if (!this.viewport) {
			return {
				startPrice: 0,
				endPrice: -1,
			};
		}

		return {
			startPrice: Math.floor(this.viewport.minPrice / step) * step,
			endPrice: this.viewport.maxPrice + step,
		};
	}

	private getPriceY(price: number, canvasHeight: number) {
		if (!this.viewport) {
			return 0;
		}

		return priceToY({
			price,
			minPrice: this.viewport.minPrice,
			priceRange: this.viewport.priceRange,
			chartHeight: canvasHeight,
		});
	}

	private isPriceOutsideCanvas(y: number, canvasHeight: number) {
		return y < 0 || y > canvasHeight;
	}

	private drawTick(y: number) {
		const ctx = this.#ctx;
		const axisYConfig = CHART_CONFIG.axis.axisY;

		ctx.strokeStyle = axisYConfig.tickColor;
		ctx.lineWidth = axisYConfig.tickWidth;

		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(axisYConfig.tickLength, y);
		ctx.stroke();
	}

	private drawPriceLabel(price: number, y: number) {
		const ctx = this.#ctx;
		const axisYConfig = CHART_CONFIG.axis.axisY;

		ctx.fillStyle = axisYConfig.textColor;
		ctx.fillText(normalizePrice(price).toFixed(5), axisYConfig.labelOffsetX, y);
	}

	private getCrosshairLabelY(rectHeight: number, canvasHeight: number) {
		return Math.max(0, Math.min(canvasHeight - rectHeight, this.crosshair.y - rectHeight / 2));
	}
}
