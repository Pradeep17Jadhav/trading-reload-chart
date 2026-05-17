import { AxisLayerX } from "../canvas/layers/AxisLayerX/AxisLayerX";
import { AxisLayerY } from "../canvas/layers/AxisLayerY/AxisLayerY";
import { CrosshairLayer } from "../canvas/layers/CrosshairLayer";
import { ExistingCandlesLayer } from "../canvas/layers/ExistingCandlesLayer";
import { ShapesLayer } from "../canvas/layers/ShapesLayer/ShapesLayer";
import type { ShapeToolType } from "../canvas/layers/ShapesLayer/ShapesLayer.types";
import { TradeLayer } from "../canvas/layers/TradeLayer/TradeLayer";
import type {
	TradeHandleType,
	TradeProtectionHandleType,
} from "../canvas/layers/TradeLayer/TradeLayer.types";
import { TradeLayerEvents } from "../canvas/layers/TradeLayer/TradeLayerEvents";
import { VolumeLayer } from "../canvas/layers/VolumeLayer/VolumeLayer";
import type { ChartConfig } from "../config/chartConfig.types";
import type { Candle } from "../models/Candle";
import type { OpenTrade } from "../models/Trade";
import type { ChartControllerProps, TradeModifyPayload } from "./ChartController.types";
import { createChartDom, type ChartDomElements } from "./createChartDom";
import { getCanvasPoint } from "./utils/getCanvasPoint";
import { mergeChartConfig } from "./utils/mergeChartConfig";
import { normalizeCandleTime } from "./utils/normalizeCandleTime";
export class ChartController {
	readonly #container: HTMLElement;

	#props: ChartControllerProps;

	#config: ChartConfig;

	#dom: ChartDomElements | null = null;

	#volumeLayer: VolumeLayer | null = null;

	#candleLayer: ExistingCandlesLayer | null = null;

	#shapesLayer: ShapesLayer | null = null;

	#tradeLayer: TradeLayer | null = null;

	#tradeLayerEvents: TradeLayerEvents | null = null;

	#axisLayerX: AxisLayerX | null = null;

	#axisLayerY: AxisLayerY | null = null;

	#crosshairLayer: CrosshairLayer | null = null;

	#initialized = false;

	#isPanning = false;

	#lastMouseX = 0;

	#lastMouseY = 0;

	#dragTradePreview: TradeModifyPayload | null = null;

	#resizeObserver: ResizeObserver | null = null;

	#abortController: AbortController | null = null;

