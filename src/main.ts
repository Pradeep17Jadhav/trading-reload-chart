import { AxisLayerX } from "./canvas/layers/AxisLayerX/AxisLayerX";
import { AxisLayerY } from "./canvas/layers/AxisLayerY/AxisLayerY";
import { CrosshairLayer } from "./canvas/layers/CrosshairLayer";
import { ExistingCandlesLayer } from "./canvas/layers/ExistingCandlesLayer";
import { TradeLayer } from "./canvas/layers/TradeLayer/TradeLayer";
import type { TradeHandleType, TradeProtectionHandleType } from "./canvas/layers/TradeLayer/TradeLayer.types";
import { TradeLayerEvents } from "./canvas/layers/TradeLayer/TradeLayerEvents";
import { CHART_CONFIG } from "./config/chartConfig";
import type { Candle } from "./models/Candle";
import type { OpenTrade } from "./models/Trade";
import "./main.css";

const API_BASE_URL = "https://api-tradingreload.pradeepjadhav.com";
const WS_BASE_URL = "wss://api-tradingreload.pradeepjadhav.com";

const activeSymbol = "GBPJPY";

/**
 * Broker (MT4/MT5) sends candle times in UTC+3 server time encoded as
 * plain Unix seconds. Convert to true UTC milliseconds by multiplying
 * by 1000 and stripping the 3-hour broker timezone offset.
 */
const BROKER_TZ_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC+3 → UTC

const toMs = (candle: Candle): Candle =>
	candle.time < 1e12 ? { ...candle, time: candle.time * 1000 - BROKER_TZ_OFFSET_MS } : candle;

const chartStack = getRequiredElement<HTMLDivElement>("#chart-stack");
const candleCanvas = getRequiredElement<HTMLCanvasElement>("#chart");
const overlayCanvas = getRequiredElement<HTMLCanvasElement>("#overlay");
const tradesCanvas = getRequiredElement<HTMLCanvasElement>("#trades");
const axisXCanvas = getRequiredElement<HTMLCanvasElement>("#axis-x");
const axisYCanvas = getRequiredElement<HTMLCanvasElement>("#axis-y");

type CanvasPoint = {
	x: number;
	y: number;
};

type TradeModifiedPayload = {
	ticket: number;
	sl?: number | null;
	tp?: number | null;
};

type TPSLChangePayload = {
	trade: OpenTrade;
	type: TradeHandleType;
	price: number;
};

type MissingProtectionDragPayload = {
	trade: OpenTrade;
	type: TradeProtectionHandleType;
	price: number;
};

function getRequiredElement<T extends Element>(selector: string): T {
	const element = document.querySelector<T>(selector);

	if (!element) {
		throw new Error(`Required element not found: ${selector}`);
	}

	return element;
}

/**
 * =========================
 * Resize Canvases
 * =========================
 */
const resizeCanvases = () => {
	const { plotWidth, plotHeight, axisYWidth, axisXHeight } = getCanvasLayoutSize();

	setCanvasSize(candleCanvas, plotWidth, plotHeight);
	setCanvasSize(overlayCanvas, plotWidth, plotHeight);
	setCanvasSize(tradesCanvas, plotWidth, plotHeight);
	setCanvasSize(axisXCanvas, plotWidth, axisXHeight);
	setCanvasSize(axisYCanvas, axisYWidth, plotHeight);
};

const getCanvasLayoutSize = () => {
	const axisYWidth = CHART_CONFIG.axis.axisY.width;
	const axisXHeight = CHART_CONFIG.axis.axisX.height;

	return {
		axisYWidth,
		axisXHeight,
		plotWidth: window.innerWidth - axisYWidth,
		plotHeight: Math.max(0, window.innerHeight - axisXHeight),
	};
};

