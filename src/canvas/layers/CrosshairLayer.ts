import { CHART_CONFIG } from "../../config/chartConfig";

type CrosshairStyle = "solid" | "dashed" | "dotted";

type CrosshairLayerOptions = {
	canvas: HTMLCanvasElement;
	crosshairColor?: string;
	crosshairThickness?: number;
	crosshairStyle?: CrosshairStyle;
};

type UpdateMousePositionOptions = {
	snapX?: number;
};

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
		const rect = this.#canvas.getBoundingClientRect();
		const scaleX = this.#canvas.width / rect.width;
		const scaleY = this.#canvas.height / rect.height;

		const localX = (x - rect.left) * scaleX;
		const localY = (y - rect.top) * scaleY;

		const resolvedX = options.snapX ?? localX;

		this.mouseX = Math.max(0, Math.min(this.#canvas.width, resolvedX));
		this.mouseY = Math.max(0, Math.min(this.#canvas.height, localY));
		this.visible = true;
	}

	hide() {
		this.visible = false;
	}

	applyCrosshairStyle() {
		const ctx = this.#ctx;

		ctx.strokeStyle = this.crosshairColor;
		ctx.lineWidth = this.crosshairThickness;

		switch (this.crosshairStyle) {
			case "solid":
				ctx.setLineDash([]);
				break;

			case "dashed":
				ctx.setLineDash([8, 6]);
				break;

			case "dotted":
				ctx.setLineDash([2, 6]);
				break;
		}
	}

	drawVerticalCrosshairLine(ctx: CanvasRenderingContext2D, height: number) {
		ctx.beginPath();
		ctx.moveTo(this.mouseX, 0);
		ctx.lineTo(this.mouseX, height);
		ctx.stroke();
	}

	drawHorizontalCrosshairLine(ctx: CanvasRenderingContext2D, width: number) {
		ctx.beginPath();
		ctx.moveTo(0, this.mouseY);
		ctx.lineTo(width, this.mouseY);
		ctx.stroke();
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
}
