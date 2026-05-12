import { ExistingCandlesLayer } from "./canvas/layers/ExistingCandlesLayer";
import candles from "./demo/mock/candles.json";

const canvas = document.querySelector<HTMLCanvasElement>("#chart");

if (!canvas) {
	throw new Error("Canvas not found");
}

canvas.width = window.innerWidth;

canvas.height = window.innerHeight;

const layer = new ExistingCandlesLayer({
	canvas,

	candles,

	candleWidth: 10,

	candleGap: 2,
});

layer.render();
