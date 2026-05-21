import type { Candle } from "../../models/Candle.types";

export type ExistingCandlesLayerOptions = {
	canvas: HTMLCanvasElement;
	candles: Candle[];
	baseCandleWidth?: number;
	baseCandleGap?: number;
	bullishColor?: string;
	bearishColor?: string;
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

export type CandleYCoordinates = {
	openY: number;
	closeY: number;
	highY: number;
	lowY: number;
};

export type DrawCandlesOptions = {
	ctx: CanvasRenderingContext2D;
	candles: Candle[];
	startIndex: number;
	chartHeight: number;
};

export type DrawSingleCandleOptions = CandleYCoordinates & {
	ctx: CanvasRenderingContext2D;
	candleX: number;
	candleColor: string;
};

export type DrawPriceLineOptions = {
	ctx: CanvasRenderingContext2D;
	chartWidth: number;
	chartHeight: number;
};
