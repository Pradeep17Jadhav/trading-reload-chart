import { SHAPE_HANDLE_CONFIG } from "./ShapesLayer.constants";
import {
	applyStrokeStyle,
	createHandleHitbox,
	drawHandles,
	getDistanceToLineSegment,
	resetCanvasLineDash,
	vertexToPoint,
} from "./ShapesLayer.helpers";
import type {
	CommonShapeConfig,
	ShapeCoordinateConverter,
	ShapeHandleHitbox,
	ShapePoint,
	ShapeVertex,
	TrendlineShape,
} from "./ShapesLayer.types";

export class LineShape {
	static defaultConfig: CommonShapeConfig = {
		lineWidth: 2,
		lineColor: "#2962ff",
		lineOpacity: 1,
		lineStyle: "solid",
	};

	static draw({
		ctx,
		shape,
		converter,
		config = LineShape.defaultConfig,
		selected = false,
		hovered = false,
	}: {
		ctx: CanvasRenderingContext2D;
		shape: TrendlineShape;
		converter: ShapeCoordinateConverter;
		config?: CommonShapeConfig;
		selected?: boolean;
		hovered?: boolean;
	}) {
		const [startVertex, endVertex] = shape.vertices;
		const startPoint = vertexToPoint(startVertex, converter);
		const endPoint = vertexToPoint(endVertex, converter);

		ctx.save();

		applyStrokeStyle(ctx, config);

		ctx.beginPath();
		ctx.moveTo(startPoint.x, startPoint.y);
		ctx.lineTo(endPoint.x, endPoint.y);
		ctx.stroke();

		resetCanvasLineDash(ctx);

		if (selected || hovered) {
			drawHandles(ctx, LineShape.getHandles(shape, converter), {
				fillColor: SHAPE_HANDLE_CONFIG.handleColor,
				borderColor: SHAPE_HANDLE_CONFIG.handleBorderColor,
				borderThickness: SHAPE_HANDLE_CONFIG.handleBorderThickness,
			});
		}

		ctx.restore();
	}

	static drawDraft({
		ctx,
		vertices,
		converter,
		config = LineShape.defaultConfig,
	}: {
		ctx: CanvasRenderingContext2D;
		vertices: [ShapeVertex, ShapeVertex];
		converter: ShapeCoordinateConverter;
		config?: CommonShapeConfig;
	}) {
		LineShape.draw({
			ctx,
			shape: {
				id: "__draft_trendline__",
				type: "trendline",
				vertices,
			},
			converter,
			config,
			selected: true,
		});
	}

	static getHandles(shape: TrendlineShape, converter: ShapeCoordinateConverter): ShapeHandleHitbox[] {
		const [startVertex, endVertex] = shape.vertices;
		const startPoint = vertexToPoint(startVertex, converter);
		const endPoint = vertexToPoint(endVertex, converter);

		return [
			createHandleHitbox({
				shapeId: shape.id,
				type: "start",
				point: startPoint,
				radius: SHAPE_HANDLE_CONFIG.handleRadius,
				cursor: "grab",
			}),
			createHandleHitbox({
				shapeId: shape.id,
				type: "end",
				point: endPoint,
				radius: SHAPE_HANDLE_CONFIG.handleRadius,
				cursor: "grab",
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
		shape: TrendlineShape;
		converter: ShapeCoordinateConverter;
		tolerance?: number;
	}) {
		const [startVertex, endVertex] = shape.vertices;
		const startPoint = vertexToPoint(startVertex, converter);
		const endPoint = vertexToPoint(endVertex, converter);

		return getDistanceToLineSegment(point, startPoint, endPoint) <= tolerance;
	}

	static move(shape: TrendlineShape, delta: ShapeVertex): TrendlineShape {
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

	static resize(shape: TrendlineShape, handleType: ShapeHandleHitbox["type"], vertex: ShapeVertex): TrendlineShape {
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
