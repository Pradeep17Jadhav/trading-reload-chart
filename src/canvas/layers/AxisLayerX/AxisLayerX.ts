// AxisLayerX.ts

import { CHART_CONFIG } from "../../../config/chartConfig";
import type { Candle } from "../../../models/Candle.types";
import type { ChartViewport } from "../../../models/ChartViewport.types";
import {
	detectCandleTimeframeMs,
	formatTimeDayDateHHMM,
	formatXAxisLabel,
	getXAxisNiceIntervalMs,
	isAlignedToInterval,
} from "./AxisLayerX.helpers";
import type { AxisLayerXCrosshair, AxisLayerXOptions } from "./AxisLayerX.types";

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

		this.clearCanvas();
		this.drawBackground();
		this.drawTopBorder();

		if (this.candles.length > 0) {
			this.drawAxisLabels();
		}

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
		const label = formatTimeDayDateHHMM(this.crosshair.candle.time);

		ctx.save();

		ctx.font = labelConfig.font;

		const labelWidth = ctx.measureText(label).width;
		const rectWidth = labelWidth + labelConfig.paddingX * 2;
		const rectHeight = labelConfig.height;
		const rectX = this.getCrosshairLabelX(rectWidth, canvasWidth);
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

	private clearCanvas() {
		this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
	}

	private drawBackground() {
		const ctx = this.#ctx;
		const axisXConfig = CHART_CONFIG.axis.axisX;

		ctx.save();
		ctx.fillStyle = axisXConfig.backgroundColor;
		ctx.fillRect(0, 0, this.#canvas.width, this.#canvas.height);
		ctx.restore();
	}

	private drawTopBorder() {
		const ctx = this.#ctx;
		const axisXConfig = CHART_CONFIG.axis.axisX;

		ctx.save();
		ctx.strokeStyle = axisXConfig.borderColor;
		ctx.lineWidth = axisXConfig.borderWidth;
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(this.#canvas.width, 0);
		ctx.stroke();
		ctx.restore();
	}

	private drawAxisLabels() {
		if (!this.viewport) {
			return;
		}

		const ctx = this.#ctx;
		const axisXConfig = CHART_CONFIG.axis.axisX;
		const canvasWidth = this.#canvas.width;
		const candleTimeframeMs = detectCandleTimeframeMs(this.candles);

		ctx.save();
		ctx.font = axisXConfig.font;
		ctx.fillStyle = axisXConfig.textColor;
		ctx.textAlign = axisXConfig.textAlign;
		ctx.textBaseline = "middle";

		const sampleLabelWidth = ctx.measureText("00:00").width;
		const niceIntervalMs = getXAxisNiceIntervalMs({
			candleSpacing: this.viewport.candleSpacing,
			candleTimeframeMs,
			labelWidth: sampleLabelWidth,
			minLabelGap: axisXConfig.minLabelGap,
		});

		const { startIndex, endIndex } = this.getVisibleCandleIndexRange(canvasWidth);

		for (let candleIndex = startIndex; candleIndex <= endIndex; candleIndex += 1) {
			const slotTime = this.getSlotTime(candleIndex, candleTimeframeMs);

			if (slotTime === null || !isAlignedToInterval(slotTime, niceIntervalMs)) {
				continue;
			}

			const candleCenterX = this.getCandleCenterX(candleIndex);
			const label = formatXAxisLabel(slotTime);
			const labelWidth = ctx.measureText(label).width;

			if (this.isLabelOutsideCanvas(candleCenterX, labelWidth, canvasWidth)) {
				continue;
			}

			this.drawTick(candleCenterX);
			this.drawLabel(label, candleCenterX);
		}

		ctx.restore();
	}

	private getVisibleCandleIndexRange(canvasWidth: number) {
		if (!this.viewport) {
			return {
				startIndex: 0,
				endIndex: -1,
			};
		}

		const { candleSpacing, offsetX } = this.viewport;

		return {
			startIndex: Math.max(0, Math.floor(-offsetX / candleSpacing)),
			// Include future candle slots beyond the last loaded candle
			endIndex: Math.ceil((canvasWidth - offsetX) / candleSpacing),
		};
	}

	private getSlotTime(candleIndex: number, candleTimeframeMs: number) {
		if (candleIndex < this.candles.length) {
			const candle = this.candles[candleIndex];

			if (!candle) {
				return null;
			}

			return candle.time;
		}

		const lastCandle = this.candles[this.candles.length - 1];

		if (!lastCandle) {
			return null;
		}

		// Extrapolate time for future candle slots
		const futureDelta = candleIndex - (this.candles.length - 1);

		return lastCandle.time + futureDelta * candleTimeframeMs;
	}

	private getCandleCenterX(candleIndex: number) {
		if (!this.viewport) {
			return 0;
		}

		const { candleSpacing, candleWidth, offsetX } = this.viewport;
		const candleX = candleIndex * candleSpacing + offsetX;

		return candleX + candleWidth / 2;
	}

	private isLabelOutsideCanvas(candleCenterX: number, labelWidth: number, canvasWidth: number) {
		return candleCenterX + labelWidth / 2 < 0 || candleCenterX - labelWidth / 2 > canvasWidth;
	}

	private drawTick(candleCenterX: number) {
		const ctx = this.#ctx;
		const axisXConfig = CHART_CONFIG.axis.axisX;

		ctx.strokeStyle = axisXConfig.tickColor;
		ctx.lineWidth = axisXConfig.tickWidth;

		ctx.beginPath();
		ctx.moveTo(candleCenterX, 0);
		ctx.lineTo(candleCenterX, axisXConfig.tickLength);
		ctx.stroke();
	}

	private drawLabel(label: string, candleCenterX: number) {
		const ctx = this.#ctx;
		const axisXConfig = CHART_CONFIG.axis.axisX;

		ctx.fillStyle = axisXConfig.textColor;
		ctx.fillText(label, candleCenterX, axisXConfig.labelOffsetY);
	}

	private getCrosshairLabelX(rectWidth: number, canvasWidth: number) {
		return Math.max(120, Math.min(canvasWidth - rectWidth, this.crosshair.x - rectWidth / 2));
	}
}
