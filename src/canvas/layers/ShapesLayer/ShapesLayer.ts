import type { Candle } from "../../../models/Candle.types";
import type { ChartViewport } from "../../../models/ChartViewport.types";
import { priceToY, yToPrice } from "../helpers/LayerHelpers";
import { FibRetracementShape } from "./FibRetracementShape";
import { LineShape } from "./LineShape";
import { PathShape } from "./PathShape";
import { RectangleShape } from "./RectangleShape";
import {
	createVertexFromPoint,
	generateShapeId,
	getAverageCandleTimeStep,
	getCanvasPoint,
	getFutureCandleTime,
	getNearestCandleIndexByTime,
	hasPrimaryButton,
	isPointInsideHandle,
} from "./ShapesLayer.helpers";
import type {
	ActiveShapeDraft,
	ActiveShapeEdit,
	PartialShapeConfig,
	Shape,
	ShapeAddedPayload,
	ShapeConfig,
	ShapeCoordinateConverter,
	ShapeHandleHitbox,
	ShapeModifiedPayload,
	ShapePoint,
	ShapesLayerOptions,
	InternalDragState,
	ShapeToolType,
	ShapeVertex,
} from "./ShapesLayer.types";
import { ShortLongPosition } from "./ShortLongPosition";

export class ShapesLayer {
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
	activeSymbol: string;
	candles: Candle[];
	viewport: ChartViewport | null = null;
	shapes: Shape[];
	activeTool: ShapeToolType | null;
	config: ShapeConfig;
	selectedShapeId: string | null = null;
	hoveredShapeId: string | null = null;
	handleHitboxes: ShapeHandleHitbox[] = [];

	private draft: ActiveShapeDraft | null = null;
	private dragState: InternalDragState | null = null;
	private onShapeAdded?: (payload: ShapeAddedPayload) => void;
	private onShapeModified?: (payload: ShapeModifiedPayload) => void;
	private onToolChange?: (tool: ShapeToolType | null) => void;

	constructor(options: ShapesLayerOptions) {
		this.canvas = options.canvas;

		const ctx = this.canvas.getContext("2d");

		if (!ctx) {
			throw new Error("Failed to get 2d context for ShapesLayer");
		}

		this.ctx = ctx;
		this.activeSymbol = options.activeSymbol;
		this.candles = options.candles;
		this.shapes = options.shapes;
		this.activeTool = options.activeTool ?? null;
		this.config = this.mergeConfig(options.config);
		this.onShapeAdded = options.onShapeAdded;
		this.onShapeModified = options.onShapeModified;
		this.onToolChange = options.onToolChange;
	}

	setCandles(candles: Candle[]) {
		this.candles = candles;
	}

	setViewport(viewport: ChartViewport) {
		this.viewport = viewport;
	}

	setShapes(shapes: Shape[]) {
		this.shapes = shapes;
		this.rebuildHandleHitboxes();
	}

	setActiveTool(tool: ShapeToolType | null) {
		this.activeTool = tool;

		if (!tool) {
			this.draft = null;
		}

		this.canvas.style.cursor = tool ? "crosshair" : "default";
	}

	clearHoverState() {
		this.hoveredShapeId = null;
		this.canvas.style.cursor = this.activeTool ? "crosshair" : "default";
	}

	render() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		if (!this.viewport) {
			return;
		}

		const converter = this.getConverter();

		for (const shape of this.shapes) {
			this.drawShape({
				shape,
				converter,
				selected: shape.id === this.selectedShapeId,
				hovered: shape.id === this.hoveredShapeId,
			});
		}

