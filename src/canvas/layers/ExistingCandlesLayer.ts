import { CHART_CONFIG } from "../../config/chartConfig";
import { normalizePrice } from "../../helpers/math";
import type { Candle } from "../../models/Candle.types";
import type { ChartViewport } from "../../models/ChartViewport.types";
import type { VisibleRange } from "../../models/VisibleRange.types";
import type {
	CandleYCoordinates,
	DrawCandlesOptions,
	DrawLivePriceLineOptions,
	DrawSingleCandleOptions,
	ExistingCandlesLayerOptions,
} from "./ExistingCandlesLayer.types";
import { priceToY, yToPrice } from "./helpers/LayerHelpers";

export class ExistingCandlesLayer {
	readonly #canvas: HTMLCanvasElement;
	readonly #ctx: CanvasRenderingContext2D;

	candles: Candle[];
	baseCandleWidth: number;
	baseCandleGap: number;
	bullishColor: string;
	bearishColor: string;
	/**
	 * Camera horizontal offset
	 */
	offsetX: number;
	/**
	 * Horizontal zoom level
	 */
	zoomX: number;
	/**
	 * Camera vertical range
	 */
	priceRange: number;
	/**
	 * Camera vertical center
	 */
	priceCenter: number;
	/**
	 * Baseline range used to calculate
	 * percentage-based vertical zoom limits.
	 */
	initialPriceRange: number;
	/**
	 * Auto-follow feature enabled
	 */
	autoFollowLatestCandle: boolean;
	/**
	 * Runtime follow state
	 */
	isFollowingLatest = false;
	/**
	 * Threshold from right edge
	 * where auto-follow activates
	 */
	autoFollowThresholdCandles: number;
	/**
	 * Empty candle spacing
	 * on right side
	 */
	rightOffsetCandles: number;

	constructor(options: ExistingCandlesLayerOptions) {
		this.#canvas = options.canvas;

		const ctx = this.#canvas.getContext("2d");

		if (!ctx) {
			throw new Error("Canvas 2D context not supported");
		}

		this.#ctx = ctx;
		this.candles = options.candles;
		this.baseCandleWidth = options.baseCandleWidth ?? CHART_CONFIG.candles.defaultWidth;
		this.baseCandleGap = options.baseCandleGap ?? CHART_CONFIG.candles.defaultGap;
		this.bullishColor = options.bullishColor ?? CHART_CONFIG.colors.bullish;
		this.bearishColor = options.bearishColor ?? CHART_CONFIG.colors.bearish;
		this.zoomX = options.zoomX ?? 1;
		this.autoFollowLatestCandle = options.autoFollowLatestCandle ?? CHART_CONFIG.candles.autoFollowLatestCandle;
		this.autoFollowThresholdCandles =
			options.autoFollowThresholdCandles ?? CHART_CONFIG.candles.autoFollowThresholdCandles;
		this.rightOffsetCandles = options.rightOffsetCandles ?? CHART_CONFIG.candles.rightOffsetCandles;

		this.offsetX = options.offsetX ?? this.getDefaultOffsetX();
		/**
		 * Initial follow state
		 */
		this.isFollowingLatest = this.isWithinAutoFollowThreshold();
		/**
		 * Initial viewport
		 */
		this.priceCenter = 0;
		this.priceRange = 1;
		this.initialPriceRange = 1;

		this.initializeViewport();
		this.applyManualViewportOverrides(options);
	}

	initializeViewport() {
		if (this.candles.length === 0) {
			this.setFallbackViewport();
			return;
		}

		const visibleCandles = this.getInitialVisibleCandles();
		const { minPrice, maxPrice } = this.getCandlesPriceBounds(visibleCandles);
		const priceRange = this.getInitialPriceRange(minPrice, maxPrice);

		this.priceCenter = (minPrice + maxPrice) / 2;
		this.priceRange = priceRange;
		this.initialPriceRange = priceRange;
	}