const setCanvasSize = (canvas: HTMLCanvasElement, width: number, height: number) => {
	canvas.width = width;
	canvas.height = height;
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
let axisLayerX: AxisLayerX | null = null;
let axisLayerY: AxisLayerY | null = null;

const crosshairLayer = new CrosshairLayer({
	canvas: overlayCanvas,
});

const renderAxisLayers = () => {
	if (!candleLayer) {
		return;
	}

	axisLayerX?.setCandles(candleLayer.candles);
	axisLayerX?.setViewport(candleLayer.viewport);
	axisLayerX?.render();

	axisLayerY?.setViewport(candleLayer.viewport);
	axisLayerY?.render();
};

const renderAllLayers = () => {
	if (!candleLayer) {
		return;
	}

	candleLayer.render();

	tradeLayer?.setViewport(candleLayer.viewport);
	tradeLayer?.render();

	renderAxisLayers();
	crosshairLayer.render();
};

const getCanvasPoint = (canvas: HTMLCanvasElement, event: PointerEvent | MouseEvent): CanvasPoint => {
	const rect = canvas.getBoundingClientRect();
	const scaleX = canvas.width / rect.width;
	const scaleY = canvas.height / rect.height;

	return {
		x: (event.clientX - rect.left) * scaleX,
		y: (event.clientY - rect.top) * scaleY,
	};
};

const updateCrosshairAndAxisLabels = (event: PointerEvent | MouseEvent) => {
	if (!candleLayer) {
		updateCrosshairWithoutCandles(event);
		return;
	}

	const pointer = getCanvasPoint(overlayCanvas, event);
	const nearestCandleIndex = candleLayer.getNearestCandleIndexByX(pointer.x);
	const nearestCandle = getCandleByIndex(nearestCandleIndex);
	const snapX = getCrosshairSnapX(pointer.x, nearestCandleIndex);

	updateCrosshairPosition(event, snapX);
	updateAxisCrosshairLabels(nearestCandle);

	renderAxisLayers();
	crosshairLayer.render();
};

const updateCrosshairWithoutCandles = (event: PointerEvent | MouseEvent) => {
	crosshairLayer.updateMousePosition(event.clientX, event.clientY);
	crosshairLayer.render();
};

const getCandleByIndex = (candleIndex: number | null) => {
	if (!candleLayer || candleIndex === null) {
		return null;
	}

	return candleLayer.candles[candleIndex] ?? null;
};

const getCrosshairSnapX = (pointerX: number, candleIndex: number | null) => {
	if (!candleLayer || candleIndex === null) {
		return pointerX;
	}

	return candleLayer.getCandleCenterX(candleIndex);
};

const updateCrosshairPosition = (event: PointerEvent | MouseEvent, snapX: number) => {
	crosshairLayer.updateMousePosition(event.clientX, event.clientY, {
		snapX,
	});
};

const updateAxisCrosshairLabels = (nearestCandle: Candle | null) => {
	if (!candleLayer) {
		return;
	}

	const crosshairPrice = candleLayer.getPriceAtY(crosshairLayer.mouseY);

	axisLayerY?.setCrosshair({
		visible: true,
		y: crosshairLayer.mouseY,
		price: crosshairPrice,
	});

	axisLayerX?.setCrosshair({
		visible: true,
		x: crosshairLayer.mouseX,
		candle: nearestCandle,
	});
};

const hideCrosshairAndAxisLabels = () => {
	crosshairLayer.hide();
	axisLayerX?.hideCrosshair();
	axisLayerY?.hideCrosshair();

	renderAxisLayers();
	crosshairLayer.render();
};

const handleTradeModified = async ({ ticket, sl, tp }: TradeModifiedPayload) => {
	tradeLayer?.setIsDragging(false);

	const body = createTradeModifyRequestBody({ ticket, sl, tp });

	try {
		const response = await fetch(`${API_BASE_URL}/trade/modify`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
			cache: "no-store",
		});

		if (!response.ok) {
			throw new Error(`Failed to modify the trade: ${response.status}`);
		}

		const data = await response.json();

		updateTradesFromModifyResponse({
			data,
			fallbackPayload: body,
		});

		console.log(data);
	} catch (error) {
		console.error("Failed to modify the trade", error);
	}
};

