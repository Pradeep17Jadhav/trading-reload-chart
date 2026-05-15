//AxisLayerX.ts

import { CHART_CONFIG } from "../../../config/chartConfig";
import type { Candle } from "../../../models/Candle";
import type { ChartViewport } from "../../../models/ChartViewport";
import {
	detectCandleTimeframeMs,
	formatTimeHHMM,
	formatXAxisLabel,
	getXAxisNiceIntervalMs,
	isAlignedToInterval,
} from "./AxisLayerX.helpers";

type AxisLayerXOptions = {
	canvas: HTMLCanvasElement;
	candles: Candle[];
};

type AxisLayerXCrosshair = {
	visible: boolean;
	x: number;
	candle: Candle | null;
};

export class AxisLayerX {
	readonly #canvas: HTMLCanvasElement;
	readonly #ctx: CanvasRenderingContext2D;

	candles: Candle[];
	viewport: ChartViewport | null = null;
	crosshair: AxisLayerXCrosshair = {
		visible: false,
		x: 0,
		candle: null,
	};

	constructor(options: AxisLayerXOptions) {
		this.#canvas = options.canvas;
		this.candles = options.candles;

		const ctx = this.#canvas.getContext("2d");

		if (!ctx) {
			throw new Error("Canvas 2D context not supported");
		}

		this.#ctx = ctx;
	}

	setCandles(candles: Candle[]) {
		this.candles = candles;
	}

	setViewport(viewport: ChartViewport) {
		this.viewport = viewport;
	}

	setCrosshair(crosshair: AxisLayerXCrosshair) {
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
		const axisXConfig = CHART_CONFIG.axis.axisX;

		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		ctx.save();
		ctx.fillStyle = axisXConfig.backgroundColor;
		ctx.fillRect(0, 0, canvasWidth, canvasHeight);
		ctx.restore();

		ctx.save();
		ctx.strokeStyle = axisXConfig.borderColor;
		ctx.lineWidth = axisXConfig.borderWidth;
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(canvasWidth, 0);
		ctx.stroke();
		ctx.restore();

		if (this.candles.length === 0) {
			this.drawCrosshairTimeLabel();
			return;
		}

		ctx.save();
		ctx.font = axisXConfig.font;
		ctx.fillStyle = axisXConfig.textColor;
		ctx.textAlign = axisXConfig.textAlign;
		ctx.textBaseline = "middle";

		const sampleLabelWidth = ctx.measureText("00:00").width;
		const candleTimeframeMs = detectCandleTimeframeMs(this.candles);
		const niceIntervalMs = getXAxisNiceIntervalMs({
			candleSpacing: this.viewport.candleSpacing,
			candleTimeframeMs,
			labelWidth: sampleLabelWidth,
			minLabelGap: axisXConfig.minLabelGap,
		});

		const startIndex = Math.max(0, Math.floor(-this.viewport.offsetX / this.viewport.candleSpacing));
		// Include future candle slots beyond the last loaded candle
		const endIndex = Math.ceil((canvasWidth - this.viewport.offsetX) / this.viewport.candleSpacing);

		const lastCandle = this.candles[this.candles.length - 1];

		for (let candleIndex = startIndex; candleIndex <= endIndex; candleIndex += 1) {
			let slotTime: number;

			if (candleIndex < this.candles.length) {
				const candle = this.candles[candleIndex];

				if (!candle) {
					continue;
				}

				slotTime = candle.time;
			} else if (lastCandle) {
				// Extrapolate time for future candle slots
				const futureDelta = candleIndex - (this.candles.length - 1);
				slotTime = lastCandle.time + futureDelta * candleTimeframeMs;
			} else {
				continue;
			}

			if (!isAlignedToInterval(slotTime, niceIntervalMs)) {
				continue;
			}

			const candleX = candleIndex * this.viewport.candleSpacing + this.viewport.offsetX;
			const candleCenterX = candleX + this.viewport.candleWidth / 2;
			const label = formatXAxisLabel(slotTime);
			const labelWidth = ctx.measureText(label).width;

			if (candleCenterX + labelWidth / 2 < 0 || candleCenterX - labelWidth / 2 > canvasWidth) {
				continue;
			}

			ctx.strokeStyle = axisXConfig.tickColor;
			ctx.lineWidth = axisXConfig.tickWidth;

			ctx.beginPath();
			ctx.moveTo(candleCenterX, 0);
			ctx.lineTo(candleCenterX, axisXConfig.tickLength);
			ctx.stroke();

			ctx.fillStyle = axisXConfig.textColor;
			ctx.fillText(label, candleCenterX, axisXConfig.labelOffsetY);
		}

		ctx.restore();

		this.drawCrosshairTimeLabel();
	}

	drawCrosshairTimeLabel() {
		if (!this.crosshair.visible || !this.crosshair.candle) {
			return;
		}

		const ctx = this.#ctx;
		const canvasWidth = this.#canvas.width;
		const canvasHeight = this.#canvas.height;
		const labelConfig = CHART_CONFIG.axis.axisX.crosshairLabel;
		const label = formatTimeHHMM(this.crosshair.candle.time);

		ctx.save();

		ctx.font = labelConfig.font;

		const labelWidth = ctx.measureText(label).width;
		const rectWidth = labelWidth + labelConfig.paddingX * 2;
		const rectHeight = labelConfig.height;
		const rectX = Math.max(0, Math.min(canvasWidth - rectWidth, this.crosshair.x - rectWidth / 2));
		const rectY = Math.max(0, (canvasHeight - rectHeight) / 2);

		ctx.fillStyle = labelConfig.backgroundColor;
		ctx.fillRect(rectX, rectY, rectWidth, rectHeight);

		ctx.strokeStyle = labelConfig.borderColor;
		ctx.lineWidth = labelConfig.borderWidth;
		ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);

		ctx.fillStyle = labelConfig.textColor;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(label, rectX + rectWidth / 2, rectY + rectHeight / 2);

		ctx.restore();
	}
}
