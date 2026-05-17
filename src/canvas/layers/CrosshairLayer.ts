import { CHART_CONFIG } from "../../config/chartConfig";
import type { CanvasPoint } from "../../chart/utils/getCanvasPoint.types";
import type {
	CrosshairLayerOptions,
	CrosshairStyle,
	UpdateMousePositionOptions,
} from "./CrosshairLayer.types";

export class CrosshairLayer {
	readonly #canvas: HTMLCanvasElement;
	readonly #ctx: CanvasRenderingContext2D;

	mouseX = 0;
	mouseY = 0;
	visible = false;
	crosshairColor: string;
	crosshairThickness: number;
	crosshairStyle: CrosshairStyle;

	constructor(options: CrosshairLayerOptions) {
		this.#canvas = options.canvas;

		const ctx = this.#canvas.getContext("2d");

		if (!ctx) {
			throw new Error("Canvas 2D context not supported");
		}

		this.#ctx = ctx;
		this.crosshairColor = options.crosshairColor ?? CHART_CONFIG.crosshair.color;
		this.crosshairThickness = options.crosshairThickness ?? CHART_CONFIG.crosshair.thickness;
		this.crosshairStyle = options.crosshairStyle ?? CHART_CONFIG.crosshair.style;
	}

	updateMousePosition(x: number, y: number, options: UpdateMousePositionOptions = {}) {
		const localPoint = this.getLocalCanvasPoint(x, y);
		const resolvedX = options.snapX ?? localPoint.x;

		this.mouseX = this.clampX(resolvedX);
		this.mouseY = this.clampY(localPoint.y);
		this.visible = true;
	}

	hide() {
		this.visible = false;
	}

	applyCrosshairStyle() {
		const ctx = this.#ctx;

		ctx.strokeStyle = this.crosshairColor;
		ctx.lineWidth = this.crosshairThickness;
		ctx.setLineDash(this.getLineDash());
	}

	drawVerticalCrosshairLine(ctx: CanvasRenderingContext2D, height: number) {
		this.drawLine({
			ctx,
			fromX: this.mouseX,
			fromY: 0,
			toX: this.mouseX,
			toY: height,
		});
	}

	drawHorizontalCrosshairLine(ctx: CanvasRenderingContext2D, width: number) {
		this.drawLine({
			ctx,
			fromX: 0,
			fromY: this.mouseY,
			toX: width,
			toY: this.mouseY,
		});
	}

	render() {
		const ctx = this.#ctx;
		const width = this.#canvas.width;
		const height = this.#canvas.height;

		ctx.clearRect(0, 0, width, height);

		if (!this.visible) {
			return;
		}

		ctx.save();
		this.applyCrosshairStyle();
		this.drawVerticalCrosshairLine(ctx, height);
		this.drawHorizontalCrosshairLine(ctx, width);
		ctx.restore();
	}

	private getLocalCanvasPoint(clientX: number, clientY: number): CanvasPoint {
		const rect = this.#canvas.getBoundingClientRect();
		const scaleX = this.#canvas.width / rect.width;
		const scaleY = this.#canvas.height / rect.height;

		return {
			x: (clientX - rect.left) * scaleX,
			y: (clientY - rect.top) * scaleY,
		};
	}

	private clampX(x: number) {
		return this.clamp(x, 0, this.#canvas.width);
	}

	private clampY(y: number) {
		return this.clamp(y, 0, this.#canvas.height);
	}

	private clamp(value: number, min: number, max: number) {
		return Math.max(min, Math.min(max, value));
	}

	private getLineDash() {
		switch (this.crosshairStyle) {
			case "solid":
				return [];

			case "dashed":
				return [8, 6];

			case "dotted":
				return [2, 6];
		}
	}

	private drawLine({
		ctx,
		fromX,
		fromY,
		toX,
		toY,
	}: {
		ctx: CanvasRenderingContext2D;
		fromX: number;
		fromY: number;
		toX: number;
		toY: number;
	}) {
		ctx.beginPath();
		ctx.moveTo(fromX, fromY);
		ctx.lineTo(toX, toY);
		ctx.stroke();
	}
}