const createTradeModifyRequestBody = ({ ticket, sl, tp }: TradeModifiedPayload) => ({
	ticket,
	...(tp !== undefined ? { tp } : {}),
	...(sl !== undefined ? { sl } : {}),
});

const updateTradesFromModifyResponse = ({
	data,
	fallbackPayload,
}: {
	data: unknown;
	fallbackPayload: TradeModifiedPayload;
}) => {
	if (!tradeLayer) {
		return;
	}

	const responseTrade = getModifiedTradeFromResponse(data);
	const updatedTrades = tradeLayer.trades.map((trade) => {
		if (responseTrade && trade.ticket === responseTrade.ticket) {
			return {
				...trade,
				...responseTrade,
			};
		}

		if (trade.ticket !== fallbackPayload.ticket) {
			return trade;
		}

		return {
			...trade,
			...(fallbackPayload.sl !== undefined ? { sl: fallbackPayload.sl } : {}),
			...(fallbackPayload.tp !== undefined ? { tp: fallbackPayload.tp } : {}),
		};
	});

	tradeLayer.setTrades(updatedTrades);
	tradeLayer.clearTemporaryProtectionDrag();
	tradeLayer.render();
};

const getModifiedTradeFromResponse = (data: unknown): Partial<OpenTrade> | null => {
	if (!data || typeof data !== "object") {
		return null;
	}

	const responseData = data as {
		ticket?: number;
		sl?: number | null;
		tp?: number | null;
		trade?: Partial<OpenTrade>;
		position?: Partial<OpenTrade>;
		order?: Partial<OpenTrade>;
	};

	if (responseData.ticket !== undefined) {
		return {
			ticket: responseData.ticket,
			...(responseData.sl !== undefined ? { sl: responseData.sl } : {}),
			...(responseData.tp !== undefined ? { tp: responseData.tp } : {}),
		};
	}

	return responseData.trade ?? responseData.position ?? responseData.order ?? null;
};

const handleTPSLChange = ({ trade, type, price }: TPSLChangePayload) => {
	if (!tradeLayer) {
		return;
	}

	tradeLayer.setIsDragging(true);

	const updatedTrades = tradeLayer.trades.map((currentTrade) =>
		updateTradeTPSL({
			currentTrade,
			targetTrade: trade,
			type,
			price,
		}),
	);

	tradeLayer.setTrades(updatedTrades);
	tradeLayer.render();
};

const handleMissingProtectionDrag = ({ trade, type, price }: MissingProtectionDragPayload) => {
	if (!tradeLayer || !tradeLayer.viewport) {
		return;
	}

	tradeLayer.setIsDragging(true);
	tradeLayer.setTemporaryProtectionDrag({
		visible: true,
		trade,
		type,
		price,
		viewport: tradeLayer.viewport,
	});
	tradeLayer.render();
};

const handleMissingProtectionDragEnd = ({ trade, type, price }: MissingProtectionDragPayload) => {
	tradeLayer?.setIsDragging(false);

	handleTradeModified({
		ticket: trade.ticket,
		...(type === "stopLoss" ? { sl: price } : {}),
		...(type === "takeProfit" ? { tp: price } : {}),
	});
};

const handleMissingProtectionDragCancel = () => {
	tradeLayer?.setIsDragging(false);
	tradeLayer?.clearTemporaryProtectionDrag();
	tradeLayer?.render();
};