	isWithinAutoFollowThreshold() {
		const rightGap = this.getRightGap();
		const thresholdPixels = this.autoFollowThresholdCandles * this.candleSpacing;

		return rightGap <= thresholdPixels + 5;
	}

	updateLiveCandle(candle: Candle) {
		const lastCandle = this.candles.at(-1);

		/**
		 * Replace current live candle
		 */
		if (lastCandle && lastCandle.time === candle.time) {
			this.candles[this.candles.length - 1] = candle;
			return;
		}

		this.closeLastCandle(lastCandle);
		this.appendLiveCandle(candle);
		this.updateAutoFollowAfterAppend();
	}

	get candleWidth() {
		return this.baseCandleWidth * this.zoomX;
	}

	get candleGap() {
		return this.baseCandleGap * this.zoomX;
	}

	get candleSpacing() {
		return this.candleWidth + this.candleGap;
	}

	get minPrice() {
		return this.priceCenter - this.priceRange / 2;
	}

	get maxPrice() {
		return this.priceCenter + this.priceRange / 2;
	}

	get liveCandle() {
		return this.candles[this.candles.length - 1];
	}

	get viewport(): ChartViewport {
		return {
			minPrice: this.minPrice,
			maxPrice: this.maxPrice,
			priceRange: this.priceRange,
			offsetX: this.offsetX,
			zoomX: this.zoomX,
			candleWidth: this.candleWidth,
			candleGap: this.candleGap,
			candleSpacing: this.candleSpacing,
		};
	}

	getVisibleRange(chartWidth: number): VisibleRange {
		const startIndex = Math.max(0, Math.floor(-this.offsetX / this.candleSpacing));
		const endIndex = Math.min(this.candles.length - 1, Math.ceil((chartWidth - this.offsetX) / this.candleSpacing));

		return {
			startIndex,
			endIndex,
		};
	}

	getCandleX(candleIndex: number) {
		return candleIndex * this.candleSpacing + this.offsetX;
	}

	getCandleCenterX(candleIndex: number) {
		return this.getCandleX(candleIndex) + this.candleWidth / 2;
	}

	getNearestCandleIndexByX(x: number) {
		if (this.candles.length === 0) {
			return null;
		}

		const rawIndex = Math.round((x - this.offsetX - this.candleWidth / 2) / this.candleSpacing);

		return this.clampCandleIndex(rawIndex);
	}

	/**
	 * Returns the grid-snapped canvas X for any position,
	 * including positions beyond the last candle (unclamped).
	 */
	getRawCandleSnapX(x: number) {
		const rawIndex = Math.round((x - this.offsetX - this.candleWidth / 2) / this.candleSpacing);

		return this.getCandleCenterX(rawIndex);
	}

	getPriceAtY(y: number) {
		return normalizePrice(
			yToPrice({
				y,
				minPrice: this.minPrice,
				priceRange: this.priceRange,
				chartHeight: this.#canvas.height,
			}),
		);
	}

	panHorizontally(deltaX: number) {
		this.offsetX += deltaX;
		this.isFollowingLatest = this.isWithinAutoFollowThreshold();
	}

	panVertically(deltaY: number) {
		const chartHeight = this.#canvas.height;
		const priceDelta = (deltaY / chartHeight) * this.priceRange;

		this.priceCenter += priceDelta;
	}

	zoomHorizontally(delta: number) {
		const rightEdgeIndex = this.getRightEdgeCandleIndex();

		this.zoomX = this.getNextHorizontalZoom(delta);
		/**
		 * Keep viewport right edge fixed
		 */
		this.offsetX = this.#canvas.width - rightEdgeIndex * this.candleSpacing;
		/**
		 * Update follow state
		 */
		this.isFollowingLatest = this.isWithinAutoFollowThreshold();
	}

	zoomVertically(delta: number) {
		this.priceRange = this.getNextVerticalPriceRange(delta);
	}

