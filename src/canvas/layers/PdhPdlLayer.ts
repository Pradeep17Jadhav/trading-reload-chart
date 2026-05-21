import type { PreviousDayHighLowConfig } from "../../config/chartConfig.types";
import type { ChartViewport } from "../../models/ChartViewport.types";
import { priceToY } from "./helpers/LayerHelpers";

export type PreviousDay = {
	high: number;
	low: number;
};

type PdhPdlLayerOptions = {
	ctx: CanvasRenderingContext2D;
	config: PreviousDayHighLowConfig;
};

export class PdhPdlLayer {
	readonly #ctx: CanvasRenderingContext2D;

	#config: PreviousDayHighLowConfig;
	#viewport: ChartViewport | null = null;
	#previousDay: PreviousDay | null = null;

	constructor({ ctx, config }: PdhPdlLayerOptions) {
		this.#ctx = ctx;
		this.#config = config;
	}

	setViewport(viewport: ChartViewport) {
		this.#viewport = viewport;
	}

	setConfig(config: PreviousDayHighLowConfig) {
		this.#config = config;
	}

	setPreviousDay(data: PreviousDay | null | undefined) {
		this.#previousDay = data ?? null;
	}

	/**
	 * Draws PDH/PDL lines onto the shared canvas.
	 * The caller is responsible for clearing the canvas before rendering;
	 * this layer only appends on top of whatever is already drawn.
	 */
	render() {
		if (!this.#viewport || !this.#previousDay) {
			return;
		}

		const { high, low } = this.#previousDay;

		if (Number.isFinite(high) && high > 0) {
			this.#drawLine(high, "PDH");
		}

		if (Number.isFinite(low) && low > 0) {
			this.#drawLine(low, "PDL");
		}
	}

	#drawLine(price: number, label: string) {
		if (!this.#viewport) {
			return;
		}

		const ctx = this.#ctx;
		const canvas = ctx.canvas;

		const y = priceToY({
			price,
			minPrice: this.#viewport.minPrice,
			priceRange: this.#viewport.priceRange,
			chartHeight: canvas.height,
		});

		if (y < 0 || y > canvas.height) {
			return;
		}

		const { line, text } = this.#config;
		const canvasWidth = canvas.width;

		ctx.save();

		ctx.font = text.font;
		const textWidth = ctx.measureText(label).width;
		const centerX = canvasWidth / 2;
		const halfGap = textWidth / 2 + text.paddingX;

		ctx.globalAlpha = line.opacity;
		ctx.strokeStyle = line.color;
		ctx.lineWidth = line.width;
		ctx.setLineDash(line.dash);

		ctx.beginPath();
		ctx.moveTo(0, y);
		ctx.lineTo(centerX - halfGap, y);
		ctx.stroke();

		ctx.beginPath();
		ctx.moveTo(centerX + halfGap, y);
		ctx.lineTo(canvasWidth, y);
		ctx.stroke();

		ctx.setLineDash([]);
		ctx.globalAlpha = 1;
		ctx.fillStyle = text.color;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(label, centerX, y);

		ctx.restore();
	}
}
