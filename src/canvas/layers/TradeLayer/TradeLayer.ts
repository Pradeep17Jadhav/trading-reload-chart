// TradeLayer.ts

import { CHART_CONFIG } from "../../../config/chartConfig";
import type {
	TradeHandleLineConfig,
	TradeHandleRectConfig,
	TradeHandleStyleConfig,
} from "../../../config/chartConfig.types";
import { normalizePrice } from "../../../helpers/math";
import type { Candle } from "../../../models/Candle";
import type { ChartViewport } from "../../../models/ChartViewport";
import type { OpenTrade } from "../../../models/Trade";
import { priceToY } from "../helpers/LayerHelpers";
import { calculatePotentialPnlUsd } from "./TradeLayer.helpers";
import type { TradeHandleHitbox, TradeHandleType, TradeLayerOptions } from "./TradeLayer.types";

/**
 * TradeHandle
 *
 * Reusable visual structure
 * used for rendering:
 *
 * - Pending order SL/TP/Entry
 * - Active order SL/TP/Entry
 *
 * Structure:
 * - Horizontal line
 * - Information rectangle
 */
type TradeHandleRenderState = {
	price: number;
	type: TradeHandleType;
	trade: OpenTrade;
	viewport: ChartViewport;
	y: number;
	handleStyleConfig: TradeHandleStyleConfig;
	handleConfig: TradeHandleRectConfig;
	lineConfig: TradeHandleLineConfig;
	handleX: number;
	handleY: number;
	handleWidth: number;
	handleHeight: number;
};

type DrawTradeHandleOptions = {
	price: number;
	type: TradeHandleType;
	trade: OpenTrade;
};

type CreateHitBoxOptions = {
	price: number;
	trade: OpenTrade;
	type: TradeHandleType;
	x: number;
	y: number;
	width: number;
	height: number;
	viewport: ChartViewport;
};

type DrawHandleLineOptions = {
	x1: number;
	x2: number;
	y: number;
	config: TradeHandleLineConfig;
};

type DrawHandleRectOptions = {
	x: number;
	y: number;
	width: number;
	config: TradeHandleRectConfig;
};

type DrawHandleSectionsOptions = {
	handleType: TradeHandleType;
	handleX: number;
	handleY: number;
	handleWidth: number;
	handleHeight: number;
	handleConfig: TradeHandleRectConfig;
	trade: OpenTrade;
	y: number;
};

type HandleSection = {
	label: string;
	width: number;
	visible: boolean;
	color?: string;
};

export class TradeLayer {
	readonly #canvas: HTMLCanvasElement;
	readonly #ctx: CanvasRenderingContext2D;

	isDragging: boolean;
	trades: OpenTrade[] = [];
	viewport: ChartViewport | null = null;
	liveCandle: Candle | null = null;
	handleHitboxes: TradeHandleHitbox[] = [];

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

	setViewport(viewport: ChartViewport) {
		this.viewport = viewport;
	}

	setLiveCandle(candle: Candle) {
		this.liveCandle = candle;
	}

	setIsDragging(isDragging: boolean) {
		this.isDragging = isDragging;
	}

	renderLiveFeed() {
		if (!this.isDragging) {
			this.render();
		}
	}

	render() {
		this.clearCanvas();
		this.resetHitboxes();

		for (const trade of this.trades) {
			this.drawTrade({
				trade,
			});
		}
	}

	createHitBox = ({ price, trade, type, x, y, width, height, viewport }: CreateHitBoxOptions) => {
		const { showCloseSection, widthClose } = this.getHandleStyleConfig(type).handle;
		const closeButtonWidth = showCloseSection ? widthClose : 0;
		const labelAreaWidth = width - closeButtonWidth;
		const closeButtonAreaX = x + width - closeButtonWidth;

		return {
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

	drawTrade({ trade }: { trade: OpenTrade }) {
		this.drawTradeHandle({
			price: trade.openPrice,
			type: "startPrice",
			trade,
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
	}

	drawTradeHandle({ price, type, trade }: DrawTradeHandleOptions) {
		const renderState = this.getTradeHandleRenderState({
			price,
			type,
			trade,
		});

		if (!renderState) {
			return;
		}

		this.addHandleHitbox(renderState);
		this.drawHandleHorizontalLines(renderState);

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

	drawHandleRect({ x, y, width, config }: DrawHandleRectOptions) {
		const ctx = this.#ctx;

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
		const canvasWidth = this.#canvas.width;

		switch (config.position.placement) {
			case "left":
				return config.position.margin ?? 0;

			case "center":
				return canvasWidth / 2 - handleWidth / 2;

			case "right":
				return canvasWidth - handleWidth - (config.position.margin ?? 0);
		}
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

	private clearCanvas() {
		this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
	}

	private resetHitboxes() {
		this.handleHitboxes = [];
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

	private drawHandleHorizontalLines({
		handleX,
		handleWidth,
		y,
		lineConfig,
	}: Pick<TradeHandleRenderState, "handleX" | "handleWidth" | "y" | "lineConfig">) {
		/**
		 * Left side line
		 */
		if (handleX > 0) {
			this.drawHandleLine({
				x1: 0,
				x2: handleX,
				y,
				config: lineConfig,
			});
		}

		/**
		 * Right side line
		 */
		const rightLineStartX = handleX + handleWidth;

		if (rightLineStartX < this.#canvas.width) {
			this.drawHandleLine({
				x1: rightLineStartX,
				x2: this.#canvas.width,
				y,
				config: lineConfig,
			});
		}
	}

	private getHandleLineDash(config: TradeHandleLineConfig) {
		switch (config.style) {
			case "dashed":
				return config.dash ?? [4, 4];

			case "dotted":
				return [2, 4];

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

	private formatPnlLabel(pnl: number) {
		return `${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}`;
	}
}
