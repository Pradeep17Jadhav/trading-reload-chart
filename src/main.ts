import { CrosshairLayer } from "./canvas/layers/CrosshairLayer";
import { ExistingCandlesLayer } from "./canvas/layers/ExistingCandlesLayer";
import { TradeLayer } from "./canvas/layers/TradeLayer/TradeLayer";
import type { Candle } from "./models/Candle";
import type { OpenTrade } from "./models/Trade";
import "./main.css";

const candleCanvas = document.querySelector<HTMLCanvasElement>("#chart");
const overlayCanvas = document.querySelector<HTMLCanvasElement>("#overlay");
const tradesCanvas = document.querySelector<HTMLCanvasElement>("#trades");

if (!candleCanvas || !overlayCanvas || !tradesCanvas) {
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
	tradesCanvas.width = width;
	tradesCanvas.height = height;
};
resizeCanvases();

/**
 * =========================
 * Layers
 * =========================
 */
let candleLayer: ExistingCandlesLayer | null = null;
let tradeLayer: TradeLayer | null = null;

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
		const response = await fetch("http://localhost:5000/candles?symbol=AUDJPY&tf=15m&limit=500");
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

		tradeLayer = new TradeLayer({ canvas: tradesCanvas });

		/**
		 * Initial render
		 */
		candleLayer.render();
		crosshairLayer.render();
		await loadOpenTradesLiveFeed();

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
 * Load Open Trades
 * =========================
 */
const loadOpenTradesLiveFeed = async () => {
	const socket = new WebSocket("ws://localhost:5000/ws/positions");
	socket.addEventListener("message", (event) => {
		if (!tradeLayer) {
			return;
		}
		try {
			const data = JSON.parse(event.data);
			if (!data.positions) {
				return;
			}
			const positions: OpenTrade[] = data.positions ?? [];
			tradeLayer.setTrades(positions);
			tradeLayer.render();
		} catch (error) {
			console.error("Failed to load open trades", error);
		}
	});
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
	const socket = new WebSocket("ws://localhost:5000/ws/candles?symbol=AUDJPY&tf=15m");
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
			tradeLayer.setViewport(candleLayer.viewport);
			tradeLayer.setLiveCandle(candleLayer.liveCandle);
			tradeLayer?.render();
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
		if (event.ctrlKey || event.metaKey) {
			/**
			 * Ctrl/Cmd + Wheel
			 * Vertical zoom
			 */
			candleLayer.zoomVertically(zoomDelta);
		} else {
			/**
			 * Default wheel
			 * Horizontal zoom
			 */
			candleLayer.zoomHorizontally(zoomDelta);
		}
		candleLayer.render();
		tradeLayer.setViewport(candleLayer.viewport);
		tradeLayer?.render();
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
	crosshairLayer.updateMousePosition(event.clientX, event.clientY);
	crosshairLayer.render();
	if (!isDragging || !candleLayer) {
		/**
		 * Panning
		 */
		return;
	}
	const deltaX = event.clientX - lastMouseX;
	const deltaY = event.clientY - lastMouseY;
	lastMouseX = event.clientX;
	lastMouseY = event.clientY;
	candleLayer.panHorizontally(deltaX);
	candleLayer.panVertically(deltaY);
	candleLayer.render();
	tradeLayer.setViewport(candleLayer.viewport);
	tradeLayer?.render();
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
	tradeLayer.setViewport(candleLayer.viewport);
	tradeLayer?.render();
	crosshairLayer.render();
});
