import { CrosshairLayer } from "./canvas/layers/CrosshairLayer";
import { ExistingCandlesLayer } from "./canvas/layers/ExistingCandlesLayer";
import { TradeLayer } from "./canvas/layers/TradeLayer/TradeLayer";
import { TradeLayerEvents } from "./canvas/layers/TradeLayer/TradeLayerEvents";
import type { Candle } from "./models/Candle";
import type { OpenTrade } from "./models/Trade";
import "./main.css";
import { AxisLayerY } from "./canvas/layers/AxisLayerY/AxisLayerY";
import type { TradeHandleType } from "./canvas/layers/TradeLayer/TradeLayer.types";
import { CHART_CONFIG } from "./config/chartConfig";

const candleCanvas = document.querySelector<HTMLCanvasElement>("#chart");
const overlayCanvas = document.querySelector<HTMLCanvasElement>("#overlay");
const tradesCanvas = document.querySelector<HTMLCanvasElement>("#trades");
const axisYCanvas = document.querySelector<HTMLCanvasElement>("#axis-y");
const activeSymbol = "GBPJPY";

if (!candleCanvas || !overlayCanvas || !tradesCanvas || !axisYCanvas) {
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

	axisYCanvas.width = CHART_CONFIG.axis.axisY.width;
	axisYCanvas.height = height;
};

resizeCanvases();

/**
 * =========================
 * Layers
 * =========================
 */
let candleLayer: ExistingCandlesLayer | null = null;
let tradeLayer: TradeLayer | null = null;
let tradeLayerEvents: TradeLayerEvents | null = null;
let axisLayerY: AxisLayerY | null = null;

const renderAllLayers = () => {
	if (!candleLayer) {
		return;
	}
	candleLayer.render();
	tradeLayer?.setViewport(candleLayer.viewport);
	tradeLayer?.render();
	axisLayerY?.setViewport(candleLayer.viewport);
	axisLayerY?.render();
	crosshairLayer.render();
};

const crosshairLayer = new CrosshairLayer({
	canvas: overlayCanvas,
});

const handleTradeModified = async ({ ticket, sl, tp }: { ticket: number; sl?: number | null; tp?: number | null }) => {
	tradeLayer?.setIsDragging(false);
	const body = {
		ticket,
		...(tp !== undefined ? { tp } : {}),
		...(sl !== undefined ? { sl } : {}),
	};
	try {
		const response = await fetch(`https://api-tradingreload.pradeepjadhav.com/trade/modify`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
			cache: "no-store",
		});

		if (!response.ok) {
			throw new Error(`Failed to modify the trade: ${response.status}`);
		}

		const data = await response.json();
		console.log(data);
	} catch (error) {
		console.error("Failed to modify the trade", error);
	}
};

const handleTPSLChange = ({ trade, type, price }: { trade: OpenTrade; type: TradeHandleType; price: number }) => {
	if (!tradeLayer) {
		return;
	}

	tradeLayer.setIsDragging(true);
	const updatedTrades = tradeLayer.trades.map((currentTrade) => {
		if (currentTrade.ticket !== trade.ticket) {
			return currentTrade;
		}

		if (type === "stopLoss") {
			return {
				...currentTrade,
				sl: price,
			};
		}

		if (type === "takeProfit") {
			return {
				...currentTrade,
				tp: price,
			};
		}

		return currentTrade;
	});

	tradeLayer.setTrades(updatedTrades);
	tradeLayer.render();
};

/**
 * =========================
 * Load Historical Candles
 * =========================
 */
const loadCandles = async () => {
	try {
		const response = await fetch(`http://localhost:5000/candles?symbol=${activeSymbol}&tf=15m&limit=500`);

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

		tradeLayer = new TradeLayer({
			canvas: tradesCanvas,
		});

		axisLayerY = new AxisLayerY({
			canvas: axisYCanvas,
		});

		tradeLayerEvents = new TradeLayerEvents({
			canvas: tradesCanvas,
			getHandleHitboxes: () => tradeLayer?.handleHitboxes ?? [],
			onDrag: handleTPSLChange,
			onTradeModified: handleTradeModified,
		});

		/**
		 * Initial render
		 */
		renderAllLayers();

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

	socket.addEventListener("message", (event: MessageEvent) => {
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
			tradeLayer.renderLiveFeed();
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
	const socket = new WebSocket(`ws://localhost:5000/ws/candles?symbol=${activeSymbol}&tf=15m`);

	socket.addEventListener("message", (event: MessageEvent) => {
		if (!candleLayer || !tradeLayer) {
			return;
		}

		try {
			const data = JSON.parse(event.data);

			if (!data.candle) {
				return;
			}

			candleLayer.updateLiveCandle(data.candle);
			tradeLayer.setLiveCandle(candleLayer.liveCandle);
			renderAllLayers();
		} catch (error) {
			console.error("Failed to parse websocket candle", error);
		}
	});

	socket.addEventListener("error", (error) => {
		console.error("WebSocket error", error);
	});
};

loadCandles();

const handleWheelEvent = (event: WheelEvent) => {
	if (!candleLayer || !tradeLayer) {
		return;
	}
	tradeLayerEvents?.handlePointerEvent(event);
	event.preventDefault();
	const zoomDelta = event.deltaY < 0 ? 1 : -1;
	if (event.ctrlKey || event.metaKey) {
		candleLayer.zoomVertically(zoomDelta);
	} else {
		candleLayer.zoomHorizontally(zoomDelta);
	}
	renderAllLayers();
};

const handlePointerDownEvent = (event: PointerEvent) => {
	if (tradeLayerEvents?.handlePointerEvent(event)) {
		return;
	}

	isDragging = true;
	lastMouseX = event.clientX;
	lastMouseY = event.clientY;
};

const handlePointerMoveEvent = (event: PointerEvent) => {
	tradeLayerEvents?.handlePointerEvent(event);

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

	renderAllLayers();
};

const handlePointerUpEvent = (event: PointerEvent) => {
	isDragging = false;
	tradeLayerEvents?.handlePointerEvent(event);
};

const handlePointerEnterEvent = (event: PointerEvent) => {
	tradeLayerEvents?.handlePointerEvent(event);
};

const handlePointerLeaveEvent = () => {
	crosshairLayer.hide();
	crosshairLayer.render();
};

const handleResizeEvent = () => {
	resizeCanvases();
	candleLayer?.render();
	if (candleLayer && tradeLayer) {
		tradeLayer.setViewport(candleLayer.viewport);
		tradeLayer.render();
	}
	crosshairLayer.render();
};

let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

window.addEventListener("pointerdown", handlePointerDownEvent);
window.addEventListener("pointerup", handlePointerUpEvent);
window.addEventListener("pointermove", handlePointerMoveEvent);
window.addEventListener("pointerenter", handlePointerEnterEvent);
window.addEventListener("pointerleave", handlePointerLeaveEvent);
window.addEventListener("wheel", handleWheelEvent, { passive: false });
window.addEventListener("resize", handleResizeEvent);