		this.drawDraft(converter);
		this.rebuildHandleHitboxes();
	}

	handlePointerEvent(event: PointerEvent | MouseEvent): boolean {
		if (!this.viewport || this.candles.length === 0) {
			return false;
		}

		if (event.type === "contextmenu") {
			return this.handleContextMenu();
		}

		if (event.type === "pointerdown" || event.type === "mousedown") {
			return this.handlePointerDown(event);
		}

		if (event.type === "pointermove" || event.type === "mousemove") {
			return this.handlePointerMove(event);
		}

		if (event.type === "pointerup" || event.type === "mouseup") {
			return this.handlePointerUp();
		}

		return false;
	}

	handleKeyboardEvent(event: KeyboardEvent): boolean {
		if (event.key === "Escape" && this.draft?.type === "path") {
			this.completePathDraft();
			return true;
		}

		if (event.key === "Escape" && this.draft) {
			this.draft = null;
			this.setActiveToolAndEmit(null);
			return true;
		}

		if (event.key === "Escape" && this.selectedShapeId) {
			this.selectedShapeId = null;
			return true;
		}

		return false;
	}

	private handlePointerDown(event: PointerEvent | MouseEvent): boolean {
		const point = getCanvasPoint(this.canvas, event);
		const converter = this.getConverter();
		const vertex = createVertexFromPoint(point, converter);

		if (this.activeTool) {
			if (!hasPrimaryButton(event)) {
				return true;
			}

			this.handleToolPointerDown({
				point,
				vertex,
			});

			return true;
		}

		if (!hasPrimaryButton(event)) {
			return false;
		}

		const handleHit = this.findHandleAtPoint(point);

		if (handleHit) {
			const shape = this.shapes.find((candidate) => candidate.id === handleHit.shapeId);

			if (!shape) {
				return false;
			}

			this.selectedShapeId = shape.id;
			this.dragState = {
				edit: {
					mode: "resize",
					shape,
					handleType: handleHit.type,
					handleIndex: handleHit.index,
					startPoint: point,
					startVertex: vertex,
				},
				lastModifiedShape: shape,
			};
			this.canvas.style.cursor = handleHit.cursor ?? "grab";

			return true;
		}

		const hitShape = this.findShapeAtPoint(point);

		if (hitShape) {
			// Check if the click lands on a handle of the hit shape.
			// Handles are only rendered when selected, but we check them here too
			// so the very first click on a handle goes straight to resize mode
			// instead of accidentally entering move mode.
			const handleOnHitShape = this.findHandleAtPointForShape(hitShape, point);

			if (handleOnHitShape) {
				this.selectedShapeId = hitShape.id;
				this.dragState = {
					edit: {
						mode: "resize",
						shape: hitShape,
						handleType: handleOnHitShape.type,
						handleIndex: handleOnHitShape.index,
						startPoint: point,
						startVertex: vertex,
					},
					lastModifiedShape: hitShape,
				};
				this.canvas.style.cursor = handleOnHitShape.cursor ?? "grab";

				return true;
			}

			this.selectedShapeId = hitShape.id;
			this.hoveredShapeId = hitShape.id;
			this.dragState = {
				edit: {
					mode: "move",
					shape: hitShape,
					startPoint: point,
					startVertex: vertex,
				},
				lastModifiedShape: hitShape,
			};
			this.canvas.style.cursor = "move";

			return true;
		}

		this.selectedShapeId = null;
		this.hoveredShapeId = null;
		this.canvas.style.cursor = "default";

		return false;
	}

	private handlePointerMove(event: PointerEvent | MouseEvent): boolean {
		const point = getCanvasPoint(this.canvas, event);
		const converter = this.getConverter();
		const vertex = createVertexFromPoint(point, converter);

		if (this.draft) {
			this.updateDraftPreview(vertex);
			return true;
		}

		if (this.dragState) {
			const modifiedShape = this.applyDrag(vertex);

			this.dragState.lastModifiedShape = modifiedShape;
			this.emitShapeModified(modifiedShape);
			return true;
		}

		if (this.activeTool) {
			this.canvas.style.cursor = "crosshair";
			return true;
		}

		const handleHit = this.findHandleAtPoint(point);

		if (handleHit) {
			this.canvas.style.cursor = handleHit.cursor ?? "grab";
			this.hoveredShapeId = handleHit.shapeId;
			return true;
		}

		const hitShape = this.findShapeAtPoint(point);

		if (hitShape) {
			this.hoveredShapeId = hitShape.id;
			this.canvas.style.cursor = "pointer";
			return true;
		}

		if (this.hoveredShapeId !== null) {
			this.hoveredShapeId = null;
			this.canvas.style.cursor = "default";
			return true;
		}

		return false;
	}

	private handlePointerUp(): boolean {
		if (!this.dragState) {
			return false;
		}

		const modifiedShape = this.dragState.lastModifiedShape;
		this.dragState = null;
		this.selectedShapeId = modifiedShape.id;
		this.emitShapeModified(modifiedShape);

		return true;
	}

	private handleContextMenu(): boolean {
		if (this.draft?.type === "path") {
			this.completePathDraft();
			return true;
		}

		return this.activeTool !== null;
	}

	private handleToolPointerDown({ vertex }: { point: ShapePoint; vertex: ShapeVertex }) {
		if (!this.activeTool) {
			return;
		}

		if (this.activeTool === "trendline") {
			this.handleTwoPointDraft("trendline", vertex);
			return;
		}

		if (this.activeTool === "rectangle") {
			this.handleTwoPointDraft("rectangle", vertex);
			return;
		}

		if (this.activeTool === "fibRetracement") {
			this.handleTwoPointDraft("fibRetracement", vertex);
			return;
		}

		if (this.activeTool === "path") {
			this.handlePathDraft(vertex);
			return;
		}

		if (this.activeTool === "shortPosition" || this.activeTool === "longPosition") {
			this.addPositionShape(this.activeTool, vertex);
		}
	}

	private handleTwoPointDraft(
		type: Extract<ShapeToolType, "trendline" | "rectangle" | "fibRetracement">,
		vertex: ShapeVertex,
	) {
		if (!this.draft || this.draft.type !== type) {
			this.draft = {
				type,
				id: generateShapeId(),
				vertices: [vertex, vertex],
			};
			return;
		}

		const shape = {
			id: this.draft.id,
			type,
			vertices: [this.draft.vertices[0], vertex],
		} as Shape;

		this.draft = null;
		this.addShape(shape);
		this.setActiveToolAndEmit(null);
	}

	private handlePathDraft(vertex: ShapeVertex) {
		if (!this.draft || this.draft.type !== "path") {
			this.draft = {
				type: "path",
				id: generateShapeId(),
				vertices: [vertex],
				previewVertex: null,
			};
			return;
		}

		this.draft = {
			...this.draft,
			vertices: [...this.draft.vertices, vertex],
			previewVertex: null,
		};
	}

	private completePathDraft() {
		if (!this.draft || this.draft.type !== "path") {
			return;
		}

		if (this.draft.vertices.length >= 2) {
			this.addShape({
				id: this.draft.id,
				type: "path",
				vertices: this.draft.vertices,
			});
		}

		this.draft = null;
		this.setActiveToolAndEmit(null);
	}

	private addPositionShape(type: "shortPosition" | "longPosition", entry: ShapeVertex) {
		const converter = this.getConverter();
		const config = type === "longPosition" ? this.config.longPosition : this.config.shortPosition;
		const shape = ShortLongPosition.createFromVertex({
			id: generateShapeId(),
			type,
			entry,
			converter,
			config,
		});

		this.addShape(shape);
		this.setActiveToolAndEmit(null);
	}

	private updateDraftPreview(vertex: ShapeVertex) {
		if (!this.draft) {
			return;
		}

		if (this.draft.type === "trendline" || this.draft.type === "rectangle" || this.draft.type === "fibRetracement") {
			this.draft = {
				...this.draft,
				vertices: [this.draft.vertices[0], vertex],
			};
			return;
		}

		if (this.draft.type === "path") {
			this.draft = {
				...this.draft,
				previewVertex: vertex,
			};
		}
	}

	private addShape(shape: Shape) {
		this.selectedShapeId = shape.id;

		this.onShapeAdded?.({
			type: shape.type,
			id: shape.id,
			shape,
		});
	}

	private emitShapeModified(shape: Shape) {
		this.onShapeModified?.({
			id: shape.id,
			type: shape.type,
			shape,
		});
	}

	private applyDrag(currentPointerVertex: ShapeVertex): Shape {
		if (!this.dragState) {
			throw new Error("Cannot apply shape drag without active drag state");
		}

		const { edit } = this.dragState;

		if (edit.mode === "move") {
			const delta = {
				time: currentPointerVertex.time - edit.startVertex.time,
				price: currentPointerVertex.price - edit.startVertex.price,
			};

			return this.moveShape(edit.shape, delta);
		}

		return this.resizeShape(edit.shape, edit.handleType, currentPointerVertex, edit.handleIndex);
	}

	private moveShape(shape: Shape, delta: ShapeVertex): Shape {
		if (shape.type === "trendline") {
			return LineShape.move(shape, delta);
		}

		if (shape.type === "rectangle") {
			return RectangleShape.move(shape, delta);
		}

		if (shape.type === "path") {
			return PathShape.move(shape, delta);
		}

		if (shape.type === "fibRetracement") {
			return FibRetracementShape.move(shape, delta);
		}

		return ShortLongPosition.move(shape, delta);
	}

	private resizeShape(
		shape: Shape,
		handleType: ShapeHandleHitbox["type"],
		vertex: ShapeVertex,
		handleIndex?: number,
	): Shape {
		if (shape.type === "trendline") {
			return LineShape.resize(shape, handleType, vertex);
		}

		if (shape.type === "rectangle") {
			return RectangleShape.resize(shape, handleType, vertex);
		}

		if (shape.type === "fibRetracement") {
			return FibRetracementShape.resize(shape, handleType, vertex);
		}

		if (shape.type === "path") {
			return PathShape.resize(shape, handleIndex ?? -1, vertex);
		}

		return ShortLongPosition.resize({
			shape,
			handleType,
			vertex,
			converter: this.getConverter(),
		});
	}

	private drawShape({
		shape,
		converter,
		selected,
		hovered,
	}: {
		shape: Shape;
		converter: ShapeCoordinateConverter;
		selected: boolean;
		hovered: boolean;
	}) {
		if (shape.type === "trendline") {
			LineShape.draw({
				ctx: this.ctx,
				shape,
				converter,
				config: this.config.trendline,
				selected,
				hovered,
			});
			return;
		}

		if (shape.type === "rectangle") {
			RectangleShape.draw({
				ctx: this.ctx,
				shape,
				converter,
				config: this.config.rectangle,
				selected,
				hovered,
			});
			return;
		}

		if (shape.type === "path") {
			PathShape.draw({
				ctx: this.ctx,
				shape,
				converter,
				config: this.config.path,
				selected,
				hovered,
			});
			return;
		}

		if (shape.type === "fibRetracement") {
			FibRetracementShape.draw({
				ctx: this.ctx,
				shape,
				converter,
				config: this.config.fibRetracement,
				selected,
				hovered,
			});
			return;
		}

		ShortLongPosition.draw({
			ctx: this.ctx,
			activeSymbol: this.activeSymbol,
			shape,
			converter,
			config: shape.type === "longPosition" ? this.config.longPosition : this.config.shortPosition,
			selected,
			hovered,
		});
	}

	private drawDraft(converter: ShapeCoordinateConverter) {
		if (!this.draft) {
			return;
		}

		if (this.draft.type === "trendline") {
			LineShape.drawDraft({
				ctx: this.ctx,
				vertices: this.draft.vertices,
				converter,
				config: this.config.trendline,
			});
			return;
		}

		if (this.draft.type === "rectangle") {
			RectangleShape.drawDraft({
				ctx: this.ctx,
				vertices: this.draft.vertices,
				converter,
				config: this.config.rectangle,
			});
			return;
		}

		if (this.draft.type === "fibRetracement") {
			FibRetracementShape.drawDraft({
				ctx: this.ctx,
				vertices: this.draft.vertices,
				converter,
				config: this.config.fibRetracement,
			});
			return;
		}

		if (this.draft.type === "path") {
			PathShape.drawDraft({
				ctx: this.ctx,
				vertices: this.draft.vertices,
				previewVertex: this.draft.previewVertex,
				converter,
				config: this.config.path,
			});
		}
	}

	private rebuildHandleHitboxes() {
		if (!this.viewport) {
			this.handleHitboxes = [];
			return;
		}

		const converter = this.getConverter();
		const selectedShape = this.shapes.find((shape) => shape.id === this.selectedShapeId);

		if (!selectedShape) {
			this.handleHitboxes = [];
			return;
		}

		this.handleHitboxes = this.getShapeHandles(selectedShape, converter);
	}

	private getShapeHandles(shape: Shape, converter: ShapeCoordinateConverter): ShapeHandleHitbox[] {
		if (shape.type === "trendline") {
			return LineShape.getHandles(shape, converter, this.config.trendline);
		}

		if (shape.type === "rectangle") {
			return RectangleShape.getHandles(shape, converter, this.config.rectangle);
		}

		if (shape.type === "path") {
			return PathShape.getHandles(shape, converter, this.config.path);
		}

		if (shape.type === "fibRetracement") {
			return FibRetracementShape.getHandles(shape, converter, this.config.fibRetracement);
		}

		return ShortLongPosition.getHandles(
			shape,
			converter,
			shape.type === "longPosition" ? this.config.longPosition : this.config.shortPosition,
		);
	}

	private findHandleAtPoint(point: ShapePoint): ShapeHandleHitbox | null {
		const selectedShape = this.shapes.find((shape) => shape.id === this.selectedShapeId);

		if (!selectedShape) {
			return null;
		}

		return this.findHandleAtPointForShape(selectedShape, point);
	}

	private findHandleAtPointForShape(shape: Shape, point: ShapePoint): ShapeHandleHitbox | null {
		const converter = this.getConverter();
		const handles = this.getShapeHandles(shape, converter);

		for (const handle of handles) {
			if (isPointInsideHandle(point, handle)) {
				return handle;
			}
		}

		return null;
	}

	private findShapeAtPoint(point: ShapePoint): Shape | null {
		const converter = this.getConverter();

		for (let index = this.shapes.length - 1; index >= 0; index -= 1) {
			const shape = this.shapes[index];

			if (this.isShapeHit(shape, point, converter)) {
				return shape;
			}
		}

		return null;
	}

	private isShapeHit(shape: Shape, point: ShapePoint, converter: ShapeCoordinateConverter): boolean {
		if (shape.type === "trendline") {
			return LineShape.hitTest({
				point,
				shape,
				converter,
			});
		}

		if (shape.type === "rectangle") {
			return RectangleShape.hitTest({
				point,
				shape,
				converter,
			});
		}

		if (shape.type === "path") {
			return PathShape.hitTest({
				point,
				shape,
				converter,
			});
		}

		if (shape.type === "fibRetracement") {
			return FibRetracementShape.hitTest({
				point,
				shape,
				converter,
				config: this.config.fibRetracement,
			});
		}

		return ShortLongPosition.hitTest({
			point,
			shape,
			converter,
			config: shape.type === "longPosition" ? this.config.longPosition : this.config.shortPosition,
		});
	}

	private setActiveToolAndEmit(tool: ShapeToolType | null) {
		this.setActiveTool(tool);
		this.onToolChange?.(tool);
	}

	private getConverter(): ShapeCoordinateConverter {
		const viewport = this.viewport;

		return {
			candles: this.candles,
			viewport,
			getXForTime: (time: number) => this.getXForTime(time),
			getYForPrice: (price: number) => this.getYForPrice(price),
			getTimeForX: (x: number) => this.getTimeForX(x),
			getPriceForY: (y: number) => this.getPriceForY(y),
			getNearestCandleTimeForX: (x: number) => {
				const time = this.getTimeForX(x);

				if (this.candles.length > 0 && time > this.candles[this.candles.length - 1].time) {
					return time;
				}

				const index = getNearestCandleIndexByTime(this.candles, time);

				if (index >= 0) {
					return this.candles[index].time;
				}

				return time;
			},
			getCandleWidth: () => (viewport ? this.getCandleStepWidth(viewport) : 12),
		};
	}

	private getXForTime(time: number): number {
		if (!this.viewport || this.candles.length === 0) {
			return 0;
		}

		const lastCandle = this.candles[this.candles.length - 1];

		if (time > lastCandle.time) {
			const avgStep = getAverageCandleTimeStep(this.candles);
			const rawIndex = (time - this.candles[0].time) / avgStep;

			return rawIndex * this.viewport.candleSpacing + this.viewport.offsetX + this.viewport.candleWidth / 2;
		}

		const nearestIndex = getNearestCandleIndexByTime(this.candles, time);

		if (nearestIndex < 0) {
			return 0;
		}

		return nearestIndex * this.viewport.candleSpacing + this.viewport.offsetX + this.viewport.candleWidth / 2;
	}

	private getTimeForX(x: number): number {
		if (!this.viewport) {
			return Date.now();
		}

		const rawIndex = Math.round(
			(x - this.viewport.offsetX - this.viewport.candleWidth / 2) / this.viewport.candleSpacing,
		);

		if (rawIndex >= 0 && rawIndex < this.candles.length) {
			return this.candles[rawIndex].time;
		}

		if (this.candles.length === 0) {
			return Date.now();
		}

		return getFutureCandleTime(this.candles, this.candles[0].time, rawIndex);
	}

	private getYForPrice(price: number): number {
		if (!this.viewport) {
			return this.canvas.height / 2;
		}

		return priceToY({
			price,
			minPrice: this.viewport.minPrice,
			priceRange: this.viewport.priceRange,
			chartHeight: this.canvas.height,
		});
	}

	private getPriceForY(y: number): number {
		if (!this.viewport) {
			return 0;
		}

		return yToPrice({
			y,
			minPrice: this.viewport.minPrice,
			priceRange: this.viewport.priceRange,
			chartHeight: this.canvas.height,
		});
	}

	private getCandleStepWidth(viewport: ChartViewport): number {
		return viewport.candleSpacing;
	}

	private mergeConfig(config?: PartialShapeConfig): ShapeConfig {
		return {
			trendline: {
				...LineShape.defaultConfig,
				...(config?.trendline ?? {}),
			},
			rectangle: {
				...RectangleShape.defaultConfig,
				...(config?.rectangle ?? {}),
			},
			path: {
				...PathShape.defaultConfig,
				...(config?.path ?? {}),
			},
			fibRetracement: {
				...FibRetracementShape.defaultConfig,
				...(config?.fibRetracement ?? {}),
				levels: config?.fibRetracement?.levels ?? FibRetracementShape.defaultConfig.levels,
			},
			shortPosition: {
				...ShortLongPosition.defaultShortConfig,
				...(config?.shortPosition ?? {}),
			},
			longPosition: {
				...ShortLongPosition.defaultLongConfig,
				...(config?.longPosition ?? {}),
			},
		};
	}
}
