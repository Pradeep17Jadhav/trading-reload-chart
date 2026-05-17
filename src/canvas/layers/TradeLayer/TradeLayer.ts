import { CHART_CONFIG } from "../../../config/chartConfig";
import type {
	MissingTradeProtectionHandleRectConfig,
	TemporaryTradeProtectionHandleRectConfig,
	TradeHandleLineConfig,
	TradeHandleRectConfig,
	TradeHandleStyleConfig,
} from "../../../config/chartConfig.types";
import { normalizePrice } from "../../../helpers/math";
import type { Candle } from "../../../models/Candle.types";
import type { ChartViewport } from "../../../models/ChartViewport.types";
import type { OpenTrade } from "../../../models/Trade.types";
import { priceToY } from "../helpers/LayerHelpers";
import { calculatePotentialPnlUsd } from "./TradeLayer.helpers";
import type {
	CreateHitBoxOptions,
	CreateMissingProtectionHitBoxOptions,
	DrawConnectorLineOptions,
	DrawHandleLineOptions,
	DrawHandleRectOptions,
	DrawHandleSectionsOptions,
	DrawMissingProtectionHandleRectOptions,
	DrawPastTradeArrowOptions,
	DrawTemporaryProtectionHandleRectOptions,
	DrawTradeHandleOptions,
	HandleSection,
	LineBlockedRange,
	MissingProtectionHandleRenderState,
	PastTradeIndicator,
	PastTradeIndicatorRenderState,
	TemporaryProtectionRenderState,
	TemporaryTradeProtectionDrag,
	TradeHandleHitbox,
	TradeHandleRenderState,
	TradeHandleType,
	TradeLayerOptions,
	TradeProtectionHandleType,
} from "./TradeLayer.types";

export class TradeLayer {
	readonly #canvas: HTMLCanvasElement;
	readonly #ctx: CanvasRenderingContext2D;

	isDragging: boolean;
	trades: OpenTrade[] = [];
	pastTrades: PastTradeIndicator[] = [];
	candles: Candle[] = [];
	viewport: ChartViewport | null = null;
	liveCandle: Candle | null = null;
	handleHitboxes: TradeHandleHitbox[] = [];
	temporaryProtectionDrag: TemporaryTradeProtectionDrag | null = null;

	constructor(options: TradeLayerOptions) {
		this.#canvas = options.canvas;
		this.isDragging = false;

		const ctx = this.#canvas.getContext("2d");

		if (!ctx) {
			throw new Error("Canvas 2D context not supported");
		}

		this.#ctx = ctx;
	}

	setTrades(trades: OpenTrade[]) {
		this.trades = trades;
	}

	setPastTrades(pastTrades: PastTradeIndicator[]) {
		this.pastTrades = pastTrades;
	}

	setCandles(candles: Candle[]) {
		this.candles = candles;
	}

	setViewport(viewport: ChartViewport) {
		this.viewport = viewport;
	}

	setLiveCandle(candle: Candle) {
		this.liveCandle = candle;
	}

	setIsDragging(isDragging: boolean) {
		this.isDragging = isDragging;
	}

	setTemporaryProtectionDrag(temporaryProtectionDrag: TemporaryTradeProtectionDrag | null) {
		this.temporaryProtectionDrag = temporaryProtectionDrag;
	}

	clearTemporaryProtectionDrag() {
		this.temporaryProtectionDrag = null;
	}

	renderLiveFeed() {
		if (!this.isDragging) {
			this.render();
		}
	}

	render() {
		this.clearCanvas();
		this.resetHitboxes();

		this.drawPastTradeIndicators();

		for (const trade of this.trades) {
			this.drawTrade({
				trade,
			});
		}

		this.drawTemporaryProtectionDrag();
	}

	createHitBox = ({ price, trade, type, x, y, width, height, viewport }: CreateHitBoxOptions) => {
		const { showCloseSection, widthClose } = this.getHandleStyleConfig(type).handle;
		const closeButtonWidth = showCloseSection ? widthClose : 0;
		const labelAreaWidth = width - closeButtonWidth;
		const closeButtonAreaX = x + width - closeButtonWidth;

		return {
			kind: "existingHandle" as const,
			price: normalizePrice(price),
			trade,
			type,
			x,
			y,
			width,
			height,
			viewport,
			labelArea: { x, y, width: labelAreaWidth, height },
			closeButtonArea: { x: closeButtonAreaX, y, width: closeButtonWidth, height },
		};
	};

