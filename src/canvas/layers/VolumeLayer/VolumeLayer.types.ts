import type { Candle } from "../../../models/Candle.types";

export type VolumeLayerOptions = {
	canvas: HTMLCanvasElement;
	candles: Candle[];
	bullishColor?: string;
	bearishColor?: string;
	opacity?: number;
	height?: number;
	bottomOffset?: number;
	minBarHeight?: number;
};

export type DrawVolumeBarsOptions = {
	ctx: CanvasRenderingContext2D;
	candles: Candle[];
	startIndex: number;
	maxVolume: number;
	chartHeight: number;
};

export type DrawSingleVolumeBarOptions = {
	ctx: CanvasRenderingContext2D;
	candle: Candle;
	candleX: number;
	maxVolume: number;
	chartHeight: number;
};