	render() {
		const ctx = this.#ctx;
		const chartWidth = this.#canvas.width;
		const chartHeight = this.#canvas.height;

		this.clearCanvas(ctx, chartWidth, chartHeight);

		if (this.candles.length === 0) {
			return;
		}

		const { startIndex, endIndex } = this.getVisibleRange(chartWidth);
		const visibleCandles = this.candles.slice(startIndex, endIndex + 1);

		this.drawCandles({
			ctx,
			candles: visibleCandles,
			startIndex,
			chartHeight,
		});

		this.drawLivePriceLine({
			ctx,
			chartWidth,
			chartHeight,
		});
	}

	drawCandles({ ctx, candles, startIndex, chartHeight }: DrawCandlesOptions) {
		candles.forEach((candle, localIndex) => {
			const candleIndex = startIndex + localIndex;
			const candleX = this.getCandleX(candleIndex);
			const candleColor = this.getCandleColor(candle);
			const candleYCoordinates = this.getCandleYCoordinates(candle, chartHeight);

			this.drawSingleCandle({
				ctx,
				candleX,
				candleColor,
				...candleYCoordinates,
			});
		});
	}

	drawSingleCandle({ ctx, candleX, openY, closeY, highY, lowY, candleColor }: DrawSingleCandleOptions) {
		ctx.strokeStyle = candleColor;
		ctx.fillStyle = candleColor;

		const candleCenterX = candleX + this.candleWidth / 2;

		ctx.beginPath();
		ctx.moveTo(candleCenterX, highY);
		ctx.lineTo(candleCenterX, lowY);
		ctx.stroke();

		const candleBodyY = Math.min(openY, closeY);
		const candleBodyHeight = Math.max(Math.abs(closeY - openY), CHART_CONFIG.candles.minBodyHeight);

		ctx.fillRect(candleX, candleBodyY, this.candleWidth, candleBodyHeight);
	}

	drawLivePriceLine({ ctx, chartWidth, chartHeight }: DrawLivePriceLineOptions) {
		const latestCandle = this.candles.at(-1);

		if (!latestCandle || !CHART_CONFIG.candles.livePriceLine.visible) {
			return;
		}

		const latestPrice = normalizePrice(latestCandle.close);
		const lineY = this.getPriceY(latestPrice, chartHeight);
		const lineColor = this.getLivePriceLineColor(latestCandle);

		ctx.save();
		ctx.globalAlpha = CHART_CONFIG.candles.livePriceLine.opacity;
		ctx.strokeStyle = lineColor;
		ctx.lineWidth = CHART_CONFIG.candles.livePriceLine.width;
		ctx.setLineDash([...CHART_CONFIG.candles.livePriceLine.dash]);

		ctx.beginPath();
		ctx.moveTo(0, lineY);
		ctx.lineTo(chartWidth, lineY);
		ctx.stroke();

		ctx.restore();
	}

	private getDefaultOffsetX() {
		const totalChartWidth = this.getTotalChartWidth();
		const rightOffsetPixels = this.getRightOffsetPixels();

		return this.#canvas.width - totalChartWidth - rightOffsetPixels;
	}

	private getTotalChartWidth() {
		return this.candles.length * this.candleSpacing;
	}

	private getRightOffsetPixels() {
		return this.rightOffsetCandles * this.candleSpacing;
	}

	private getRightGap() {
		return this.#canvas.width - (this.getTotalChartWidth() + this.offsetX) - this.getRightOffsetPixels();
	}

	private setFallbackViewport() {
		this.priceCenter = 100;
		this.priceRange = 20;
		this.initialPriceRange = this.priceRange;
	}

