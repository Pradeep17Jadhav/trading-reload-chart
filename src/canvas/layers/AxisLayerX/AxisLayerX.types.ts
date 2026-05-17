import type { Candle } from "../../../models/Candle.types";

export type AxisLayerXOptions = {
	canvas: HTMLCanvasElement;
	candles: Candle[];
};

export type AxisLayerXCrosshair = {
	visible: boolean;
	x: number;
	candle: Candle | null;
};
