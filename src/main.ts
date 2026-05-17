import { AxisLayerX } from "./canvas/layers/AxisLayerX/AxisLayerX";
import { AxisLayerY } from "./canvas/layers/AxisLayerY/AxisLayerY";
import { CrosshairLayer } from "./canvas/layers/CrosshairLayer";
import { ExistingCandlesLayer } from "./canvas/layers/ExistingCandlesLayer";
import { ShapesLayer } from "./canvas/layers/ShapesLayer/ShapesLayer";
import type {
	Shape,
	ShapeAddedPayload,
	ShapeModifiedPayload,
	ShapeToolType,
} from "./canvas/layers/ShapesLayer/ShapesLayer.types";

import { TradeLayer } from "./canvas/layers/TradeLayer/TradeLayer";
import type {
	PastTradeIndicator,
	TradeHandleType,
	TradeProtectionHandleType,
} from "./canvas/layers/TradeLayer/TradeLayer.types";
import { TradeLayerEvents } from "./canvas/layers/TradeLayer/TradeLayerEvents";
import { VolumeLayer } from "./canvas/layers/VolumeLayer/VolumeLayer";
import { CHART_CONFIG } from "./config/chartConfig";
import type { Candle } from "./models/Candle";
import type { OpenTrade, TradeType } from "./models/Trade";
import "./main.css";

const API_BASE_URL = "https://api-tradingreload.pradeepjadhav.com";
const WS_BASE_URL = "wss://api-tradingreload.pradeepjadhav.com";

const activeSymbol = "BTCUSD";

/**
 * Broker (MT4/MT5) sends candle times in UTC+3 server time encoded as
 * plain Unix seconds. Convert to true UTC milliseconds by multiplying
 * by 1000 and stripping the 3-hour broker timezone offset.
 */
const BROKER_TZ_OFFSET_MS = 3 * 60 * 60 * 1000;

const toMs = (candle: Candle): Candle =>
	candle.time < 1e12 ? { ...candle, time: candle.time * 1000 - BROKER_TZ_OFFSET_MS } : candle;

const chartStack = getRequiredElement<HTMLDivElement>("#chart-stack");
const volumeCanvas = getRequiredElement<HTMLCanvasElement>("#volume");
const candleCanvas = getRequiredElement<HTMLCanvasElement>("#chart");
const shapesCanvas = getRequiredElement<HTMLCanvasElement>("#shapes");
const overlayCanvas = getRequiredElement<HTMLCanvasElement>("#overlay");
const tradesCanvas = getRequiredElement<HTMLCanvasElement>("#trades");
const axisXCanvas = getRequiredElement<HTMLCanvasElement>("#axis-x");
const axisYCanvas = getRequiredElement<HTMLCanvasElement>("#axis-y");

chartStack.style.backgroundColor = CHART_CONFIG.colors.background;

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

type TradeHistoryApiItem = {
	commission: number;
	endPrice: number;
	endTime: number;
	pnl: number;
	sl: number | null;
	startPrice: number;
	startTime: number;
	swap: number;
	symbol: string;
	tp: number | null;
	type: TradeType;
	volume: number;
};

