import {
	applyFillStyle,
	createHandleHitbox,
	drawHandles,
	getBoundingBoxFromVertices,
	getFibLevelPrice,
	getLineDash,
	resetCanvasLineDash,
	vertexToPoint,
	withOpacity,
} from "./ShapesLayer.helpers";
import type {
	FibRetracementConfig,
	FibRetracementShapeData,
	ShapeCoordinateConverter,
	ShapeHandleHitbox,
	ShapePoint,
	ShapeVertex,
} from "./ShapesLayer.types";

export class FibRetracementShape {
	static defaultConfig: FibRetracementConfig = {
		levels: [
			{
				level: 1,
				label: "1",
				color: "#808080",
				opacity: 0.8,
				lineWidth: 1,
				lineStyle: "dashed",
			},
			{
				level: 0.72,
				label: "0.720",
				color: "#ff3b30",
				opacity: 0.8,
				lineWidth: 1,
				lineStyle: "dashed",
			},
			{
				level: 0.618,
				label: "0.618",
				color: "#ff9500",
				opacity: 0.8,
				lineWidth: 1,
				lineStyle: "dashed",
			},
			{
				level: 0.5,
				label: "0.5",
				color: "#af52de",
				opacity: 0.8,
				lineWidth: 1,
				lineStyle: "dashed",
			},
			{
				level: 0,
				label: "0",
				color: "#808080",
				opacity: 0.8,
				lineWidth: 1,
				lineStyle: "dashed",
			},
		],
		fillColor: "#808080",
		fillOpacity: 0.04,
		handleColor: "#ffffff",
		handleBorderColor: "#2962ff",
		handleBorderThickness: 1.5,
		handleRadius: 5,
		hoverLineWidth: 2,
		selectedLineWidth: 2,
	};

	static draw({
		ctx,
		shape,
		converter,
		config = FibRetracementShape.defaultConfig,
		selected = false,
		hovered = false,
	}: {
		ctx: CanvasRenderingContext2D;
		shape: FibRetracementShapeData;
		converter: ShapeCoordinateConverter;
		config?: FibRetracementConfig;
		selected?: boolean;
		hovered?: boolean;
	}) {
		const [startVertex, endVertex] = shape.vertices;
		const startPoint = vertexToPoint(startVertex, converter);
		const endPoint = vertexToPoint(endVertex, converter);
		const box = getBoundingBoxFromVertices(startVertex, endVertex, converter);
		const left = Math.min(startPoint.x, endPoint.x);
		const right = Math.max(startPoint.x, endPoint.x);

		ctx.save();

		if (applyFillStyle(ctx, config.fillColor, config.fillOpacity)) {
			ctx.fillRect(box.left, box.top, box.width, box.height);
		}

		for (const levelConfig of config.levels) {
			const price = getFibLevelPrice(startVertex.price, endVertex.price, levelConfig.level);
			const y = converter.getYForPrice(price);
			const lineWidth = selected
				? Math.max(levelConfig.lineWidth, config.selectedLineWidth)
				: hovered
					? Math.max(levelConfig.lineWidth, config.hoverLineWidth)
					: levelConfig.lineWidth;

			ctx.beginPath();
			ctx.strokeStyle = withOpacity(levelConfig.color, levelConfig.opacity);
			ctx.lineWidth = lineWidth;
			ctx.setLineDash(getLineDash(levelConfig.lineStyle, lineWidth));
			ctx.moveTo(left, y);
			ctx.lineTo(right, y);
			ctx.stroke();

			if (levelConfig.label) {
				ctx.setLineDash([]);
				ctx.fillStyle = withOpacity(levelConfig.color, levelConfig.opacity);
				ctx.font = "11px sans-serif";
				ctx.textBaseline = "middle";
				ctx.fillText(Number(levelConfig.label).toFixed(2).toString(), right + 12, y);
			}
		}

		resetCanvasLineDash(ctx);

		if (selected) {
			drawHandles(ctx, FibRetracementShape.getHandles(shape, converter, config), {
				fillColor: config.handleColor,
				borderColor: config.handleBorderColor,
				borderThickness: config.handleBorderThickness,
			});
		}

		ctx.restore();
	}

	static drawDraft({
		ctx,
		vertices,
		converter,
		config = FibRetracementShape.defaultConfig,
	}: {
		ctx: CanvasRenderingContext2D;
		vertices: [ShapeVertex, ShapeVertex];
		converter: ShapeCoordinateConverter;
		config?: FibRetracementConfig;
	}) {
		FibRetracementShape.draw({
			ctx,
			shape: {
				id: "__draft_fib_retracement__",
				type: "fibRetracement",
				vertices,
			},
			converter,
			config,
			selected: true,
		});
	}

	static getHandles(
		shape: FibRetracementShapeData,
		converter: ShapeCoordinateConverter,
		config: FibRetracementConfig = FibRetracementShape.defaultConfig,
	): ShapeHandleHitbox[] {
		const [startVertex, endVertex] = shape.vertices;
		const startPoint = vertexToPoint(startVertex, converter);
		const endPoint = vertexToPoint(endVertex, converter);

		return [
			createHandleHitbox({
				shapeId: shape.id,
				type: "start",
				point: startPoint,
				radius: config.handleRadius,
				cursor: "grab",
			}),
			createHandleHitbox({
				shapeId: shape.id,
				type: "end",
				point: endPoint,
				radius: config.handleRadius,
				cursor: "grab",
			}),
		];
	}

	static hitTest({
		point,
		shape,
		converter,
		tolerance = 8,
		config = FibRetracementShape.defaultConfig,
	}: {
		point: ShapePoint;
		shape: FibRetracementShapeData;
		converter: ShapeCoordinateConverter;
		tolerance?: number;
		config?: FibRetracementConfig;
	}) {
		const [startVertex, endVertex] = shape.vertices;
		const startPoint = vertexToPoint(startVertex, converter);
		const endPoint = vertexToPoint(endVertex, converter);
		const left = Math.min(startPoint.x, endPoint.x);
		const right = Math.max(startPoint.x, endPoint.x);

		if (point.x < left - tolerance || point.x > right + tolerance) {
			return false;
		}

		for (const levelConfig of config.levels) {
			const price = getFibLevelPrice(startVertex.price, endVertex.price, levelConfig.level);
			const y = converter.getYForPrice(price);

			if (Math.abs(point.y - y) <= tolerance) {
				return true;
			}
		}

		return false;
	}

	static move(shape: FibRetracementShapeData, delta: ShapeVertex): FibRetracementShapeData {
		return {
			...shape,
			vertices: [
				{
					time: shape.vertices[0].time + delta.time,
					price: shape.vertices[0].price + delta.price,
				},
				{
					time: shape.vertices[1].time + delta.time,
					price: shape.vertices[1].price + delta.price,
				},
			],
		};
	}

	static resize(
		shape: FibRetracementShapeData,
		handleType: ShapeHandleHitbox["type"],
		vertex: ShapeVertex,
	): FibRetracementShapeData {
		if (handleType === "start") {
			return {
				...shape,
				vertices: [vertex, shape.vertices[1]],
			};
		}

		if (handleType === "end") {
			return {
				...shape,
				vertices: [shape.vertices[0], vertex],
			};
		}

		return shape;
	}
}
