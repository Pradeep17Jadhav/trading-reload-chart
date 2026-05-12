import { CHART_CONFIG } from "../../config/chartConfig";

import type { Candle } from "../../models/Candle";

type ExistingCandlesLayerOptions = {
	canvas: HTMLCanvasElement;

	candles: Candle[];

	baseCandleWidth?: number;

	baseCandleGap?: number;

	bullishColor?: string;

	bearishColor?: string;

	backgroundColor?: string;

	offsetX?: number;

	zoomX?: number;

	priceRange?: number;

	priceCenter?: number;

	/**
	 * Enable automatic scrolling
	 * when latest candle moves
	 */
	autoFollowLatestCandle?: boolean;

	/**
	 * Number of candles from right edge
	 * where auto-follow becomes active.
	 *
	 * 0 = only when latest candle reaches right edge
	 *
	 * Example:
	 * 10 = auto-follow activates when
	 * latest candle reaches 10th position
	 * from right edge
	 */
	autoFollowThresholdCandles?: number;

	/**
	 * Empty candle space on right side
	 */
	rightOffsetCandles?: number;
};

export class ExistingCandlesLayer {
	readonly #canvas: HTMLCanvasElement;

	readonly #ctx: CanvasRenderingContext2D;

	candles: Candle[];

	baseCandleWidth: number;

	baseCandleGap: number;

	bullishColor: string;

	bearishColor: string;

	backgroundColor: string;

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

		this.baseCandleWidth =
			options.baseCandleWidth ?? CHART_CONFIG.candles.defaultWidth;

		this.baseCandleGap =
			options.baseCandleGap ?? CHART_CONFIG.candles.defaultGap;

		this.bullishColor = options.bullishColor ?? CHART_CONFIG.colors.bullish;

		this.bearishColor = options.bearishColor ?? CHART_CONFIG.colors.bearish;

		this.backgroundColor =
			options.backgroundColor ?? CHART_CONFIG.colors.background;

		this.zoomX = options.zoomX ?? 1;

		this.autoFollowLatestCandle =
			options.autoFollowLatestCandle ??
			CHART_CONFIG.candles.autoFollowLatestCandle;

		this.autoFollowThresholdCandles =
			options.autoFollowThresholdCandles ??
			CHART_CONFIG.candles.autoFollowThresholdCandles;

		this.rightOffsetCandles =
			options.rightOffsetCandles ?? CHART_CONFIG.candles.rightOffsetCandles;

		const totalChartWidth = this.candles.length * this.candleSpacing;

		const rightOffsetPixels = this.rightOffsetCandles * this.candleSpacing;

		this.offsetX =
			options.offsetX ??
			this.#canvas.width - totalChartWidth - rightOffsetPixels;

		/**
		 * Initial follow state
		 */
		this.isFollowingLatest = this.isWithinAutoFollowThreshold();

		/**
		 * Initial viewport
		 */
		this.priceCenter = 0;

		this.priceRange = 1;

		this.initializeViewport();

		/**
		 * Manual overrides
		 */
		if (options.priceCenter !== undefined) {
			this.priceCenter = options.priceCenter;
		}