	createMissingProtectionHitBox = ({
		price,
		trade,
		type,
		x,
		y,
		width,
		height,
		viewport,
	}: CreateMissingProtectionHitBoxOptions) => {
		return {
			kind: "missingProtectionHandle" as const,
			price: normalizePrice(price),
			trade,
			type,
			x,
			y,
			width,
			height,
			viewport,
			labelArea: { x, y, width, height },
			closeButtonArea: { x: x + width, y, width: 0, height },
		};
	};

	drawTrade({ trade }: { trade: OpenTrade }) {
		const startPriceRenderState = this.getTradeHandleRenderState({
			price: trade.openPrice,
			type: "startPrice",
			trade,
		});

		if (!startPriceRenderState) {
			return;
		}

		const missingProtectionRenderStates = this.getMissingProtectionRenderStates({
			trade,
			startPriceRenderState,
		});

		this.drawTradeHandleFromRenderState({
			renderState: startPriceRenderState,
			blockedRanges: this.getLineBlockedRangesFromMissingProtectionHandles(missingProtectionRenderStates),
		});

		if (trade.sl) {
			this.drawTradeHandle({
				price: trade.sl,
				type: "stopLoss",
				trade,
			});
		}

		if (trade.tp) {
			this.drawTradeHandle({
				price: trade.tp,
				type: "takeProfit",
				trade,
			});
		}

		for (const renderState of missingProtectionRenderStates) {
			this.addMissingProtectionHitbox(renderState);
			this.drawMissingProtectionHandleRect({
				x: renderState.handleX,
				y: renderState.handleY,
				width: renderState.handleWidth,
				config: renderState.config,
			});
			this.drawMissingProtectionHandleLabel(renderState);
		}
	}

	drawTradeHandle({ price, type, trade }: DrawTradeHandleOptions) {
		const renderState = this.getTradeHandleRenderState({
			price,
			type,
			trade,
		});

		if (!renderState) {
			return null;
		}

		this.drawTradeHandleFromRenderState({
			renderState,
		});

		return renderState;
	}

	drawTradeHandleFromRenderState({
		renderState,
		blockedRanges = [],
	}: {
		renderState: TradeHandleRenderState;
		blockedRanges?: LineBlockedRange[];
	}) {
		this.addHandleHitbox(renderState);
		this.drawHandleHorizontalLines({
			...renderState,
			blockedRanges,
		});

		this.drawHandleRect({
			x: renderState.handleX,
			y: renderState.handleY,
			width: renderState.handleWidth,
			config: renderState.handleConfig,
		});

		this.drawHandleSections({
			handleType: renderState.type,
			handleX: renderState.handleX,
			handleY: renderState.handleY,
			handleWidth: renderState.handleWidth,
			handleHeight: renderState.handleHeight,
			handleConfig: renderState.handleConfig,
			trade: renderState.trade,
			y: renderState.y,
		});
	}

	drawHandleLine({ x1, x2, y, config }: DrawHandleLineOptions) {
		if (x2 <= x1) {
			return;
		}

		const ctx = this.#ctx;

		ctx.save();

		ctx.globalAlpha = config.opacity;
		ctx.strokeStyle = config.color;
		ctx.lineWidth = config.width;
		ctx.setLineDash(this.getHandleLineDash(config));

		ctx.beginPath();
		ctx.moveTo(x1, y);
		ctx.lineTo(x2, y);
		ctx.stroke();

		ctx.restore();
	}

	drawConnectorLine({ x1, y1, x2, y2, config }: DrawConnectorLineOptions) {
		const ctx = this.#ctx;

		ctx.save();

		ctx.globalAlpha = config.opacity;
		ctx.strokeStyle = config.color;
		ctx.lineWidth = config.width;
		ctx.setLineDash(this.getHandleLineDash(config));

		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();

		ctx.restore();
	}

	drawHandleRect({ x, y, width, config }: DrawHandleRectOptions) {
		const ctx = this.#ctx;

		this.clearRectArea({
			x,
			y,
			width,
			height: config.height,
			padding: Math.max(1, config.borderWidth),
		});

		ctx.save();

		ctx.globalAlpha = config.backgroundOpacity;
		ctx.fillStyle = config.backgroundColor;
		ctx.fillRect(x, y, width, config.height);

		ctx.globalAlpha = config.borderOpacity;
		ctx.strokeStyle = config.borderColor;
		ctx.lineWidth = config.borderWidth;
		ctx.strokeRect(x, y, width, config.height);

		ctx.restore();
	}

