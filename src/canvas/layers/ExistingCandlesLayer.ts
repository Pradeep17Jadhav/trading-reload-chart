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

	zoomY?: number;
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
	 * Vertical zoom level
	 */
	zoomY: number;

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

		this.zoomY = options.zoomY ?? 1;

		const totalChartWidth = this.candles.length * this.candleSpacing;

		this.offsetX = options.offsetX ?? this.#canvas.width - totalChartWidth;
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

	pan(deltaX: number) {
		this.offsetX += deltaX;

		this.render();
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
		this.zoomX = Math.max(min, Math.min(this.zoomX, max));

		/**
		 * Keep viewport right edge fixed
		 */
		this.offsetX = this.#canvas.width - rightEdgeIndex * this.candleSpacing;

		this.render();
	}

	zoomVertically(delta: number) {
		const { speed, min, max } = CHART_CONFIG.zoom.y;

		this.zoomY += delta * speed;

		this.zoomY = Math.max(min, Math.min(this.zoomY, max));

		this.render();
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

		/**
		 * Ignore live candle for now
		 */
		const candles = this.candles.slice(0, -1);

		/**
		 * Price range
		 */
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

		const priceRange = maxPrice - minPrice || 1;

		this.drawCandles({
			ctx,

			candles,

			chartWidth,

			chartHeight,

			minPrice,

			priceRange,
		});
	}

	drawCandles({
		ctx,

		candles,

		chartWidth,

		chartHeight,

		minPrice,

		priceRange,
	}: {
		ctx: CanvasRenderingContext2D;

		candles: Candle[];

		chartWidth: number;

		chartHeight: number;

		minPrice: number;

		priceRange: number;
	}) {
		candles.forEach((candle, candleIndex) => {
			const candleX = candleIndex * this.candleSpacing + this.offsetX;

			/**
			 * Skip invisible candles on left
			 */
			if (candleX + this.candleWidth < 0) {
				return;
			}

			/**
			 * Stop outside viewport right
			 */
			if (candleX > chartWidth) {
				return;
			}

			const openY = this.priceToY(
				candle.open,

				minPrice,

				priceRange,

				chartHeight,
			);

			const closeY = this.priceToY(
				candle.close,

				minPrice,

				priceRange,

				chartHeight,
			);

			const highY = this.priceToY(
				candle.high,

				minPrice,

				priceRange,

				chartHeight,
			);

			const lowY = this.priceToY(
				candle.low,

				minPrice,

				priceRange,

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
		});
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

		/**
		 * Wick
		 */
		const candleCenterX = candleX + this.candleWidth / 2;

		ctx.beginPath();

		ctx.moveTo(candleCenterX, highY);

		ctx.lineTo(candleCenterX, lowY);

		ctx.stroke();

		/**
		 * Body
		 */
		const candleBodyY = Math.min(openY, closeY);

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

	priceToY(
		price: number,

		minPrice: number,

		priceRange: number,

		chartHeight: number,
	) {
		/**
		 * Normalize to 0 → 1
		 */
		const normalizedPrice = (price - minPrice) / priceRange;

		/**
		 * Convert to centered space
		 * -0.5 → +0.5
		 */
		const centeredPrice = normalizedPrice - 0.5;

		/**
		 * Apply vertical zoom
		 */
		const zoomedPrice = centeredPrice * this.zoomY;

		/**
		 * Convert back to 0 → 1
		 */
		const finalPrice = zoomedPrice + 0.5;

		return chartHeight - finalPrice * chartHeight;
	}
}
