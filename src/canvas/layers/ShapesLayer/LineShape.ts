import {
	applyStrokeStyle,
	createHandleHitbox,
	drawHandles,
	getDistanceToLineSegment,
	resetCanvasLineDash,
	vertexToPoint,
} from "./ShapesLayer.helpers";
import type {
	ShapeCoordinateConverter,
	ShapeDrawStyle,
	ShapeHandleHitbox,
	ShapePoint,
	ShapeVertex,
	TrendlineShape,
} from "./ShapesLayer.types";

export class LineShape {
	static defaultConfig: ShapeDrawStyle = {
		lineWidth: 2,
		lineColor: "#2962ff",
		lineOpacity: 1,
		lineStyle: "solid",
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
		config = LineShape.defaultConfig,
		selected = false,
		hovered = false,
	}: {
		ctx: CanvasRenderingContext2D;
		shape: TrendlineShape;
		converter: ShapeCoordinateConverter;
		config?: ShapeDrawStyle;
		selected?: boolean;
		hovered?: boolean;
	}) {
		const [startVertex, endVertex] = shape.vertices;
		const startPoint = vertexToPoint(startVertex, converter);
		const endPoint = vertexToPoint(endVertex, converter);

		ctx.save();

		applyStrokeStyle(ctx, config, selected ? config.selectedLineWidth : hovered ? config.hoverLineWidth : undefined);

		ctx.beginPath();
		ctx.moveTo(startPoint.x, startPoint.y);
		ctx.lineTo(endPoint.x, endPoint.y);
		ctx.stroke();

		resetCanvasLineDash(ctx);

		if (selected || hovered) {
			drawHandles(ctx, LineShape.getHandles(shape, converter, config), {
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
		config = LineShape.defaultConfig,
	}: {
		ctx: CanvasRenderingContext2D;
		vertices: [ShapeVertex, ShapeVertex];
		converter: ShapeCoordinateConverter;
		config?: ShapeDrawStyle;
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

	static getHandles(
		shape: TrendlineShape,
		converter: ShapeCoordinateConverter,
		config: ShapeDrawStyle = LineShape.defaultConfig,
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
