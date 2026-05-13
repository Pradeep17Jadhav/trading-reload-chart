//TradeLayer.ts

import { CHART_CONFIG } from "../../../config/chartConfig";
import type {
	TradeHandleLineConfig,
	TradeHandleRectConfig,
	TradeHandleStyleConfig,
} from "../../../config/chartConfig.types";
import type { Candle } from "../../../models/Candle";
import type { ChartViewport } from "../../../models/ChartViewport";
import type { OpenTrade } from "../../../models/Trade";
import { priceToY } from "../helpers/LayerHelpers";
import { calculatePotentialPnlUsd } from "./TradeLayer.helpers";

type TradeLayerOptions = {
	canvas: HTMLCanvasElement;
};

type TradeHandleType = "startPrice" | "stopLoss" | "takeProfit";

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
export class TradeLayer {
	readonly #canvas: HTMLCanvasElement;
	readonly #ctx: CanvasRenderingContext2D;

	trades: OpenTrade[] = [];
	viewport: ChartViewport | null = null;
	liveCandle: Candle | null = null;

	constructor(options: TradeLayerOptions) {
		this.#canvas = options.canvas;

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

	render() {
		const ctx = this.#ctx;

		ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);

		for (const trade of this.trades) {
			this.drawTrade({
				trade,
			});
		}
	}

	drawTrade({ trade }: { trade: OpenTrade }) {
		this.drawTradeHandle({
			price: trade.openPrice,
			type: "startPrice",
			trade,
		});

		this.drawTradeHandle({
			price: trade.sl,
			type: "stopLoss",
			trade,
		});

		this.drawTradeHandle({
			price: trade.tp,
			type: "takeProfit",
			trade,
		});
	}

	drawTradeHandle({ price, type, trade }: { price: number; type: TradeHandleType; trade: OpenTrade }) {
		const chartHeight = this.#canvas.height;

		if (!this.viewport) {
			return;
		}

		const y = priceToY({
			price,
			minPrice: this.viewport.minPrice,
			priceRange: this.viewport.priceRange,
			chartHeight,
		});

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

		/**
		 * =========================
		 * Horizontal Line
		 * =========================
		 */

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

		/**
		 * =========================
		 * Main Handle Container
		 * =========================
		 */
		this.drawHandleRect({
			x: handleX,
			y: handleY,
			width: handleWidth,
			config: handleConfig,
		});

		/**
		 * =========================
		 * Sections
		 * =========================
		 */
		this.drawHandleSections({
			handleType: type,
			handleX,
			handleY,
			handleWidth,
			handleHeight,
			handleConfig,
			trade,
			y,
		});
	}

	drawHandleLine({ x1, x2, y, config }: { x1: number; x2: number; y: number; config: TradeHandleLineConfig }) {
		const ctx = this.#ctx;

		ctx.save();

		ctx.globalAlpha = config.opacity;
		ctx.strokeStyle = config.color;
		ctx.lineWidth = config.width;

		switch (config.style) {
			case "dashed":
				ctx.setLineDash(config.dash ?? [4, 4]);
				break;

			case "dotted":
				ctx.setLineDash([2, 4]);
				break;

			default:
				ctx.setLineDash([]);
				break;
		}

		ctx.beginPath();
		ctx.moveTo(x1, y);
		ctx.lineTo(x2, y);
		ctx.stroke();

		ctx.restore();
	}

	drawHandleRect({ x, y, width, config }: { x: number; y: number; width: number; config: TradeHandleRectConfig }) {
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
	}: {
		handleType: TradeHandleType;
		handleX: number;
		handleY: number;
		handleWidth: number;
		handleHeight: number;
		handleConfig: TradeHandleRectConfig;
		trade: OpenTrade;
		y: number;
	}) {
		const ctx = this.#ctx;

		const sharedConfig = CHART_CONFIG.tradeHandles;

		const pnlLabel = this.getHandlePnLLabel({
			handleType,
			trade,
		});

		const sections: {
			label: string;
			width: number;
			visible: boolean;
			color?: string;
		}[] = [
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

		let currentX = handleX;

		ctx.save();

		ctx.font = sharedConfig.font;
		ctx.textBaseline = "middle";
		ctx.globalAlpha = sharedConfig.textOpacity;

		for (const section of sections) {
			if (!section.visible) {
				continue;
			}

			const sectionCenterX = currentX + section.width / 2;

			ctx.fillStyle = section.color ?? sharedConfig.textColor;

			ctx.fillText(section.label, sectionCenterX - ctx.measureText(section.label).width / 2, y);

			currentX += section.width;

			/**
			 * Divider
			 */
			if (currentX < handleX + handleWidth) {
				ctx.strokeStyle = handleConfig.sectionDividerColor;
				ctx.lineWidth = 1;

				ctx.beginPath();
				ctx.moveTo(currentX, handleY + 4);
				ctx.lineTo(currentX, handleY + handleHeight - 4);
				ctx.stroke();
			}
		}

		ctx.restore();
	}

	getHandlePnLLabel({ handleType, trade }: { handleType: TradeHandleType; trade: OpenTrade }) {
		if (handleType === "startPrice") {
			return `${trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}`;
		}
		const targetPrice = handleType === "stopLoss" ? trade.sl : trade.tp;
		const projectedPnL = calculatePotentialPnlUsd(trade.type, trade.openPrice, targetPrice, trade.volume, trade.symbol);
		return `${projectedPnL >= 0 ? "+" : ""}${projectedPnL.toFixed(2)}`;
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
}
