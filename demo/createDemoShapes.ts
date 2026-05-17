import type { Shape } from "../src/canvas/layers/ShapesLayer/ShapesLayer.types";
import type { Candle } from "../src/models/Candle";

export const createDemoShapes = (candles: Candle[]): Shape[] => {
	if (candles.length < 80) {
		return [];
	}

	const candleAt = (offsetFromEnd: number) => candles[Math.max(0, candles.length - offsetFromEnd)];
	const priceAt = (candle: Candle, ratio: number) => candle.low + (candle.high - candle.low) * ratio;

	const trendStart = candleAt(70);
	const trendEnd = candleAt(55);
	const rectangleStart = candleAt(52);
	const rectangleEnd = candleAt(40);
	const pathA = candleAt(65);
	const pathB = candleAt(60);
	const pathC = candleAt(54);
	const pathD = candleAt(48);
	const fibStart = candleAt(38);
	const fibEnd = candleAt(25);
	const longEntry = candleAt(35);
	const longEnd = candleAt(25);
	const shortEntry = candleAt(1);
	const shortEnd = candleAt(10);

	return [
		{
			id: "demo-trendline-1",
			type: "trendline",
			vertices: [
				{ time: trendStart.time, price: priceAt(trendStart, 0.25) },
				{ time: trendEnd.time, price: priceAt(trendEnd, 0.75) },
			],
		},
		{
			id: "demo-rectangle-1",
			type: "rectangle",
			vertices: [
				{ time: rectangleStart.time, price: priceAt(rectangleStart, 0.85) },
				{ time: rectangleEnd.time, price: priceAt(rectangleEnd, 0.15) },
			],
		},
		{
			id: "demo-path-1",
			type: "path",
			vertices: [
				{ time: pathA.time, price: priceAt(pathA, 0.2) },
				{ time: pathB.time, price: priceAt(pathB, 0.8) },
				{ time: pathC.time, price: priceAt(pathC, 0.35) },
				{ time: pathD.time, price: priceAt(pathD, 0.7) },
			],
		},
		{
			id: "demo-fib-1",
			type: "fibRetracement",
			vertices: [
				{ time: fibStart.time, price: priceAt(fibStart, 0.9) },
				{ time: fibEnd.time, price: priceAt(fibEnd, 0.1) },
			],
		},
		{
			id: "demo-long-position-1",
			type: "longPosition",
			entry: {
				time: longEntry.time,
				price: longEntry.close,
			},
			endTime: longEnd.time,
			stopLossPercent: 0.25,
			takeProfitPercent: 0.375,
		},
		{
			id: "demo-short-position-1",
			type: "shortPosition",
			entry: {
				time: shortEntry.time,
				price: shortEntry.close,
			},
			endTime: shortEnd.time,
			stopLossPercent: 0.25,
			takeProfitPercent: 0.25,
		},
	];
};