	drawHandleSections({
		handleType,
		handleX,
		handleY,
		handleWidth,
		handleHeight,
		handleConfig,
		trade,
		y,
	}: DrawHandleSectionsOptions) {
		const ctx = this.#ctx;
		const sharedConfig = CHART_CONFIG.tradeHandles;
		const sections = this.getHandleSections({
			handleType,
			handleConfig,
			trade,
		});

		let currentX = handleX;

		ctx.save();

		ctx.font = sharedConfig.font;
		ctx.textBaseline = "middle";
		ctx.globalAlpha = sharedConfig.textOpacity;

		for (const section of sections) {
			if (!section.visible) {
				continue;
			}

			this.drawHandleSectionLabel({
				section,
				currentX,
				y,
			});

			currentX += section.width;

			/**
			 * Divider
			 */
			if (currentX < handleX + handleWidth) {
				this.drawHandleSectionDivider({
					x: currentX,
					y1: handleY + 4,
					y2: handleY + handleHeight - 4,
					config: handleConfig,
				});
			}
		}

		ctx.restore();
	}

	getHandlePnLLabel({ handleType, trade }: { handleType: TradeHandleType; trade: OpenTrade }) {
		if (handleType === "startPrice") {
			return this.formatPnlLabel(trade.pnl);
		}

		const targetPrice = handleType === "stopLoss" ? trade.sl : trade.tp;

		if (!targetPrice) {
			return "N/A";
		}

		const projectedPnL = calculatePotentialPnlUsd(trade.type, trade.openPrice, targetPrice, trade.volume, trade.symbol);

		return this.formatPnlLabel(projectedPnL);
	}

	getHandleWidth(config: TradeHandleRectConfig) {
		let width = 0;

		if (config.showVolumeSection) {
			width += config.widthVolume;
		}

		if (config.showPnlSection) {
			width += config.widthPNL;
		}

		if (config.showCloseSection) {
			width += config.widthClose;
		}

		return width;
	}

	getHandleX({ handleWidth, config }: { handleWidth: number; config: TradeHandleRectConfig }) {
		return this.getPositionedHandleX({
			handleWidth,
			position: config.position,
		});
	}

	getTemporaryProtectionHandleX({
		handleWidth,
		config,
	}: {
		handleWidth: number;
		config: TemporaryTradeProtectionHandleRectConfig;
	}) {
		return this.getPositionedHandleX({
			handleWidth,
			position: config.position,
		});
	}

	getHandleStyleConfig(type: TradeHandleType): TradeHandleStyleConfig {
		switch (type) {
			case "startPrice":
				return CHART_CONFIG.tradeHandles.startPriceHandle;

			case "stopLoss":
				return CHART_CONFIG.tradeHandles.slHandle;

			case "takeProfit":
				return CHART_CONFIG.tradeHandles.tpHandle;
		}
	}

	getProtectionDirection({ trade, type }: { trade: OpenTrade; type: TradeProtectionHandleType }) {
		const isBuyTrade = this.isBuyTrade(trade);
		const direction = type === "takeProfit" ? 1 : -1;

		return isBuyTrade ? direction : -direction;
	}

	constrainProtectionPrice({
		price,
		trade,
		type,
	}: {
		price: number;
		trade: OpenTrade;
		type: TradeProtectionHandleType;
	}) {
		const direction = this.getProtectionDirection({
			trade,
			type,
		});

		if (direction > 0) {
			return normalizePrice(Math.max(price, trade.openPrice));
		}

		return normalizePrice(Math.min(price, trade.openPrice));
	}

	private clearCanvas() {
		this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
	}

	private resetHitboxes() {
		this.handleHitboxes = [];
	}

	private drawPastTradeIndicators() {
		const config = CHART_CONFIG.pastTradeIndicators;

		if (!config.visible || !this.viewport || this.candles.length === 0) {
			return;
		}

		for (const trade of this.pastTrades) {
			const renderState = this.getPastTradeIndicatorRenderState(trade);

			if (!renderState) {
				continue;
			}

			this.drawPastTradeConnector(renderState);
			this.drawPastTradeArrows(renderState);
		}
	}

	private getPastTradeIndicatorRenderState(trade: PastTradeIndicator): PastTradeIndicatorRenderState | null {
		if (!this.viewport) {
			return null;
		}

		const startX = this.getTimeX(trade.startTime);
		const closeX = this.getTimeX(trade.closeTime);

		if (startX === null || closeX === null) {
			return null;
		}

		const startY = this.getPriceY(trade.openPrice, this.viewport);
		const closeY = this.getPriceY(trade.closePrice, this.viewport);
		const arrowConfig = CHART_CONFIG.pastTradeIndicators.arrow;
		const arrowWidth = arrowConfig.width;
		const arrowHeight = arrowConfig.height;

		return {
			trade,
			start: {
				x: startX,
				y: startY,
				time: trade.startTime,
				price: trade.openPrice,
			},
			close: {
				x: closeX,
				y: closeY,
				time: trade.closeTime,
				price: trade.closePrice,
			},
			arrowWidth,
			arrowHeight,
		};
	}