type TradeHistoryApiResponse = {
	count: number;
	history: TradeHistoryApiItem[];
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
 * Demo Shapes
 * =========================
 */
let demoShapes: Shape[] = [];
const createDemoShapes = (candles: Candle[]): Shape[] => {
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

let activeShapeTool: ShapeToolType | null = null;
let shapeToolActive = false;
const getShapeToolActive = () => shapeToolActive;

const setActiveShapeTool = (tool: ShapeToolType | null) => {
	activeShapeTool = tool;
	shapeToolActive = activeShapeTool !== null;

	if (shapeToolActive) {
		isDragging = false;
		tradeLayer?.setIsDragging(false);
		tradeLayerEvents?.cancelActiveInteraction();
	}

	shapesLayer?.setActiveTool(activeShapeTool);
};

declare global {
	interface Window {
		setActiveShapeTool?: (tool: ShapeToolType | null) => void;
		getShapeToolActive?: () => boolean;
	}
}

window.setActiveShapeTool = setActiveShapeTool;
window.getShapeToolActive = getShapeToolActive;
window.setActiveShapeTool = setActiveShapeTool;

/**
 * =========================
 * Resize Canvases
 * =========================
 */
const resizeCanvases = () => {
	const { plotWidth, plotHeight, axisYWidth, axisXHeight } = getCanvasLayoutSize();

	setCanvasSize(volumeCanvas, plotWidth, plotHeight);
	setCanvasSize(candleCanvas, plotWidth, plotHeight);
	setCanvasSize(shapesCanvas, plotWidth, plotHeight);
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
let volumeLayer: VolumeLayer | null = null;
let candleLayer: ExistingCandlesLayer | null = null;
let shapesLayer: ShapesLayer | null = null;
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

	volumeLayer?.setCandles(candleLayer.candles);
	volumeLayer?.setLiveCandle(candleLayer.liveCandle);
	volumeLayer?.setViewport(candleLayer.viewport);
	volumeLayer?.render();

	candleLayer.render();

	shapesLayer?.setCandles(candleLayer.candles);
	shapesLayer?.setViewport(candleLayer.viewport);
	shapesLayer?.render();

	tradeLayer?.setCandles(candleLayer.candles);
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

	return candleLayer.getRawCandleSnapX(pointerX);
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

const handleShapeAdded = (payload: ShapeAddedPayload) => {
	console.log("Shape added", payload);

	demoShapes = [...demoShapes, payload.shape];
	shapesLayer?.setShapes(demoShapes);
	shapesLayer?.render();

	setActiveShapeTool(null);
};

const handleShapeModified = (payload: ShapeModifiedPayload) => {
	console.log("Shape modified", payload);

	demoShapes = demoShapes.map((shape) => (shape.id === payload.shape.id ? payload.shape : shape));
	shapesLayer?.setShapes(demoShapes);
	shapesLayer?.render();
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
		await loadPastTradeHistory();
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
	volumeLayer = new VolumeLayer({
		canvas: volumeCanvas,
		candles,
	});

	candleLayer = new ExistingCandlesLayer({
		canvas: candleCanvas,
		candles,
		baseCandleWidth: 8,
		baseCandleGap: 4,
	});

	if (demoShapes.length === 0) {
		demoShapes = createDemoShapes(candles);
	}

	shapesLayer = new ShapesLayer({
		canvas: shapesCanvas,
		activeSymbol,
		candles,
		shapes: demoShapes,
		activeTool: activeShapeTool,
		config: CHART_CONFIG.shapes,
		onShapeAdded: handleShapeAdded,
		onShapeModified: handleShapeModified,
		onToolChange: setActiveShapeTool,
	});

	tradeLayer = new TradeLayer({
		canvas: tradesCanvas,
	});

	tradeLayer.setCandles(candles);

	axisLayerX = new AxisLayerX({
		canvas: axisXCanvas,
		candles,
	});

	axisLayerY = new AxisLayerY({
		canvas: axisYCanvas,
	});

	tradeLayerEvents = new TradeLayerEvents({
		canvas: tradesCanvas,
		getHandleHitboxes: () => (shapeToolActive ? [] : (tradeLayer?.handleHitboxes ?? [])),
		onDrag: handleTPSLChange,
		onMissingProtectionDrag: handleMissingProtectionDrag,
		onMissingProtectionDragEnd: handleMissingProtectionDragEnd,
		onMissingProtectionDragCancel: handleMissingProtectionDragCancel,
		onTradeModified: handleTradeModified,
	});
};

const loadPastTradeHistory = async () => {
	if (!tradeLayer) {
		return;
	}

	try {
		const response = await fetch(`${API_BASE_URL}/history`, {
			cache: "no-store",
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch trade history: ${response.status}`);
		}

		const data = (await response.json()) as TradeHistoryApiResponse;
		const history = Array.isArray(data.history) ? data.history : [];
		const activeSymbolHistory = history.filter((trade) => isTradeForActiveSymbol(trade.symbol));
		const pastTrades = activeSymbolHistory
			.map(normalizePastTradeIndicator)
			.filter((trade): trade is PastTradeIndicator => trade !== null);

		tradeLayer.setPastTrades(pastTrades);

		const invalidTradeCount = activeSymbolHistory.length - pastTrades.length;

		if (invalidTradeCount > 0) {
			console.warn(
				`Skipped ${invalidTradeCount} historical trade(s) because start/end time or open/close price was missing.`,
			);
		}
	} catch (error) {
		console.error("Failed to load trade history", error);
	}
};

const isTradeForActiveSymbol = (symbol: unknown) => {
	if (typeof symbol !== "string") {
		return false;
	}

	const normalizedTradeSymbol = normalizeSymbol(symbol);
	const normalizedActiveSymbol = normalizeSymbol(activeSymbol);

	return normalizedTradeSymbol === normalizedActiveSymbol;
};

const normalizeSymbol = (symbol: string) => symbol.split(".")[0].toUpperCase();

const normalizePastTradeIndicator = (trade: TradeHistoryApiItem): PastTradeIndicator | null => {
	const startTime = getFiniteNumber(trade.startTime);
	const closeTime = getFiniteNumber(trade.endTime);
	const openPrice = getFiniteNumber(trade.startPrice);
	const closePrice = getFiniteNumber(trade.endPrice);

	if (startTime === null || closeTime === null || openPrice === null || closePrice === null) {
		return null;
	}
	return {
		symbol: trade.symbol,
		type: trade.type,
		startTime,
		closeTime,
		openPrice,
		closePrice,
		volume: trade.volume,
		commission: trade.commission,
		swap: trade.swap,
		pnl: trade.pnl,
		sl: trade.sl,
		tp: trade.tp,
	};
};

const getFiniteNumber = (value: unknown) => {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return null;
	}

	return value;
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
		tradeLayer.setCandles(candleLayer.candles);

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

	if (!shapeToolActive) {
		tradeLayerEvents?.handlePointerEvent(event);
	}

	event.preventDefault();

	const zoomDelta = event.deltaY < 0 ? -1 : 1;

	if (event.ctrlKey || event.metaKey) {
		candleLayer.zoomVertically(zoomDelta);
	} else {
		candleLayer.zoomHorizontally(zoomDelta);
	}

	renderAllLayers();
};

const handlePointerDownEvent = (event: PointerEvent) => {
	const shapeEventHandled = shapesLayer?.handlePointerEvent(event) ?? false;

	if (shapeEventHandled) {
		renderAllLayers();
		return;
	}

	if (shapeToolActive) {
		return;
	}

	if (tradeLayerEvents?.handlePointerEvent(event)) {
		return;
	}

	isDragging = true;
	lastMouseX = event.clientX;
	lastMouseY = event.clientY;
};

const handlePointerMoveEvent = (event: PointerEvent) => {
	const shapeEventHandled = shapesLayer?.handlePointerEvent(event) ?? false;

	if (!shapeToolActive) {
		tradeLayerEvents?.handlePointerEvent(event);
	}

	updateCrosshairAndAxisLabels(event);

	if (shapeEventHandled) {
		renderAllLayers();
		updateCrosshairAndAxisLabels(event);
		return;
	}

	if (!isDragging || !candleLayer || shapeToolActive) {
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

	const shapeEventHandled = shapesLayer?.handlePointerEvent(event) ?? false;

	if (shapeEventHandled) {
		renderAllLayers();
		return;
	}

	if (!shapeToolActive) {
		tradeLayerEvents?.handlePointerEvent(event);
	}
};

const handlePointerEnterEvent = (event: PointerEvent) => {
	shapesLayer?.handlePointerEvent(event);

	if (!shapeToolActive) {
		tradeLayerEvents?.handlePointerEvent(event);
	}
};

const handlePointerLeaveEvent = () => {
	shapesLayer?.clearHoverState();
	if (!shapeToolActive) {
		document.body.style.cursor = "default";
	}
	hideCrosshairAndAxisLabels();
};

const handleContextMenuEvent = (event: MouseEvent) => {
	const shapeEventHandled = shapesLayer?.handlePointerEvent(event) ?? false;
	if (shapeEventHandled || shapeToolActive) {
		event.preventDefault();
		event.stopPropagation();
		renderAllLayers();
	}
};

const handleKeyDownEvent = (event: KeyboardEvent) => {
	const shapeEventHandled = shapesLayer?.handleKeyboardEvent(event) ?? false;

	if (shapeEventHandled) {
		event.preventDefault();
		renderAllLayers();
	}
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
window.addEventListener("contextmenu", handleContextMenuEvent);
window.addEventListener("keydown", handleKeyDownEvent);
window.addEventListener("wheel", handleWheelEvent, { passive: false });
window.addEventListener("resize", handleResizeEvent);