	constructor(container: HTMLElement, props: ChartControllerProps) {
		this.#container = container;
		this.#props = props;
		this.#config = mergeChartConfig(props.config);
		this.#dom = createChartDom(container, this.#config.colors.background);
		this.#crosshairLayer = new CrosshairLayer({
			canvas: this.#dom.overlayCanvas,
			crosshairColor: this.#config.crosshair.color,
			crosshairThickness: this.#config.crosshair.thickness,
			crosshairStyle: this.#config.crosshair.style,
		});
		this.#bindInteractionListeners();
		this.#observeResize();
		this.#resizeCanvases();
		this.updateProps(props);
	}

	updateProps(props: ChartControllerProps) {
		const previousActiveTool = this.#props.activeShapeTool;
		this.#props = props;
		this.#config = mergeChartConfig(props.config);

		if (this.#dom) {
			this.#dom.root.style.backgroundColor = this.#config.colors.background;
			this.#dom.stack.style.setProperty("--axis-x-height", `${this.#config.axis.axisX.height}px`);
		}

		if (!this.#initialized && props.candles.length > 0) {
			this.#initializeLayers(props.candles);
		}

		if (!this.#candleLayer) {
			return;
		}

		if (props.activeShapeTool !== previousActiveTool) {
			this.#applyActiveShapeTool(props.activeShapeTool);
		}

		this.#shapesLayer?.setShapes(props.shapes);
		this.#shapesLayer?.setActiveTool(props.activeShapeTool);

		this.#tradeLayer?.setPastTrades(props.pastTrades ?? []);
		this.#syncOpenTradesToLayer();

		this.#applyLiveCandleUpdate();
		this.#renderAllLayers();
	}

	destroy() {
		this.#abortController?.abort();
		this.#abortController = null;
		this.#resizeObserver?.disconnect();
		this.#resizeObserver = null;
		this.#dom?.root.remove();
		this.#dom = null;
		this.#volumeLayer = null;
		this.#candleLayer = null;
		this.#shapesLayer = null;
		this.#tradeLayer = null;
		this.#tradeLayerEvents = null;
		this.#axisLayerX = null;
		this.#axisLayerY = null;
		this.#crosshairLayer = null;
		this.#initialized = false;
	}

	#initializeLayers(candles: Candle[]) {
		if (!this.#dom || this.#initialized) {
			return;
		}

		const normalizedCandles = candles.map((candle) =>
			normalizeCandleTime(candle, this.#props.brokerTimezoneOffsetMs),
		);

		this.#volumeLayer = new VolumeLayer({
			canvas: this.#dom.volumeCanvas,
			candles: normalizedCandles,
			bullishColor: this.#config.volume.bullishColor,
			bearishColor: this.#config.volume.bearishColor,
			opacity: this.#config.volume.opacity,
			height: this.#config.volume.height,
			bottomOffset: this.#config.volume.bottomOffset,
			minBarHeight: this.#config.volume.minBarHeight,
		});

		this.#candleLayer = new ExistingCandlesLayer({
			canvas: this.#dom.candleCanvas,
			candles: normalizedCandles,
			baseCandleWidth: this.#config.candles.defaultWidth,
			baseCandleGap: this.#config.candles.defaultGap,
			bullishColor: this.#config.colors.bullish,
			bearishColor: this.#config.colors.bearish,
			autoFollowLatestCandle: this.#config.candles.autoFollowLatestCandle,
			autoFollowThresholdCandles: this.#config.candles.autoFollowThresholdCandles,
			rightOffsetCandles: this.#config.candles.rightOffsetCandles,
		});

		this.#shapesLayer = new ShapesLayer({
			canvas: this.#dom.shapesCanvas,
			activeSymbol: this.#props.activeSymbol,
			candles: normalizedCandles,
			shapes: this.#props.shapes,
			activeTool: this.#props.activeShapeTool,
			config: this.#config.shapes,
			onShapeAdded: (payload) => {
				this.#props.onShapeAdded?.(payload);
			},
			onShapeModified: (payload) => {
				this.#props.onShapeModified?.(payload);
			},
			onToolChange: (tool) => {
				this.#props.onActiveShapeToolChange?.(tool);
			},
		});

		this.#tradeLayer = new TradeLayer({
			canvas: this.#dom.tradesCanvas,
		});
		this.#tradeLayer.setCandles(normalizedCandles);
		this.#tradeLayer.setPastTrades(this.#props.pastTrades ?? []);
		this.#syncOpenTradesToLayer();

		this.#axisLayerX = new AxisLayerX({
			canvas: this.#dom.axisXCanvas,
			candles: normalizedCandles,
		});

		this.#axisLayerY = new AxisLayerY({
			canvas: this.#dom.axisYCanvas,
		});

		this.#tradeLayerEvents = new TradeLayerEvents({
			canvas: this.#dom.tradesCanvas,
			getHandleHitboxes: () =>
				this.#isShapeToolActive() ? [] : (this.#tradeLayer?.handleHitboxes ?? []),
			onDrag: (payload) => this.#handleTradeDrag(payload),
			onMissingProtectionDrag: (payload) => this.#handleMissingProtectionDrag(payload),
			onMissingProtectionDragEnd: (payload) => this.#handleMissingProtectionDragEnd(payload),
			onMissingProtectionDragCancel: () => this.#handleMissingProtectionDragCancel(),
			onTradeModified: (payload) => this.#handleTradeModifyCommit(payload),
		});

		this.#initialized = true;
		this.#renderAllLayers();
	}

	#bindInteractionListeners() {
		if (!this.#dom) {
			return;
		}

		this.#abortController = new AbortController();
		const { signal } = this.#abortController;
		const target = this.#dom.interactionTarget;

		target.addEventListener("pointerdown", (event) => this.#handlePointerDown(event), { signal });
		target.addEventListener("pointerup", (event) => this.#handlePointerUp(event), { signal });
		target.addEventListener("pointermove", (event) => this.#handlePointerMove(event), { signal });
		target.addEventListener("pointerenter", (event) => this.#handlePointerEnter(event), { signal });
		target.addEventListener("pointerleave", () => this.#handlePointerLeave(), { signal });
		target.addEventListener("contextmenu", (event) => this.#handleContextMenu(event), { signal });
		target.addEventListener("wheel", (event) => this.#handleWheel(event), { passive: false, signal });
		document.addEventListener("keydown", (event) => this.#handleKeyDown(event), { signal });
	}

	#observeResize() {
		this.#resizeObserver = new ResizeObserver(() => {
			this.#resizeCanvases();
			this.#renderAllLayers();
		});
		this.#resizeObserver.observe(this.#container);
	}

	#getCanvasLayoutSize() {
		const axisYWidth = this.#config.axis.axisY.width;
		const axisXHeight = this.#config.axis.axisX.height;
		const containerWidth = this.#container.clientWidth;
		const containerHeight = this.#container.clientHeight;

		return {
			axisYWidth,
			axisXHeight,
			plotWidth: Math.max(0, containerWidth - axisYWidth),
			plotHeight: Math.max(0, containerHeight - axisXHeight),
		};
	}

	#setCanvasSize(canvas: HTMLCanvasElement, width: number, height: number) {
		canvas.width = width;
		canvas.height = height;
	}

	#resizeCanvases() {
		if (!this.#dom) {
			return;
		}

		const { plotWidth, plotHeight, axisYWidth, axisXHeight } = this.#getCanvasLayoutSize();

		this.#setCanvasSize(this.#dom.volumeCanvas, plotWidth, plotHeight);
		this.#setCanvasSize(this.#dom.candleCanvas, plotWidth, plotHeight);
		this.#setCanvasSize(this.#dom.shapesCanvas, plotWidth, plotHeight);
		this.#setCanvasSize(this.#dom.overlayCanvas, plotWidth, plotHeight);
		this.#setCanvasSize(this.#dom.tradesCanvas, plotWidth, plotHeight);
		this.#setCanvasSize(this.#dom.axisXCanvas, plotWidth, axisXHeight);
		this.#setCanvasSize(this.#dom.axisYCanvas, axisYWidth, plotHeight);
	}

	#renderAxisLayers() {
		if (!this.#candleLayer) {
			return;
		}

		this.#axisLayerX?.setCandles(this.#candleLayer.candles);
		this.#axisLayerX?.setViewport(this.#candleLayer.viewport);
		this.#axisLayerX?.render();

		this.#axisLayerY?.setViewport(this.#candleLayer.viewport);
		this.#axisLayerY?.render();
	}

	#renderAllLayers() {
		if (!this.#candleLayer) {
			return;
		}

		this.#volumeLayer?.setCandles(this.#candleLayer.candles);
		this.#volumeLayer?.setLiveCandle(this.#candleLayer.liveCandle);
		this.#volumeLayer?.setViewport(this.#candleLayer.viewport);
		this.#volumeLayer?.render();

		this.#candleLayer.render();

		this.#shapesLayer?.setCandles(this.#candleLayer.candles);
		this.#shapesLayer?.setViewport(this.#candleLayer.viewport);
		this.#shapesLayer?.render();

		this.#tradeLayer?.setCandles(this.#candleLayer.candles);
		this.#tradeLayer?.setViewport(this.#candleLayer.viewport);

		if (this.#tradeLayer?.isDragging) {
			this.#tradeLayer.renderLiveFeed();
		} else {
			this.#tradeLayer?.render();
		}

		this.#renderAxisLayers();
		this.#crosshairLayer?.render();
	}

	#isShapeToolActive() {
		return this.#props.activeShapeTool !== null;
	}

	#applyActiveShapeTool(tool: ShapeToolType | null) {
		if (tool !== null) {
			this.#isPanning = false;
			this.#tradeLayer?.setIsDragging(false);
			this.#tradeLayerEvents?.cancelActiveInteraction();
		}

		this.#shapesLayer?.setActiveTool(tool);
	}

	#getDisplayOpenTrades(): OpenTrade[] {
		const trades = this.#props.openTrades ?? [];

		if (!this.#dragTradePreview) {
			return trades;
		}

		return trades.map((trade) => {
			if (trade.ticket !== this.#dragTradePreview?.ticket) {
				return trade;
			}

			return {
				...trade,
				...(this.#dragTradePreview.sl !== undefined ? { sl: this.#dragTradePreview.sl } : {}),
				...(this.#dragTradePreview.tp !== undefined ? { tp: this.#dragTradePreview.tp } : {}),
			};
		});
	}

	#syncOpenTradesToLayer() {
		this.#tradeLayer?.setTrades(this.#getDisplayOpenTrades());
	}

	#applyLiveCandleUpdate() {
		const liveCandle = this.#props.liveCandle;

		if (!liveCandle || !this.#candleLayer) {
			return;
		}

		const normalized = normalizeCandleTime(liveCandle, this.#props.brokerTimezoneOffsetMs);
		this.#candleLayer.updateLiveCandle(normalized);
		this.#tradeLayer?.setLiveCandle(this.#candleLayer.liveCandle);
		this.#tradeLayer?.setCandles(this.#candleLayer.candles);
	}

	#handleTradeDrag({
		trade,
		type,
		price,
	}: {
		trade: OpenTrade;
		type: TradeHandleType;
		price: number;
	}) {
		if (!this.#tradeLayer) {
			return;
		}

		this.#tradeLayer.setIsDragging(true);
		this.#dragTradePreview = {
			ticket: trade.ticket,
			...(type === "stopLoss" ? { sl: price } : {}),
			...(type === "takeProfit" ? { tp: price } : {}),
		};
		this.#syncOpenTradesToLayer();
		this.#tradeLayer.render();
	}

	#handleMissingProtectionDrag({
		trade,
		type,
		price,
	}: {
		trade: OpenTrade;
		type: TradeProtectionHandleType;
		price: number;
	}) {
		if (!this.#tradeLayer?.viewport) {
			return;
		}

		this.#tradeLayer.setIsDragging(true);
		this.#tradeLayer.setTemporaryProtectionDrag({
			visible: true,
			trade,
			type,
			price,
			viewport: this.#tradeLayer.viewport,
		});
		this.#tradeLayer.render();
	}

	#handleMissingProtectionDragEnd({
		trade,
		type,
		price,
	}: {
		trade: OpenTrade;
		type: TradeProtectionHandleType;
		price: number;
	}) {
		this.#tradeLayer?.setIsDragging(false);
		this.#handleTradeModifyCommit({
			ticket: trade.ticket,
			...(type === "stopLoss" ? { sl: price } : {}),
			...(type === "takeProfit" ? { tp: price } : {}),
		});
	}

	#handleMissingProtectionDragCancel() {
		this.#tradeLayer?.setIsDragging(false);
		this.#tradeLayer?.clearTemporaryProtectionDrag();
		this.#tradeLayer?.render();
	}

	#handleTradeModifyCommit(payload: TradeModifyPayload) {
		this.#tradeLayer?.setIsDragging(false);
		this.#dragTradePreview = null;
		this.#tradeLayer?.clearTemporaryProtectionDrag();
		this.#props.onTradeModify?.(payload);
		this.#syncOpenTradesToLayer();
		this.#tradeLayer?.render();
	}

	#updateCrosshairAndAxisLabels(event: PointerEvent | MouseEvent) {
		if (!this.#crosshairLayer || !this.#dom) {
			return;
		}

		if (!this.#candleLayer) {
			this.#crosshairLayer.updateMousePosition(event.clientX, event.clientY);
			this.#crosshairLayer.render();
			return;
		}

		const pointer = getCanvasPoint(this.#dom.overlayCanvas, event);
		const nearestCandleIndex = this.#candleLayer.getNearestCandleIndexByX(pointer.x);
		const nearestCandle =
			nearestCandleIndex === null ? null : (this.#candleLayer.candles[nearestCandleIndex] ?? null);
		const snapX =
			nearestCandleIndex === null
				? pointer.x
				: this.#candleLayer.getRawCandleSnapX(pointer.x);

		this.#crosshairLayer.updateMousePosition(event.clientX, event.clientY, { snapX });

		const crosshairPrice = this.#candleLayer.getPriceAtY(this.#crosshairLayer.mouseY);

		this.#axisLayerY?.setCrosshair({
			visible: true,
			y: this.#crosshairLayer.mouseY,
			price: crosshairPrice,
		});

		this.#axisLayerX?.setCrosshair({
			visible: true,
			x: this.#crosshairLayer.mouseX,
			candle: nearestCandle,
		});

		this.#renderAxisLayers();
		this.#crosshairLayer.render();
	}

	#hideCrosshairAndAxisLabels() {
		this.#crosshairLayer?.hide();
		this.#axisLayerX?.hideCrosshair();
		this.#axisLayerY?.hideCrosshair();
		this.#renderAxisLayers();
		this.#crosshairLayer?.render();
	}

	#handleWheel(event: WheelEvent) {
		if (!this.#candleLayer || !this.#tradeLayer) {
			return;
		}

		if (!this.#isShapeToolActive()) {
			this.#tradeLayerEvents?.handlePointerEvent(event);
		}

		event.preventDefault();

		const zoomDelta = event.deltaY < 0 ? -1 : 1;

		if (event.ctrlKey || event.metaKey) {
			this.#candleLayer.zoomVertically(zoomDelta);
		} else {
			this.#candleLayer.zoomHorizontally(zoomDelta);
		}

		this.#renderAllLayers();
	}

	#handlePointerDown(event: PointerEvent) {
		const shapeEventHandled = this.#shapesLayer?.handlePointerEvent(event) ?? false;

		if (shapeEventHandled) {
			this.#renderAllLayers();
			return;
		}

		if (this.#isShapeToolActive()) {
			return;
		}

		if (this.#tradeLayerEvents?.handlePointerEvent(event)) {
			return;
		}

		this.#isPanning = true;
		this.#lastMouseX = event.clientX;
		this.#lastMouseY = event.clientY;
	}

	#handlePointerMove(event: PointerEvent) {
		const shapeEventHandled = this.#shapesLayer?.handlePointerEvent(event) ?? false;

		if (!this.#isShapeToolActive()) {
			this.#tradeLayerEvents?.handlePointerEvent(event);
		}

		this.#updateCrosshairAndAxisLabels(event);

		if (shapeEventHandled) {
			this.#renderAllLayers();
			this.#updateCrosshairAndAxisLabels(event);
			return;
		}

		if (!this.#isPanning || !this.#candleLayer || this.#isShapeToolActive()) {
			return;
		}

		const deltaX = event.clientX - this.#lastMouseX;
		const deltaY = event.clientY - this.#lastMouseY;

		this.#lastMouseX = event.clientX;
		this.#lastMouseY = event.clientY;

		this.#candleLayer.panHorizontally(deltaX);
		this.#candleLayer.panVertically(deltaY);

		this.#renderAllLayers();
		this.#updateCrosshairAndAxisLabels(event);
	}

	#handlePointerUp(event: PointerEvent) {
		this.#isPanning = false;

		const shapeEventHandled = this.#shapesLayer?.handlePointerEvent(event) ?? false;

		if (shapeEventHandled) {
			this.#renderAllLayers();
			return;
		}

		if (!this.#isShapeToolActive()) {
			this.#tradeLayerEvents?.handlePointerEvent(event);
		}
	}

	#handlePointerEnter(event: PointerEvent) {
		this.#shapesLayer?.handlePointerEvent(event);

		if (!this.#isShapeToolActive()) {
			this.#tradeLayerEvents?.handlePointerEvent(event);
		}
	}

	#handlePointerLeave() {
		this.#shapesLayer?.clearHoverState();

		if (!this.#isShapeToolActive()) {
			document.body.style.cursor = "default";
		}

		this.#hideCrosshairAndAxisLabels();
	}

	#handleContextMenu(event: MouseEvent) {
		const shapeEventHandled = this.#shapesLayer?.handlePointerEvent(event) ?? false;

		if (shapeEventHandled || this.#isShapeToolActive()) {
			event.preventDefault();
			event.stopPropagation();
			this.#renderAllLayers();
		}
	}

	#handleKeyDown(event: KeyboardEvent) {
		const shapeEventHandled = this.#shapesLayer?.handleKeyboardEvent(event) ?? false;

		if (shapeEventHandled) {
			event.preventDefault();
			this.#renderAllLayers();
		}
	}
}