	private drawPastTradeConnector({ start, close }: PastTradeIndicatorRenderState) {
		const config = CHART_CONFIG.pastTradeIndicators.connectorLine;

		this.drawConnectorLine({
			x1: start.x,
			y1: start.y,
			x2: close.x,
			y2: close.y,
			config,
		});
	}

	private drawPastTradeArrows({ trade, start, close, arrowWidth, arrowHeight }: PastTradeIndicatorRenderState) {
		const config = CHART_CONFIG.pastTradeIndicators.arrow;

		if (!config.visible) {
			return;
		}

		const closeType = trade.type === "buy" ? "sell" : "buy";

		this.drawPastTradeArrow({
			x: start.x,
			y: start.y,
			type: trade.type,
			width: arrowWidth,
			height: arrowHeight,
			config,
		});

		this.drawPastTradeArrow({
			x: close.x,
			y: close.y,
			type: closeType,
			width: arrowWidth,
			height: arrowHeight,
			config,
		});
	}

	private drawPastTradeArrow({ x, y, type, width, height, config }: DrawPastTradeArrowOptions) {
		if (width <= 0 || height <= 0) {
			return;
		}

		const ctx = this.#ctx;
		const isBuy = type === "buy";
		const color = isBuy ? config.buyColor : config.sellColor;
		const borderColor = isBuy ? config.buyBorderColor : config.sellBorderColor;

		/**
		 * Canvas Y increases downward.
		 *
		 * BUY:
		 * - arrow points upward
		 * - tip is exactly at price point y
		 * - tail extends below price point
		 *
		 * SELL:
		 * - arrow points downward
		 * - tip is exactly at price point y
		 * - tail extends above price point
		 */
		const tailDirection = isBuy ? 1 : -1;

		const tipX = x;
		const tipY = y;

		const tailX = x;
		const tailY = y + tailDirection * height;

		const headLength = height / 2;
		const headOffsetX = headLength / Math.SQRT2;
		const headOffsetY = headLength / Math.SQRT2;

		const leftHeadX = tipX - headOffsetX;
		const rightHeadX = tipX + headOffsetX;
		const headBaseY = tipY + tailDirection * headOffsetY;

		const innerLineWidth = Math.max(1, config.shaftWidthRatio);
		const outerLineWidth = innerLineWidth + config.borderWidth * 2;

		const drawArrowPath = () => {
			ctx.beginPath();

			// Shaft: tail -> tip
			ctx.moveTo(tailX, tailY);
			ctx.lineTo(tipX, tipY);

			// Left head line: tip -> base
			ctx.moveTo(tipX, tipY);
			ctx.lineTo(leftHeadX, headBaseY);

			// Right head line: tip -> base
			ctx.moveTo(tipX, tipY);
			ctx.lineTo(rightHeadX, headBaseY);

			ctx.stroke();
		};

		ctx.save();

		ctx.globalAlpha = config.opacity;
		ctx.lineCap = "round";
		ctx.lineJoin = "round";

		// Border pass.
		ctx.strokeStyle = borderColor;
		ctx.lineWidth = outerLineWidth;
		drawArrowPath();

		// Colored inner pass.
		ctx.strokeStyle = color;
		ctx.lineWidth = innerLineWidth;
		drawArrowPath();

		ctx.restore();
	}

	private getTimeX(time: number) {
		if (!this.viewport || this.candles.length === 0 || !Number.isFinite(time)) {
			return null;
		}

		const normalizedTime = this.normalizeTimestamp(time);
		const firstCandle = this.candles[0];
		const lastCandle = this.candles[this.candles.length - 1];

		if (!firstCandle || !lastCandle) {
			return null;
		}

		if (this.candles.length === 1) {
			return this.getCandleCenterX(0);
		}

		if (normalizedTime <= firstCandle.time) {
			const interval = this.getCandleTimeInterval(0);
			const offsetCandles = (firstCandle.time - normalizedTime) / interval;

			return this.getCandleCenterX(0) - offsetCandles * this.viewport.candleSpacing;
		}

		if (normalizedTime >= lastCandle.time) {
			const lastIndex = this.candles.length - 1;
			const interval = this.getCandleTimeInterval(lastIndex);
			const offsetCandles = (normalizedTime - lastCandle.time) / interval;

			return this.getCandleCenterX(lastIndex) + offsetCandles * this.viewport.candleSpacing;
		}

		const rightIndex = this.getFirstCandleIndexAtOrAfterTime(normalizedTime);
		const leftIndex = Math.max(0, rightIndex - 1);
		const leftCandle = this.candles[leftIndex];
		const rightCandle = this.candles[rightIndex];

		if (!leftCandle || !rightCandle || rightCandle.time === leftCandle.time) {
			return this.getCandleCenterX(leftIndex);
		}

		const ratio = (normalizedTime - leftCandle.time) / (rightCandle.time - leftCandle.time);

		return this.getCandleCenterX(leftIndex) + ratio * this.viewport.candleSpacing;
	}

