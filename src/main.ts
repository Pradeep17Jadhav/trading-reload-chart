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

	baseCandleWidth: 8,

	candleGap: 4,
});

layer.render();

/**
 * =========================
 * Horizontal / Vertical Zoom
 * =========================
 */
canvas.addEventListener(
	"wheel",
	(event) => {
		event.preventDefault();

		const zoomDelta = event.deltaY < 0 ? 1 : -1;

		/**
		 * Ctrl/Cmd + Wheel
		 * Vertical zoom
		 */
		if (event.ctrlKey || event.metaKey) {
			layer.zoomVertically(zoomDelta);

			return;
		}

		/**
		 * Default wheel
		 * Horizontal zoom
		 */
		layer.zoomHorizontally(zoomDelta);
	},
	{
		passive: false,
	},
);

/**
 * =========================
 * Horizontal Panning
 * =========================
 */
let isDragging = false;

let lastMouseX = 0;

canvas.addEventListener("mousedown", (event) => {
	isDragging = true;

	lastMouseX = event.clientX;
});

window.addEventListener("mouseup", () => {
	isDragging = false;
});

window.addEventListener("mousemove", (event) => {
	if (!isDragging) {
		return;
	}

	const deltaX = event.clientX - lastMouseX;

	lastMouseX = event.clientX;

	layer.pan(deltaX);
});

/**
 * =========================
 * Resize Handling
 * =========================
 */
window.addEventListener("resize", () => {
	canvas.width = window.innerWidth;

	canvas.height = window.innerHeight;

	layer.render();
});