	private getInitialVisibleCandles() {
		const visibleCandleCount = Math.ceil(this.#canvas.width / this.candleSpacing);
		const startIndex = Math.max(0, this.candles.length - visibleCandleCount);

		return this.candles.slice(startIndex);
	}

	private getCandlesPriceBounds(candles: Candle[]) {
		let minPrice = Number.POSITIVE_INFINITY;
		let maxPrice = Number.NEGATIVE_INFINITY;

		for (const candle of candles) {
			if (candle.low < minPrice) {
				minPrice = candle.low;
			}

			if (candle.high > maxPrice) {
				maxPrice = candle.high;
			}
		}

		return {
			minPrice,
			maxPrice,
		};
	}

	private getInitialPriceRange(minPrice: number, maxPrice: number) {
		const rawPriceRange = normalizePrice(maxPrice - minPrice);
		const fallbackRange = Math.max(Math.abs((minPrice + maxPrice) / 2) * 0.01, 0.00001);
		const effectivePriceRange = Math.max(rawPriceRange, fallbackRange);
		const verticalPadding = effectivePriceRange * 0.2;

		return effectivePriceRange + verticalPadding;
	}

	private applyManualViewportOverrides(options: ExistingCandlesLayerOptions) {
		/**
		 * Manual overrides
		 */
		if (options.priceCenter !== undefined) {
			this.priceCenter = options.priceCenter;
		}

		if (options.priceRange !== undefined) {
			this.priceRange = options.priceRange;
			this.initialPriceRange = options.priceRange;
		}
	}

	private closeLastCandle(lastCandle: Candle | undefined) {
		/**
		 * Previous candle becomes closed
		 */
		if (lastCandle) {
			lastCandle.isClosed = true;
		}
	}

	private appendLiveCandle(candle: Candle) {
		/**
		 * Append new live candle
		 */
		this.candles.push(candle);
	}

	private updateAutoFollowAfterAppend() {
		/**
		 * Recalculate follow state
		 * after new candle append
		 */
		this.isFollowingLatest = this.isWithinAutoFollowThreshold();

		/**
		 * Auto-follow latest candle
		 */
		if (this.autoFollowLatestCandle && this.isFollowingLatest) {
			this.offsetX -= this.candleSpacing;
		}
	}

	private clampCandleIndex(candleIndex: number) {
		return Math.max(0, Math.min(this.candles.length - 1, candleIndex));
	}

	private getRightEdgeCandleIndex() {
		/**
		 * Current candle index
		 * at viewport right edge
		 */
		return (this.#canvas.width - this.offsetX) / this.candleSpacing;
	}

	private getNextHorizontalZoom(delta: number) {
		const { speed, min, max } = CHART_CONFIG.zoom.x;
		const nextZoom = this.zoomX + delta * speed;

		/**
		 * Clamp zoom
		 */
		return Math.max(min, Math.min(nextZoom, max));
	}

	private getNextVerticalPriceRange(delta: number) {
		const { speed, min, max } = CHART_CONFIG.zoom.y;
		const zoomFactor = 1 - delta * speed;
		const nextPriceRange = this.priceRange * zoomFactor;
		const minPriceRange = this.initialPriceRange * (min / 100);
		const maxPriceRange = this.initialPriceRange * (max / 100);

		return Math.max(minPriceRange, Math.min(nextPriceRange, maxPriceRange));
	}

	private clearCanvas(ctx: CanvasRenderingContext2D, chartWidth: number, chartHeight: number) {
		ctx.clearRect(0, 0, chartWidth, chartHeight);
	}

	private getCandleColor(candle: Candle) {
		return candle.close >= candle.open ? this.bullishColor : this.bearishColor;
	}

	private getCandleYCoordinates(candle: Candle, chartHeight: number): CandleYCoordinates {
		return {
			openY: this.getPriceY(candle.open, chartHeight),
			closeY: this.getPriceY(candle.close, chartHeight),
			highY: this.getPriceY(candle.high, chartHeight),
			lowY: this.getPriceY(candle.low, chartHeight),
		};
	}

	private getPriceY(price: number, chartHeight: number) {
		return priceToY({
			price,
			minPrice: this.minPrice,
			priceRange: this.priceRange,
			chartHeight,
		});
	}

	private getLivePriceLineColor(candle: Candle) {
		return candle.close >= candle.open
			? CHART_CONFIG.candles.livePriceLine.bullishColor
			: CHART_CONFIG.candles.livePriceLine.bearishColor;
	}
}