	private normalizeTimestamp(time: number) {
		return time < 1e12 ? time * 1000 : time;
	}

	private getFirstCandleIndexAtOrAfterTime(time: number) {
		let low = 0;
		let high = this.candles.length - 1;

		while (low < high) {
			const mid = Math.floor((low + high) / 2);

			if (this.candles[mid].time < time) {
				low = mid + 1;
			} else {
				high = mid;
			}
		}

		return low;
	}

	private getCandleCenterX(candleIndex: number) {
		if (!this.viewport) {
			return 0;
		}

		return candleIndex * this.viewport.candleSpacing + this.viewport.offsetX + this.viewport.candleWidth / 2;
	}

	private getCandleTimeInterval(candleIndex: number) {
		const currentCandle = this.candles[candleIndex];
		const previousCandle = this.candles[candleIndex - 1];
		const nextCandle = this.candles[candleIndex + 1];

		if (currentCandle && nextCandle && nextCandle.time > currentCandle.time) {
			return nextCandle.time - currentCandle.time;
		}

		if (currentCandle && previousCandle && currentCandle.time > previousCandle.time) {
			return currentCandle.time - previousCandle.time;
		}

		return 60 * 1000;
	}

	private getTradeHandleRenderState({ price, type, trade }: DrawTradeHandleOptions): TradeHandleRenderState | null {
		if (!this.viewport) {
			return null;
		}

		const viewport = this.viewport;
		const y = this.getPriceY(price, viewport);
		const handleStyleConfig = this.getHandleStyleConfig(type);
		const handleConfig = handleStyleConfig.handle;
		const lineConfig = handleStyleConfig.handleLine;
		const handleWidth = this.getHandleWidth(handleConfig);
		const handleHeight = handleConfig.height;
		const handleX = this.getHandleX({
			handleWidth,
			config: handleConfig,
		});
		const handleY = y - handleHeight / 2;

		return {
			price,
			type,
			trade,
			viewport,
			y,
			handleStyleConfig,
			handleConfig,
			lineConfig,
			handleX,
			handleY,
			handleWidth,
			handleHeight,
		};
	}

	private getPriceY(price: number, viewport: ChartViewport) {
		return priceToY({
			price,
			minPrice: viewport.minPrice,
			priceRange: viewport.priceRange,
			chartHeight: this.#canvas.height,
		});
	}

	private addHandleHitbox(renderState: TradeHandleRenderState) {
		this.handleHitboxes.push(
			this.createHitBox({
				price: renderState.price,
				trade: renderState.trade,
				type: renderState.type,
				x: renderState.handleX,
				y: renderState.handleY,
				width: renderState.handleWidth,
				height: renderState.handleHeight,
				viewport: renderState.viewport,
			}),
		);
	}

	private addMissingProtectionHitbox(renderState: MissingProtectionHandleRenderState) {
		this.handleHitboxes.push(
			this.createMissingProtectionHitBox({
				price: renderState.price,
				trade: renderState.trade,
				type: renderState.type,
				x: renderState.handleX,
				y: renderState.handleY,
				width: renderState.handleWidth,
				height: renderState.handleHeight,
				viewport: renderState.viewport,
			}),
		);
	}

	private drawHandleHorizontalLines({
		handleX,
		handleWidth,
		y,
		lineConfig,
		blockedRanges = [],
	}: Pick<TradeHandleRenderState, "handleX" | "handleWidth" | "y" | "lineConfig"> & {
		blockedRanges?: LineBlockedRange[];
	}) {
		this.drawHorizontalLineAroundBlockedRanges({
			y,
			config: lineConfig,
			blockedRanges: [
				{
					x1: handleX,
					x2: handleX + handleWidth,
				},
				...blockedRanges,
			],
		});
	}

