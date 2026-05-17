import { CHART_CONFIG } from "../../../config/chartConfig";
import type { Candle } from "../../../models/Candle.types";
import type { ChartViewport } from "../../../models/ChartViewport.types";
import type { VisibleRange } from "../../../models/VisibleRange.types";
import type {
	DrawSingleVolumeBarOptions,
	DrawVolumeBarsOptions,
	VolumeLayerOptions,
} from "./VolumeLayer.types";

export class VolumeLayer {
	readonly #canvas: HTMLCanvasElement;
	readonly #ctx: CanvasRenderingContext2D;

	candles: Candle[];
	viewport: ChartViewport | null = null;

	bullishColor: string;
	bearishColor: string;
	opacity: number;
	height: number;
	bottomOffset: number;
	minBarHeight: number;

	constructor(options: VolumeLayerOptions) {
		this.#canvas = options.canvas;

		const ctx = this.#canvas.getContext("2d");

		if (!ctx) {
			throw new Error("Canvas 2D context not supported");
		}

		this.#ctx = ctx;
		this.candles = options.candles;
		this.bullishColor = options.bullishColor ?? CHART_CONFIG.volume.bullishColor;
		this.bearishColor = options.bearishColor ?? CHART_CONFIG.volume.bearishColor;
		this.opacity = this.clampOpacity(options.opacity ?? CHART_CONFIG.volume.opacity);
		this.height = Math.max(0, options.height ?? CHART_CONFIG.volume.height);
		this.bottomOffset = Math.max(0, options.bottomOffset ?? CHART_CONFIG.volume.bottomOffset);
		this.minBarHeight = Math.max(0, options.minBarHeight ?? CHART_CONFIG.volume.minBarHeight);
	}

	setCandles(candles: Candle[]) {
		this.candles = candles;
	}

	setLiveCandle(_candle: Candle | null | undefined) {
		/**
		 * Kept for API symmetry with other layers.
		 *
		 * VolumeLayer reads from the candles array directly, so the latest
		 * live candle is already included after ExistingCandlesLayer updates it.
		 */
	}

	setViewport(viewport: ChartViewport) {
		this.viewport = viewport;
	}

	render() {
		this.clearCanvas();

		if (!CHART_CONFIG.volume.visible || !this.viewport || this.candles.length === 0) {
			return;
		}

		const ctx = this.#ctx;
		const chartWidth = this.#canvas.width;
		const chartHeight = this.#canvas.height;
		const { startIndex, endIndex } = this.getVisibleRange(chartWidth);

		if (endIndex < startIndex) {
			return;
		}

		const visibleCandles = this.candles.slice(startIndex, endIndex + 1);
		const maxVolume = this.getMaxVolume(visibleCandles);

		if (maxVolume <= 0) {
			return;
		}

		this.drawVolumeBars({
			ctx,
			candles: visibleCandles,
			startIndex,
			maxVolume,
			chartHeight,
		});
	}

	private drawVolumeBars({ ctx, candles, startIndex, maxVolume, chartHeight }: DrawVolumeBarsOptions) {
		ctx.save();
		ctx.globalAlpha = this.opacity;

		candles.forEach((candle, localIndex) => {
			const candleIndex = startIndex + localIndex;
			const candleX = this.getCandleX(candleIndex);

			this.drawSingleVolumeBar({
				ctx,
				candle,
				candleX,
				maxVolume,
				chartHeight,
			});
		});

		ctx.restore();
	}

	private drawSingleVolumeBar({ ctx, candle, candleX, maxVolume, chartHeight }: DrawSingleVolumeBarOptions) {
		if (!this.viewport || candle.volume <= 0) {
			return;
		}

		const volumeAreaHeight = this.getVolumeAreaHeight(chartHeight);

		if (volumeAreaHeight <= 0) {
			return;
		}

		const volumeRatio = candle.volume / maxVolume;
		const rawBarHeight = volumeAreaHeight * volumeRatio;
		const barHeight = Math.min(volumeAreaHeight, Math.max(rawBarHeight, this.minBarHeight));
		const barY = chartHeight - this.bottomOffset - barHeight;
		const barWidth = Math.max(1, this.viewport.candleWidth);
		const barColor = this.getVolumeBarColor(candle);

		ctx.fillStyle = barColor;
		ctx.fillRect(candleX, barY, barWidth, barHeight);
	}

	private getVisibleRange(chartWidth: number): VisibleRange {
		if (!this.viewport) {
			return {
				startIndex: 0,
				endIndex: -1,
			};
		}

		const { offsetX, candleSpacing } = this.viewport;

		return {
			startIndex: Math.max(0, Math.floor(-offsetX / candleSpacing)),
			endIndex: Math.min(this.candles.length - 1, Math.ceil((chartWidth - offsetX) / candleSpacing)),
		};
	}

	private getCandleX(candleIndex: number) {
		if (!this.viewport) {
			return 0;
		}

		return candleIndex * this.viewport.candleSpacing + this.viewport.offsetX;
	}

	private getMaxVolume(candles: Candle[]) {
		return candles.reduce((maxVolume, candle) => Math.max(maxVolume, candle.volume), 0);
	}

	private getVolumeAreaHeight(chartHeight: number) {
		return Math.max(0, Math.min(this.height, chartHeight - this.bottomOffset));
	}

	private getVolumeBarColor(candle: Candle) {
		return candle.close >= candle.open ? this.bullishColor : this.bearishColor;
	}

	private clampOpacity(opacity: number) {
		return Math.max(0, Math.min(opacity, 1));
	}

	private clearCanvas() {
		this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
	}
}
