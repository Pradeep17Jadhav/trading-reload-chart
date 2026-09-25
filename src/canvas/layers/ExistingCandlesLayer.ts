import { CHART_CONFIG } from "../../config/chartConfig";
import { normalizePrice } from "../../helpers/math";
import type { Candle } from "../../models/Candle.types";
import type { ChartCursorState, ChartViewState } from "../../models/ChartSync.types";
import type { ChartViewport } from "../../models/ChartViewport.types";
import type { VisibleRange } from "../../models/VisibleRange.types";
import type {
	CandleYCoordinates,
	DrawCandlesOptions,
	DrawPriceLineOptions,
	DrawSingleCandleOptions,
	ExistingCandlesLayerOptions,
} from "./ExistingCandlesLayer.types";
import { priceToY, yToPrice } from "./helpers/LayerHelpers";

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

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

	getViewState(): ChartViewState | null {
		if (this.candles.length === 0 || this.candleSpacing <= 0 || this.#canvas.width <= 0) {
			return null;
		}

		return {
			rightmostVisibleTime: this.getRightmostVisibleTime(),
			rightmostVisibleX: this.getRightmostVisibleX(),
			rightEdgeTime: this.getRightEdgeTime(),
			visibleDurationMs: this.getVisibleDurationMs(),
		};
	}

	setViewState(view: ChartViewState) {
		if (this.candles.length === 0 || this.#canvas.width <= 0 || !this.hasUsableTimeframe()) {
			return;
		}

		const anchorTime = Number.isFinite(view.rightmostVisibleTime) ? view.rightmostVisibleTime : view.rightEdgeTime;
		const visibleDurationMs = Number.isFinite(view.visibleDurationMs) ? view.visibleDurationMs : 0;
		const anchorXRatio = Number.isFinite(view.rightmostVisibleX) ? view.rightmostVisibleX : 1;

		if (!Number.isFinite(anchorTime) || visibleDurationMs <= 0) {
			return;
		}

		/**
		 * Invert `getVisibleDurationMs`, which is `width * timeFrameMs / spacing`:
		 * a target window of `visibleDurationMs` therefore needs
		 * `spacing = width * timeFrameMs / visibleDurationMs`. This is computed
		 * from the *base* spacing so the result never depends on the current zoom.
		 */
		const timeFrameMs = this.detectCandleTimeframeMs();
		const baseSpacing = this.baseCandleWidth + this.baseCandleGap;
		const targetSpacing = (this.#canvas.width * timeFrameMs) / visibleDurationMs;
		const targetZoom = baseSpacing > 0 ? targetSpacing / baseSpacing : this.zoomX;

		this.zoomX = Math.max(CHART_CONFIG.zoom.x.min, Math.min(targetZoom, CHART_CONFIG.zoom.x.max));

		/**
		 * `rightmostVisibleX` is reported as a candle *center* by
		 * `getRightmostVisibleX`, while the slot is measured from a candle's left
		 * edge, so the half-candle correction has to be undone here. Without it
		 * every apply/report round-trip shifts the plot by `candleWidth / 2`.
		 *
		 * The slot itself is fractional whenever the anchor time falls between
		 * two candles of this timeframe, which is the normal case for
		 * cross-timeframe sync; the plot is placed at that exact position so the
		 * requested time window is preserved.
		 */
		this.offsetX =
			this.#canvas.width * anchorXRatio -
			this.getTimeDeltaInCandleSlots(anchorTime) * this.candleSpacing -
			this.candleWidth / 2;
		this.isFollowingLatest = this.isWithinAutoFollowThreshold();
	}

	setCursorState(cursor: ChartCursorState) {
		if (this.candles.length === 0 || !Number.isFinite(cursor.time) || !Number.isFinite(cursor.price)) {
			return null;
		}

		const candleIndex = this.getCandleIndexByTime(cursor.time);
		const candle = this.candles[candleIndex];

		if (!candle) {
			return null;
		}

		return {
			candle,
			candleIndex,
			x: this.getCandleCenterX(candleIndex),
			y: this.getPriceY(cursor.price, this.#canvas.height),
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

	resetView() {
		this.zoomX = 1;
		this.offsetX = this.getDefaultOffsetX();
		this.initializeViewport();
		this.isFollowingLatest = this.isWithinAutoFollowThreshold();
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

		const options = {
			ctx,
			chartWidth,
			chartHeight,
		};
		this.drawAskPriceLine(options);
		this.drawBidPriceLine(options);
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

	private drawPriceLine({
		ctx,
		chartWidth,
		chartHeight,
		price,
		color,
		opacity,
		lineWidth,
		dash,
	}: DrawPriceLineOptions & {
		price: number;
		color: string;
		opacity: number;
		lineWidth: number;
		dash: number[];
	}) {
		const lineY = this.getPriceY(normalizePrice(price), chartHeight);
		ctx.save();
		ctx.globalAlpha = opacity;
		ctx.strokeStyle = color;
		ctx.lineWidth = lineWidth;
		ctx.setLineDash(dash);
		ctx.beginPath();
		ctx.moveTo(0, lineY);
		ctx.lineTo(chartWidth, lineY);
		ctx.stroke();
		ctx.restore();
	}

	drawBidPriceLine({ ctx, chartWidth, chartHeight }: DrawPriceLineOptions) {
		const latestCandle = this.candles.at(-1);

		if (!latestCandle || !CHART_CONFIG.candles.liveBidPriceLine.visible) {
			return;
		}

		this.drawPriceLine({
			ctx,
			chartWidth,
			chartHeight,
			price: latestCandle.close,
			color: this.getBidPriceLineColor(latestCandle),
			opacity: CHART_CONFIG.candles.liveBidPriceLine.opacity,
			lineWidth: CHART_CONFIG.candles.liveBidPriceLine.width,
			dash: CHART_CONFIG.candles.liveBidPriceLine.dash,
		});
	}

	drawAskPriceLine({ ctx, chartWidth, chartHeight }: DrawPriceLineOptions) {
		const latestCandle = this.candles.at(-1);

		if (!latestCandle || !CHART_CONFIG.candles.liveAskPriceLine.visible || latestCandle.ask == null) {
			return;
		}

		this.drawPriceLine({
			ctx,
			chartWidth,
			chartHeight,
			price: latestCandle.ask,
			color: this.getAskPriceLineColor(latestCandle),
			opacity: CHART_CONFIG.candles.liveAskPriceLine.opacity,
			lineWidth: CHART_CONFIG.candles.liveAskPriceLine.width,
			dash: CHART_CONFIG.candles.liveAskPriceLine.dash,
		});
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
		const fallbackPercent = this.getInitialFallbackPercent();
		const rawPriceRange = normalizePrice(maxPrice - minPrice);
		const fallbackRange = Math.max(Math.abs((minPrice + maxPrice) / 2) * fallbackPercent, 0.00001);
		const effectivePriceRange = Math.max(rawPriceRange, fallbackRange);
		const verticalPadding = effectivePriceRange * 0.2;

		return effectivePriceRange + verticalPadding;
	}

	private getInitialFallbackPercent() {
		const timeframeMs = this.detectCandleTimeframeMs();

		if (timeframeMs <= MINUTE_MS) {
			return 0.0025;
		}

		if (timeframeMs <= 5 * MINUTE_MS) {
			return 0.0035;
		}

		if (timeframeMs <= 15 * MINUTE_MS) {
			return 0.005;
		}

		if (timeframeMs <= HOUR_MS) {
			return 0.0075;
		}

		if (timeframeMs < DAY_MS) {
			return 0.01;
		}

		return 0.01;
	}

	private detectCandleTimeframeMs() {
		if (this.candles.length < 2) {
			return 15 * MINUTE_MS;
		}

		const diffs: number[] = [];

		for (let i = 1; i < Math.min(this.candles.length, 10); i++) {
			diffs.push(this.candles[i].time - this.candles[i - 1].time);
		}

		diffs.sort((a, b) => a - b);

		return diffs[Math.floor(diffs.length / 2)];
	}

	private hasUsableTimeframe() {
		return this.detectCandleTimeframeMs() > 0;
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

	private getRightmostVisibleTime() {
		const lastVisibleIndex = this.getRightmostVisibleIndex();
		return this.candles[lastVisibleIndex]?.time ?? 0;
	}

	private getRightmostVisibleX() {
		const lastVisibleIndex = this.getRightmostVisibleIndex();
		if (this.#canvas.width <= 0) {
			return 1;
		}

		/**
		 * Panning can push the anchor candle outside the plot, but the contract
		 * for `rightmostVisibleX` is a normalized 0..1 screen position, so the
		 * reported value is clamped to the visible range.
		 */
		const normalizedX = this.getCandleCenterX(lastVisibleIndex) / this.#canvas.width;

		return Math.max(0, Math.min(normalizedX, 1));
	}

	private getRightmostVisibleIndex() {
		if (this.candles.length === 0) {
			return 0;
		}

		/**
		 * The rightmost visible candle is the last one whose right edge still
		 * falls inside the plot, which puts its index at
		 * `(width - offsetX - candleWidth) / spacing`.
		 */
		return this.clampCandleIndex(
			Math.round((this.#canvas.width - this.offsetX - this.candleWidth) / this.candleSpacing),
		);
	}

	private getRightEdgeTime() {
		const lastCandle = this.candles.at(-1);
		const timeFrameMs = this.detectCandleTimeframeMs();

		if (!lastCandle || timeFrameMs <= 0) {
			return 0;
		}

		const slotsFromLastCandle = this.getRightEdgeCandleIndex() - (this.candles.length - 1);

		return lastCandle.time + slotsFromLastCandle * timeFrameMs;
	}

	private getVisibleDurationMs() {
		const timeFrameMs = this.detectCandleTimeframeMs();

		if (timeFrameMs <= 0 || this.candleSpacing <= 0) {
			return 0;
		}

		/**
		 * `candleSpacing` is measured in pixels, so the plot width converts to
		 * time through the candle timeframe rather than directly. Using the pixel
		 * span as milliseconds would report a 15m chart as a sub-second window
		 * and break cross-timeframe syncing.
		 */
		return (this.#canvas.width * timeFrameMs) / this.candleSpacing;
	}

	private getTimeDeltaInCandleSlots(targetTime: number) {
		const firstCandle = this.candles[0];
		if (!firstCandle || this.detectCandleTimeframeMs() <= 0) {
			return 0;
		}

		return (targetTime - firstCandle.time) / this.detectCandleTimeframeMs();
	}

	/**
	 * Resolves a timestamp to the candle whose span contains it.
	 *
	 * Synced cursors arrive from charts of a different timeframe, so the
	 * incoming timestamp is not a multiple of this chart's timeframe away from
	 * the first candle. Dividing by this chart's timeframe to derive an index
	 * therefore drifts by the timeframe ratio, and clamping that drift pinned
	 * the crosshair to the last candle. Binary searching the real candle times
	 * is correct for any incoming timestamp and any target timeframe.
	 *
	 * Containment is measured against the candle's open time, so a finer
	 * timeframe hovering partway through a coarse candle snaps to the coarse
	 * candle that is actually covering that moment, rather than to whichever
	 * neighbour happens to start closest to the timestamp.
	 */
	private getCandleIndexByTime(targetTime: number) {
		if (this.candles.length === 0 || !Number.isFinite(targetTime)) {
			return 0;
		}

		const lastIndex = this.candles.length - 1;
		const firstTime = this.candles[0]?.time ?? 0;
		const lastTime = this.candles[lastIndex]?.time ?? 0;
		const timeFrameMs = this.detectCandleTimeframeMs();

		if (targetTime <= firstTime) {
			return 0;
		}

		if (targetTime >= lastTime + Math.max(timeFrameMs, 0)) {
			return lastIndex;
		}

		const insertionIndex = this.findCandleIndexAtOrAfter(targetTime);

		/** Exact open-time match, which is the common same-timeframe case. */
		if (this.candles[insertionIndex]?.time === targetTime) {
			return insertionIndex;
		}

		const previousIndex = Math.max(0, insertionIndex - 1);
		const previousTime = this.candles[previousIndex]?.time ?? 0;
		const nextTime = this.candles[insertionIndex]?.time ?? 0;

		/** The timestamp sits between two opens, so prefer the candle covering it. */
		if (targetTime < previousTime + timeFrameMs) {
			return previousIndex;
		}

		/**
		 * Series with gaps have no candle covering the timestamp, so fall back
		 * to whichever neighbour is closest in time.
		 */
		return targetTime - previousTime <= nextTime - targetTime ? previousIndex : insertionIndex;
	}

	/**
	 * Binary search for the first candle whose time is greater than or equal to
	 * `targetTime`, falling back to the last index when every candle is earlier.
	 */
	private findCandleIndexAtOrAfter(targetTime: number) {
		let low = 0;
		let high = this.candles.length - 1;

		while (low < high) {
			const middle = Math.floor((low + high) / 2);
			const middleTime = this.candles[middle]?.time ?? 0;

			if (middleTime < targetTime) {
				low = middle + 1;
			} else {
				high = middle;
			}
		}

		return low;
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

	private getBidPriceLineColor(candle: Candle) {
		return candle.close >= candle.open
			? CHART_CONFIG.candles.liveBidPriceLine.bullishColor
			: CHART_CONFIG.candles.liveBidPriceLine.bearishColor;
	}

	private getAskPriceLineColor(candle: Candle) {
		return candle.close >= candle.open
			? CHART_CONFIG.candles.liveAskPriceLine.bullishColor
			: CHART_CONFIG.candles.liveAskPriceLine.bearishColor;
	}
}