	private drawTemporaryProtectionHorizontalLines({
		handleX,
		handleWidth,
		y,
		lineConfig,
	}: Pick<TemporaryProtectionRenderState, "handleX" | "handleWidth" | "y" | "lineConfig">) {
		this.drawHorizontalLineAroundBlockedRanges({
			y,
			config: lineConfig,
			blockedRanges: [
				{
					x1: handleX,
					x2: handleX + handleWidth,
				},
			],
		});
	}

	private drawHorizontalLineAroundBlockedRanges({
		y,
		config,
		blockedRanges,
	}: {
		y: number;
		config: TradeHandleLineConfig;
		blockedRanges: LineBlockedRange[];
	}) {
		const mergedRanges = this.getMergedBlockedRanges(blockedRanges);
		let currentX = 0;

		for (const range of mergedRanges) {
			if (range.x1 > currentX) {
				this.drawHandleLine({
					x1: currentX,
					x2: range.x1,
					y,
					config,
				});
			}

			currentX = Math.max(currentX, range.x2);
		}

		if (currentX < this.#canvas.width) {
			this.drawHandleLine({
				x1: currentX,
				x2: this.#canvas.width,
				y,
				config,
			});
		}
	}

	private getMergedBlockedRanges(blockedRanges: LineBlockedRange[]) {
		const normalizedRanges = blockedRanges
			.map((range) => ({
				x1: Math.max(0, Math.min(range.x1, this.#canvas.width)),
				x2: Math.max(0, Math.min(range.x2, this.#canvas.width)),
			}))
			.filter((range) => range.x2 > range.x1)
			.sort((a, b) => a.x1 - b.x1);

		const mergedRanges: LineBlockedRange[] = [];

		for (const range of normalizedRanges) {
			const lastRange = mergedRanges.at(-1);

			if (!lastRange || range.x1 > lastRange.x2) {
				mergedRanges.push({ ...range });
				continue;
			}

			lastRange.x2 = Math.max(lastRange.x2, range.x2);
		}

		return mergedRanges;
	}

	private getHandleLineDash(config: TradeHandleLineConfig) {
		switch (config.style) {
			case "dashed":
				return config.dash ?? [4, 4];

			case "dotted":
				return config.dash ?? [2, 4];

			default:
				return [];
		}
	}

	private getHandleSections({
		handleType,
		handleConfig,
		trade,
	}: {
		handleType: TradeHandleType;
		handleConfig: TradeHandleRectConfig;
		trade: OpenTrade;
	}): HandleSection[] {
		const pnlLabel = this.getHandlePnLLabel({
			handleType,
			trade,
		});

		return [
			{
				label: `${trade.volume.toFixed(2)}L`,
				width: handleConfig.widthVolume,
				visible: handleConfig.showVolumeSection,
			},
			{
				label: pnlLabel,
				width: handleConfig.widthPNL,
				visible: handleConfig.showPnlSection,
				color: this.getHandlePnlTextColor({
					handleType,
					trade,
				}),
			},
			{
				label: "×",
				width: handleConfig.widthClose,
				visible: handleConfig.showCloseSection,
				color: handleConfig.closeButtonColor,
			},
		];
	}

	private drawHandleSectionLabel({ section, currentX, y }: { section: HandleSection; currentX: number; y: number }) {
		const ctx = this.#ctx;
		const sharedConfig = CHART_CONFIG.tradeHandles;
		const sectionCenterX = currentX + section.width / 2;

		ctx.fillStyle = section.color ?? sharedConfig.textColor;
		ctx.fillText(section.label, sectionCenterX - ctx.measureText(section.label).width / 2, y);
	}

	private drawHandleSectionDivider({
		x,
		y1,
		y2,
		config,
	}: {
		x: number;
		y1: number;
		y2: number;
		config: TradeHandleRectConfig;
	}) {
		const ctx = this.#ctx;

		ctx.strokeStyle = config.sectionDividerColor;
		ctx.lineWidth = 1;

		ctx.beginPath();
		ctx.moveTo(x, y1);
		ctx.lineTo(x, y2);
		ctx.stroke();
	}

	private getMissingProtectionRenderStates({
		trade,
		startPriceRenderState,
	}: {
		trade: OpenTrade;
		startPriceRenderState: TradeHandleRenderState;
	}) {
		if (!CHART_CONFIG.tradeHandles.missingProtectionHandles.visible) {
			return [];
		}

		const missingHandleTypes = this.getMissingProtectionHandleTypes(trade);

		return missingHandleTypes.map((type) =>
			this.getMissingProtectionHandleRenderState({
				type,
				trade,
				startPriceRenderState,
				visibleTypes: missingHandleTypes,
			}),
		);
	}

	private getMissingProtectionHandleTypes(trade: OpenTrade): TradeProtectionHandleType[] {
		const missingTypes: TradeProtectionHandleType[] = [];

		if (!trade.sl) {
			missingTypes.push("stopLoss");
		}

		if (!trade.tp) {
			missingTypes.push("takeProfit");
		}

		return missingTypes;
	}

	private getMissingProtectionHandleRenderState({
		type,
		trade,
		startPriceRenderState,
		visibleTypes,
	}: {
		type: TradeProtectionHandleType;
		trade: OpenTrade;
		startPriceRenderState: TradeHandleRenderState;
		visibleTypes: TradeProtectionHandleType[];
	}): MissingProtectionHandleRenderState {
		const config = this.getMissingProtectionHandleConfig(type);
		const handleWidth = config.width;
		const handleHeight = config.height;
		const handleX = this.getMissingProtectionHandleX({
			type,
			config,
			startPriceRenderState,
			visibleTypes,
		});
		const handleY = startPriceRenderState.y - handleHeight / 2;

		return {
			price: trade.openPrice,
			type,
			trade,
			viewport: startPriceRenderState.viewport,
			y: startPriceRenderState.y,
			config,
			handleX,
			handleY,
			handleWidth,
			handleHeight,
		};
	}

	private getMissingProtectionHandleX({
		type,
		config,
		startPriceRenderState,
		visibleTypes,
	}: {
		type: TradeProtectionHandleType;
		config: MissingTradeProtectionHandleRectConfig;
		startPriceRenderState: TradeHandleRenderState;
		visibleTypes: TradeProtectionHandleType[];
	}) {
		const visibleIndex = visibleTypes.indexOf(type);
		const offset = config.gapFromStartPriceHandle + visibleIndex * (config.width + config.gapBetweenHandles);

		if (config.placement === "left") {
			return startPriceRenderState.handleX - offset - config.width;
		}

		return startPriceRenderState.handleX + startPriceRenderState.handleWidth + offset;
	}

	private getLineBlockedRangesFromMissingProtectionHandles(renderStates: MissingProtectionHandleRenderState[]) {
		return renderStates.map((renderState) => ({
			x1: renderState.handleX,
			x2: renderState.handleX + renderState.handleWidth,
		}));
	}

	private getMissingProtectionHandleConfig(type: TradeProtectionHandleType) {
		const config = CHART_CONFIG.tradeHandles.missingProtectionHandles;

		return type === "stopLoss" ? config.slHandle : config.tpHandle;
	}

	private drawMissingProtectionHandleRect({ x, y, width, config }: DrawMissingProtectionHandleRectOptions) {
		const ctx = this.#ctx;

		this.clearRectArea({
			x,
			y,
			width,
			height: config.height,
			padding: Math.max(1, config.borderWidth),
		});

		ctx.save();

		ctx.globalAlpha = config.backgroundOpacity;
		ctx.fillStyle = config.backgroundColor;
		ctx.fillRect(x, y, width, config.height);

		ctx.globalAlpha = config.borderOpacity;
		ctx.strokeStyle = config.borderColor;
		ctx.lineWidth = config.borderWidth;
		ctx.strokeRect(x, y, width, config.height);

		ctx.restore();
	}

	private drawMissingProtectionHandleLabel({
		type,
		handleX,
		y,
		handleWidth,
		config,
	}: MissingProtectionHandleRenderState) {
		const ctx = this.#ctx;
		const label = type === "stopLoss" ? "SL" : "TP";
		const labelCenterX = handleX + handleWidth / 2;

		ctx.save();

		ctx.font = config.font;
		ctx.textBaseline = "middle";
		ctx.globalAlpha = config.textOpacity;
		ctx.fillStyle = config.textColor;
		ctx.fillText(label, labelCenterX - ctx.measureText(label).width / 2, y);

		ctx.restore();
	}

	private drawTemporaryProtectionDrag() {
		const renderState = this.getTemporaryProtectionRenderState();

		if (!renderState) {
			return;
		}

		this.drawTemporaryProtectionHorizontalLines(renderState);

		this.drawTemporaryProtectionHandleRect({
			x: renderState.handleX,
			y: renderState.handleY,
			width: renderState.handleWidth,
			config: renderState.handleConfig,
		});

		this.drawTemporaryProtectionPnLLabel(renderState);
	}

	private getTemporaryProtectionRenderState(): TemporaryProtectionRenderState | null {
		if (!this.temporaryProtectionDrag) {
			return null;
		}

		const { trade, type, viewport } = this.temporaryProtectionDrag;
		const price = this.constrainProtectionPrice({
			price: this.temporaryProtectionDrag.price,
			trade,
			type,
		});
		const y = this.getPriceY(price, viewport);
		const handleConfig = this.getTemporaryProtectionHandleConfig(type);
		const lineConfig = this.getTemporaryProtectionLineConfig(type);
		const handleWidth = handleConfig.widthPNL;
		const handleHeight = handleConfig.height;
		const handleX = this.getTemporaryProtectionHandleX({
			handleWidth,
			config: handleConfig,
		});
		const handleY = y - handleHeight / 2;

		return {
			price,
			type,
			trade,
			viewport,
			y,
			handleConfig,
			lineConfig,
			handleX,
			handleY,
			handleWidth,
			handleHeight,
		};
	}

	private getTemporaryProtectionHandleConfig(type: TradeProtectionHandleType) {
		const config = CHART_CONFIG.tradeHandles.missingProtectionHandles;

		return type === "stopLoss" ? config.temporarySlHandle : config.temporaryTpHandle;
	}

	private getTemporaryProtectionLineConfig(type: TradeProtectionHandleType) {
		const config = CHART_CONFIG.tradeHandles.missingProtectionHandles;

		return type === "stopLoss" ? config.temporarySlLine : config.temporaryTpLine;
	}

	private drawTemporaryProtectionHandleRect({ x, y, width, config }: DrawTemporaryProtectionHandleRectOptions) {
		const ctx = this.#ctx;

		this.clearRectArea({
			x,
			y,
			width,
			height: config.height,
			padding: Math.max(1, config.borderWidth),
		});

		ctx.save();

		ctx.globalAlpha = config.backgroundOpacity;
		ctx.fillStyle = config.backgroundColor;
		ctx.fillRect(x, y, width, config.height);

		ctx.globalAlpha = config.borderOpacity;
		ctx.strokeStyle = config.borderColor;
		ctx.lineWidth = config.borderWidth;
		ctx.strokeRect(x, y, width, config.height);

		ctx.restore();
	}

	private drawTemporaryProtectionPnLLabel({
		trade,
		type,
		price,
		handleX,
		y,
		handleWidth,
		handleConfig,
	}: TemporaryProtectionRenderState) {
		const ctx = this.#ctx;
		const projectedPnL = calculatePotentialPnlUsd(trade.type, trade.openPrice, price, trade.volume, trade.symbol);
		const label = this.formatPnlLabel(projectedPnL);
		const labelCenterX = handleX + handleWidth / 2;

		ctx.save();

		ctx.font = handleConfig.font;
		ctx.textBaseline = "middle";
		ctx.globalAlpha = handleConfig.textOpacity;
		ctx.fillStyle = this.getProtectionPnlTextColor(type);
		ctx.fillText(label, labelCenterX - ctx.measureText(label).width / 2, y);

		ctx.restore();
	}

	private clearRectArea({
		x,
		y,
		width,
		height,
		padding = 0,
	}: {
		x: number;
		y: number;
		width: number;
		height: number;
		padding?: number;
	}) {
		this.#ctx.clearRect(x - padding, y - padding, width + padding * 2, height + padding * 2);
	}

	private getPositionedHandleX({
		handleWidth,
		position,
	}: {
		handleWidth: number;
		position: TradeHandleRectConfig["position"];
	}) {
		const canvasWidth = this.#canvas.width;

		switch (position.placement) {
			case "left":
				return position.margin ?? 0;

			case "center":
				return canvasWidth / 2 - handleWidth / 2;

			case "right":
				return canvasWidth - handleWidth - (position.margin ?? 0);
		}
	}

	private getHandlePnlTextColor({ handleType, trade }: { handleType: TradeHandleType; trade: OpenTrade }) {
		if (handleType === "stopLoss") {
			return this.getProtectionPnlTextColor("stopLoss");
		}

		if (handleType === "takeProfit") {
			return this.getProtectionPnlTextColor("takeProfit");
		}

		return trade.pnl >= 0
			? CHART_CONFIG.tradeHandles.pnlTextColors.positive
			: CHART_CONFIG.tradeHandles.pnlTextColors.negative;
	}

	private getProtectionPnlTextColor(type: TradeProtectionHandleType) {
		return type === "takeProfit"
			? CHART_CONFIG.tradeHandles.pnlTextColors.positive
			: CHART_CONFIG.tradeHandles.pnlTextColors.negative;
	}

	private isBuyTrade(trade: OpenTrade) {
		return String(trade.type).toLowerCase().includes("buy");
	}

	private formatPnlLabel(pnl: number) {
		return `${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}`;
	}
}
