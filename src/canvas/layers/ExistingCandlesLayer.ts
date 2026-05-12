import type { Candle } from "../../models/Candle";

type ExistingCandlesLayerOptions = {
	canvas: HTMLCanvasElement;

	candles: Candle[];

	candleWidth?: number;

	candleGap?: number;

	bullishColor?: string;

	bearishColor?: string;

	backgroundColor?: string;
};

export class ExistingCandlesLayer {
	readonly #canvas: HTMLCanvasElement;

	readonly #ctx: CanvasRenderingContext2D;

	candles: Candle[];

	candleWidth: number;

	candleGap: number;

	bullishColor: string;

	bearishColor: string;

	backgroundColor: string;

	/**
	 * Horizontal chart offset.
	 * Negative value means older candles are hidden on left.
	 */
	offsetX: number;

	constructor(options: ExistingCandlesLayerOptions) {
		this.#canvas = options.canvas;

		const ctx = this.#canvas.getContext("2d");

		if (!ctx) {
			throw new Error("Canvas 2D context not supported");
		}

		this.#ctx = ctx;

		this.candles = options.candles;

		this.candleWidth = options.candleWidth ?? 8;

		this.candleGap = options.candleGap ?? 2;

		this.bullishColor = options.bullishColor ?? "#22c55e";

		this.bearishColor = options.bearishColor ?? "#ef4444";

		this.backgroundColor = options.backgroundColor ?? "#0f172a";

		/**
		 * Start chart from right side.
		 * Latest candles should remain visible.
		 */
		const totalCandlesWidth =
			this.candles.length * (this.candleWidth + this.candleGap);

		this.offsetX = this.#canvas.width - totalCandlesWidth;
	}

	render() {
		const ctx = this.#ctx;

		const canvasWidth = this.#canvas.width;

		const canvasHeight = this.#canvas.height;

		/**
		 * Background
		 */
		ctx.fillStyle = this.backgroundColor;

		ctx.fillRect(0, 0, canvasWidth, canvasHeight);

		if (this.candles.length === 0) {
			return;
		}

		/**
		 * Ignore last candle for now.
		 * Live candle will come later.
		 */
		const candles = this.candles.slice(0, -1);

		/**
		 * Find visible price range
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
			canvasWidth,
			canvasHeight,
			minPrice,
			priceRange,
		});
	}

	drawCandles({
		ctx,

		candles,

		canvasWidth,

		canvasHeight,

		minPrice,

		priceRange,
	}: {
		ctx: CanvasRenderingContext2D;

		candles: Candle[];

		canvasWidth: number;

		canvasHeight: number;

		minPrice: number;

		priceRange: number;
	}) {
		candles.forEach((candle, candleIndex) => {
			const candleX =
				candleIndex * (this.candleWidth + this.candleGap) + this.offsetX;

			/**
			 * Skip invisible candles on left side
			 */
			if (candleX + this.candleWidth < 0) {
				return;
			}

			/**
			 * Stop rendering outside right side
			 */
			if (candleX > canvasWidth) {
				return;
			}

			const openY =
				canvasHeight - ((candle.open - minPrice) / priceRange) * canvasHeight;

			const closeY =
				canvasHeight - ((candle.close - minPrice) / priceRange) * canvasHeight;

			const highY =
				canvasHeight - ((candle.high - minPrice) / priceRange) * canvasHeight;

			const lowY =
				canvasHeight - ((candle.low - minPrice) / priceRange) * canvasHeight;

			const isBullish = candle.close >= candle.open;

			const candleColor = isBullish ? this.bullishColor : this.bearishColor;

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

		const candleBodyHeight = Math.max(Math.abs(closeY - openY), 1);

		ctx.fillRect(
			candleX,

			candleBodyY,

			this.candleWidth,

			candleBodyHeight,
		);
	}
}