const updateTradeTPSL = ({
	currentTrade,
	targetTrade,
	type,
	price,
}: {
	currentTrade: OpenTrade;
	targetTrade: OpenTrade;
	type: TradeHandleType;
	price: number;
}): OpenTrade => {
	if (currentTrade.ticket !== targetTrade.ticket) {
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
};

/**
 * =========================
 * Load Historical Candles
 * =========================
 */
const loadCandles = async () => {
	try {
		const candles = await fetchHistoricalCandles();

		initializeLayers(candles);
		renderAllLayers();
		await loadOpenTradesLiveFeed();
		initializeLiveFeed();
	} catch (error) {
		console.error("Failed to load candles", error);
	}
};

const fetchHistoricalCandles = async () => {
	const response = await fetch(`${API_BASE_URL}/candles?symbol=${activeSymbol}&tf=15m&limit=500`);

	if (!response.ok) {
		throw new Error(`Failed to fetch candles: ${response.status}`);
	}

	const data = await response.json();

	return ((data.candles ?? []) as Candle[]).map(toMs);
};

const initializeLayers = (candles: Candle[]) => {
	candleLayer = new ExistingCandlesLayer({
		canvas: candleCanvas,
		candles,
		baseCandleWidth: 8,
		baseCandleGap: 4,
	});

	tradeLayer = new TradeLayer({
		canvas: tradesCanvas,
	});

	axisLayerX = new AxisLayerX({
		canvas: axisXCanvas,
		candles,
	});

	axisLayerY = new AxisLayerY({
		canvas: axisYCanvas,
	});

	tradeLayerEvents = new TradeLayerEvents({
		canvas: tradesCanvas,
		getHandleHitboxes: () => tradeLayer?.handleHitboxes ?? [],
		onDrag: handleTPSLChange,
		onMissingProtectionDrag: handleMissingProtectionDrag,
		onMissingProtectionDragEnd: handleMissingProtectionDragEnd,
		onMissingProtectionDragCancel: handleMissingProtectionDragCancel,
		onTradeModified: handleTradeModified,
	});
};

const loadOpenTradesLiveFeed = async () => {
	const socket = new WebSocket(`${WS_BASE_URL}/ws/positions`);

	socket.addEventListener("message", handleOpenTradesMessage);
};

const handleOpenTradesMessage = (event: MessageEvent) => {
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
	const socket = new WebSocket(`${WS_BASE_URL}/ws/candles?symbol=${activeSymbol}&tf=15m`);

	socket.addEventListener("message", handleLiveCandleMessage);
	socket.addEventListener("error", handleLiveCandleError);
};

const handleLiveCandleMessage = (event: MessageEvent) => {
	if (!candleLayer || !tradeLayer) {
		return;
	}

	try {
		const data = JSON.parse(event.data);

		if (!data.candle) {
			return;
		}

		candleLayer.updateLiveCandle(toMs(data.candle));
		tradeLayer.setLiveCandle(candleLayer.liveCandle);

		renderAllLayers();
	} catch (error) {
		console.error("Failed to parse websocket candle", error);
	}
};

const handleLiveCandleError = (error: Event) => {
	console.error("WebSocket error", error);
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

	updateCrosshairAndAxisLabels(event);

	if (!isDragging || !candleLayer) {
		/**
		 * Panning
		 */
		return;
	}

	panChart(event);

	renderAllLayers();
	updateCrosshairAndAxisLabels(event);
};

const panChart = (event: PointerEvent) => {
	if (!candleLayer) {
		return;
	}

	const deltaX = event.clientX - lastMouseX;
	const deltaY = event.clientY - lastMouseY;

	lastMouseX = event.clientX;
	lastMouseY = event.clientY;

	candleLayer.panHorizontally(deltaX);
	candleLayer.panVertically(deltaY);
};

const handlePointerUpEvent = (event: PointerEvent) => {
	isDragging = false;
	tradeLayerEvents?.handlePointerEvent(event);
};

const handlePointerEnterEvent = (event: PointerEvent) => {
	tradeLayerEvents?.handlePointerEvent(event);
};

const handlePointerLeaveEvent = () => {
	hideCrosshairAndAxisLabels();
};

const handleResizeEvent = () => {
	resizeCanvases();
	renderAllLayers();
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