		if (options.priceRange !== undefined) {
			this.priceRange = options.priceRange;
		}
	}

	initializeViewport() {
		if (this.candles.length === 0) {
			this.priceCenter = 100;

			this.priceRange = 20;

			return;
		}

		const visibleCandleCount = Math.ceil(
			this.#canvas.width / this.candleSpacing,
		);

		const visibleCandles = this.candles.slice(
			Math.max(
				0,

				this.candles.length - visibleCandleCount,
			),
		);

		let minPrice = Number.POSITIVE_INFINITY;

		let maxPrice = Number.NEGATIVE_INFINITY;

		for (const candle of visibleCandles) {
			if (candle.low < minPrice) {
				minPrice = candle.low;
			}

			if (candle.high > maxPrice) {
				maxPrice = candle.high;
			}
		}

		const rawPriceRange = maxPrice - minPrice;

		const verticalPadding = rawPriceRange * 0.2;

		this.priceCenter = (minPrice + maxPrice) / 2;

		this.priceRange = rawPriceRange + verticalPadding;
	}

	isWithinAutoFollowThreshold() {
		const totalChartWidth = this.candles.length * this.candleSpacing;

		const rightOffsetPixels = this.rightOffsetCandles * this.candleSpacing;

		const rightGap =
			this.#canvas.width - (totalChartWidth + this.offsetX) - rightOffsetPixels;

		const thresholdPixels =
			this.autoFollowThresholdCandles * this.candleSpacing;

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

		/**
		 * Previous candle becomes closed
		 */
		if (lastCandle) {
			lastCandle.isClosed = true;
		}

		/**
		 * Append new live candle
		 */
		this.candles.push(candle);

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

	getVisibleRange(chartWidth: number) {
		const startIndex = Math.max(
			0,

			Math.floor(-this.offsetX / this.candleSpacing),
		);

		const endIndex = Math.min(
			this.candles.length - 1,

			Math.ceil((chartWidth - this.offsetX) / this.candleSpacing),
		);

		return {
			startIndex,

			endIndex,
		};
	}

	panHorizontally(deltaX: number) {
		this.offsetX += deltaX;

		/**
		 * Update follow state
		 */
		this.isFollowingLatest = this.isWithinAutoFollowThreshold();
	}

	panVertically(deltaY: number) {
		const chartHeight = this.#canvas.height;

		const priceDelta = (deltaY / chartHeight) * this.priceRange;

		this.priceCenter += priceDelta;
	}

	zoomHorizontally(delta: number) {
		const { speed, min, max } = CHART_CONFIG.zoom.x;

		/**
		 * Current candle index
		 * at viewport right edge
		 */
		const rightEdgeIndex =
			(this.#canvas.width - this.offsetX) / this.candleSpacing;

		/**
		 * Apply zoom
		 */
		this.zoomX += delta * speed;

		/**
		 * Clamp zoom
		 */
		this.zoomX = Math.max(
			min,

			Math.min(this.zoomX, max),
		);

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
		const { speed, min, max } = CHART_CONFIG.zoom.y;

		const zoomFactor = 1 - delta * speed;

		this.priceRange *= zoomFactor;

		this.priceRange = Math.max(
			min,

			Math.min(this.priceRange, max),
		);
	}

	render() {
		const ctx = this.#ctx;

		const chartWidth = this.#canvas.width;

		const chartHeight = this.#canvas.height;

		/**
		 * Background
		 */
		ctx.fillStyle = this.backgroundColor;

		ctx.fillRect(0, 0, chartWidth, chartHeight);

		if (this.candles.length === 0) {
			return;
		}

		const {
			startIndex,

			endIndex,
		} = this.getVisibleRange(chartWidth);

		const visibleCandles = this.candles.slice(
			startIndex,

			endIndex + 1,
		);

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

	drawCandles({
		ctx,

		candles,

		startIndex,

		chartHeight,
	}: {
		ctx: CanvasRenderingContext2D;

		candles: Candle[];

		startIndex: number;

		chartHeight: number;
	}) {
		candles.forEach(
			(
				candle,

				localIndex,
			) => {
				const candleIndex = startIndex + localIndex;

				const candleX = candleIndex * this.candleSpacing + this.offsetX;

				const openY = this.priceToY(
					candle.open,

					chartHeight,
				);

				const closeY = this.priceToY(
					candle.close,

					chartHeight,
				);

				const highY = this.priceToY(
					candle.high,

					chartHeight,
				);

				const lowY = this.priceToY(
					candle.low,

					chartHeight,
				);

				const candleColor =
					candle.close >= candle.open ? this.bullishColor : this.bearishColor;

				this.drawSingleCandle({
					ctx,

					candleX,

					openY,

					closeY,

					highY,

					lowY,

					candleColor,
				});
			},
		);
	}

	drawSingleCandle({
		ctx,

		candleX,

		openY,

		closeY,

		highY,

		lowY,

		candleColor,
	}: {
		ctx: CanvasRenderingContext2D;

		candleX: number;

		openY: number;

		closeY: number;

		highY: number;

		lowY: number;

		candleColor: string;
	}) {
		ctx.strokeStyle = candleColor;

		ctx.fillStyle = candleColor;

		const candleCenterX = candleX + this.candleWidth / 2;

		ctx.beginPath();

		ctx.moveTo(
			candleCenterX,

			highY,
		);

		ctx.lineTo(
			candleCenterX,

			lowY,
		);

		ctx.stroke();

		const candleBodyY = Math.min(
			openY,

			closeY,
		);

		const candleBodyHeight = Math.max(
			Math.abs(closeY - openY),

			CHART_CONFIG.candles.minBodyHeight,
		);

		ctx.fillRect(
			candleX,

			candleBodyY,

			this.candleWidth,

			candleBodyHeight,
		);
	}

	drawLivePriceLine({
		ctx,

		chartWidth,

		chartHeight,
	}: {
		ctx: CanvasRenderingContext2D;

		chartWidth: number;

		chartHeight: number;
	}) {
		const latestCandle = this.candles.at(-1);

		if (!latestCandle) {
			return;
		}

		if (!CHART_CONFIG.candles.livePriceLine.visible) {
			return;
		}

		const latestPrice = latestCandle.close;

		const lineY = this.priceToY(
			latestPrice,

			chartHeight,
		);

		const lineColor =
			latestCandle.close >= latestCandle.open
				? CHART_CONFIG.candles.livePriceLine.bullishColor
				: CHART_CONFIG.candles.livePriceLine.bearishColor;

		ctx.save();

		ctx.globalAlpha = CHART_CONFIG.candles.livePriceLine.opacity;

		ctx.strokeStyle = lineColor;

		ctx.lineWidth = CHART_CONFIG.candles.livePriceLine.width;

		ctx.setLineDash([...CHART_CONFIG.candles.livePriceLine.dash]);

		ctx.beginPath();

		ctx.moveTo(0, lineY);

		ctx.lineTo(
			chartWidth,

			lineY,
		);

		ctx.stroke();

		ctx.restore();
	}

	priceToY(
		price: number,

		chartHeight: number,
	) {
		const normalizedPrice = (price - this.minPrice) / this.priceRange;

		return chartHeight - normalizedPrice * chartHeight;
	}
}
