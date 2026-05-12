import { ExistingCandlesLayer } from "./canvas/layers/ExistingCandlesLayer";

import { CrosshairLayer } from "./canvas/layers/CrosshairLayer";

import type { Candle } from "./models/Candle";

import "./main.css";

const candleCanvas = document.querySelector<HTMLCanvasElement>("#chart");

const overlayCanvas = document.querySelector<HTMLCanvasElement>("#overlay");

if (!candleCanvas || !overlayCanvas) {
	throw new Error("Canvas not found");
}

/**
 * =========================
 * Resize Canvases
 * =========================
 */
const resizeCanvases = () => {
	const width = window.innerWidth;

	const height = window.innerHeight;

	candleCanvas.width = width;

	candleCanvas.height = height;

	overlayCanvas.width = width;

	overlayCanvas.height = height;
};

resizeCanvases();

/**
 * =========================
 * Layers
 * =========================
 */
let candleLayer: ExistingCandlesLayer | null = null;

const crosshairLayer = new CrosshairLayer({
	canvas: overlayCanvas,
});

/**
 * =========================
 * Load Historical Candles
 * =========================
 */
const loadCandles = async () => {
	try {
		const response = await fetch(
			"http://localhost:5000/candles?symbol=XAUUSD&tf=1m&limit=500",
		);

		if (!response.ok) {
			throw new Error(`Failed to fetch candles: ${response.status}`);
		}

		const data = await response.json();
		const candles: Candle[] = data.candles ?? [];

		candleLayer = new ExistingCandlesLayer({
			canvas: candleCanvas,

			candles,

			baseCandleWidth: 8,

			baseCandleGap: 4,
		});

		/**
		 * Initial render
		 */
		candleLayer.render();

		crosshairLayer.render();

		/**
		 * Start websocket feed
		 */
		initializeLiveFeed();
	} catch (error) {
		console.error("Failed to load candles", error);
	}
};

/**
 * =========================
 * Demo Live Candle Feed
 * =========================
 *
 * NOTE:
 * This is ONLY for local demo/testing.
 *
 * Actual websocket/fetch logic
 * should live inside React app,
 * not inside chart library.
 */
const initializeLiveFeed = () => {
	const socket = new WebSocket(
		"ws://localhost:5000/ws/candles?symbol=XAUUSD&tf=1m",
	);

	socket.addEventListener("message", (event) => {
		if (!candleLayer) {
			return;
		}

		try {
			const data = JSON.parse(event.data);

			if (!data.candle) {
				return;
			}

			candleLayer.updateLiveCandle(data.candle);

			candleLayer.render();
		} catch (error) {
			console.error("Failed to parse websocket candle", error);
		}
	});

	socket.addEventListener("error", (error) => {
		console.error("WebSocket error", error);
	});
};

loadCandles();

/**
 * =========================
 * Zoom Handling
 * =========================
 */
overlayCanvas.addEventListener(
	"wheel",
	(event) => {
		if (!candleLayer) {
			return;
		}

		event.preventDefault();

		const zoomDelta = event.deltaY < 0 ? 1 : -1;

		/**
		 * Ctrl/Cmd + Wheel
		 * Vertical zoom
		 */
		if (event.ctrlKey || event.metaKey) {
			candleLayer.zoomVertically(zoomDelta);
		} else {
			/**
			 * Default wheel
			 * Horizontal zoom
			 */
			candleLayer.zoomHorizontally(zoomDelta);
		}

		candleLayer.render();
	},
	{
		passive: false,
	},
);

/**
 * =========================
 * Panning
 * =========================
 */
let isDragging = false;

let lastMouseX = 0;

let lastMouseY = 0;

overlayCanvas.addEventListener("mousedown", (event) => {
	isDragging = true;

	lastMouseX = event.clientX;

	lastMouseY = event.clientY;
});

window.addEventListener("mouseup", () => {
	isDragging = false;
});

window.addEventListener("mousemove", (event) => {
	/**
	 * Crosshair
	 */
	crosshairLayer.updateMousePosition(
		event.clientX,

		event.clientY,
	);

	crosshairLayer.render();

	/**
	 * Panning
	 */
	if (!isDragging || !candleLayer) {
		return;
	}

	const deltaX = event.clientX - lastMouseX;

	const deltaY = event.clientY - lastMouseY;

	lastMouseX = event.clientX;

	lastMouseY = event.clientY;

	candleLayer.panHorizontally(deltaX);

	candleLayer.panVertically(deltaY);

	candleLayer.render();
});

/**
 * =========================
 * Hide Crosshair
 * =========================
 */
overlayCanvas.addEventListener("mouseleave", () => {
	crosshairLayer.hide();

	crosshairLayer.render();
});

/**
 * =========================
 * Resize Handling
 * =========================
 */
window.addEventListener("resize", () => {
	resizeCanvases();
	candleLayer?.render();
	crosshairLayer.render();
});
