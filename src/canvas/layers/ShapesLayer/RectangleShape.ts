import {
	applyFillStyle,
	applyStrokeStyle,
	createHandleHitbox,
	drawHandles,
	getBoundingBoxFromVertices,
	isPointNearBoundingBoxBorder,
	resetCanvasLineDash,
	vertexToPoint,
} from "./ShapesLayer.helpers";
import type {
	RectangleShapeData,
	ShapeCoordinateConverter,
	CommonShapeConfig,
	ShapeHandleHitbox,
	ShapePoint,
	ShapeVertex,
} from "./ShapesLayer.types";

export class RectangleShape {
	static defaultConfig: CommonShapeConfig = {
		lineWidth: 2,
		lineColor: "#2962ff",
		lineOpacity: 1,
		lineStyle: "solid",
		fillColor: "#2962ff",
		fillOpacity: 0.12,
		handleColor: "#ffffff",
		handleBorderColor: "#2962ff",
		handleBorderThickness: 1.5,
		handleRadius: 5,
		hoverLineWidth: 3,
		selectedLineWidth: 3,
	};

	static draw({
		ctx,
		shape,
		converter,
		config = RectangleShape.defaultConfig,
		selected = false,
		hovered = false,
	}: {
		ctx: CanvasRenderingContext2D;
		shape: RectangleShapeData;
		converter: ShapeCoordinateConverter;
		config?: CommonShapeConfig;
		selected?: boolean;
		hovered?: boolean;
	}) {
		const [startVertex, endVertex] = shape.vertices;
		const box = getBoundingBoxFromVertices(startVertex, endVertex, converter);

		ctx.save();

		if (applyFillStyle(ctx, config.fillColor, config.fillOpacity)) {
			ctx.fillRect(box.left, box.top, box.width, box.height);
		}

		applyStrokeStyle(ctx, config, selected ? config.selectedLineWidth : hovered ? config.hoverLineWidth : undefined);

		ctx.strokeRect(box.left, box.top, box.width, box.height);
		resetCanvasLineDash(ctx);

		if (selected || hovered) {
			drawHandles(ctx, RectangleShape.getHandles(shape, converter, config), {
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
		config = RectangleShape.defaultConfig,
	}: {
		ctx: CanvasRenderingContext2D;
		vertices: [ShapeVertex, ShapeVertex];
		converter: ShapeCoordinateConverter;
		config?: CommonShapeConfig;
	}) {
		RectangleShape.draw({
			ctx,
			shape: {
				id: "__draft_rectangle__",
				type: "rectangle",
				vertices,
			},
			converter,
			config,
			selected: true,
		});
	}

	static getHandles(
		shape: RectangleShapeData,
		converter: ShapeCoordinateConverter,
		config: CommonShapeConfig = RectangleShape.defaultConfig,
	): ShapeHandleHitbox[] {
		const [startVertex, endVertex] = shape.vertices;
		const startPoint = vertexToPoint(startVertex, converter);
		const endPoint = vertexToPoint(endVertex, converter);

		const startIsLeft = startPoint.x <= endPoint.x;
		const startIsTop = startPoint.y <= endPoint.y;

		// Diagonal cursor depends on which corner each handle sits at
		const startCursor = startIsLeft === startIsTop ? "nwse-resize" : "nesw-resize";
		const endCursor = startIsLeft === startIsTop ? "nwse-resize" : "nesw-resize";

		return [
			createHandleHitbox({
				shapeId: shape.id,
				type: "start",
				point: startPoint,
				radius: config.handleRadius,
				cursor: startCursor,
			}),
			createHandleHitbox({
				shapeId: shape.id,
				type: "end",
				point: endPoint,
				radius: config.handleRadius,
				cursor: endCursor,
			}),
		];
	}

	static hitTest({
		point,
		shape,
		converter,
		tolerance = 8,
	}: {
		point: ShapePoint;
		shape: RectangleShapeData;
		converter: ShapeCoordinateConverter;
		tolerance?: number;
	}) {
		const [startVertex, endVertex] = shape.vertices;
		const box = getBoundingBoxFromVertices(startVertex, endVertex, converter);

		return isPointNearBoundingBoxBorder(point, box, tolerance);
	}

	static move(shape: RectangleShapeData, delta: ShapeVertex): RectangleShapeData {
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
		shape: RectangleShapeData,
		handleType: ShapeHandleHitbox["type"],
		vertex: ShapeVertex,
	): RectangleShapeData {
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
