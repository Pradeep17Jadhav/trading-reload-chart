import {
	applyStrokeStyle,
	createHandleHitbox,
	drawHandles,
	getDistanceToLineSegment,
	resetCanvasLineDash,
	vertexToPoint,
	withOpacity,
} from "./ShapesLayer.helpers";
import type {
	PathShapeData,
	ShapeCoordinateConverter,
	CommonShapeConfig,
	ShapeHandleHitbox,
	ShapePoint,
	ShapeVertex,
} from "./ShapesLayer.types";

export class PathShape {
	static defaultConfig: CommonShapeConfig = {
		lineWidth: 2,
		lineColor: "#2962ff",
		lineOpacity: 1,
		lineStyle: "solid",
		fillColor: "#2962ff",
		fillOpacity: 0,
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
		config = PathShape.defaultConfig,
		selected = false,
		hovered = false,
	}: {
		ctx: CanvasRenderingContext2D;
		shape: PathShapeData;
		converter: ShapeCoordinateConverter;
		config?: CommonShapeConfig;
		selected?: boolean;
		hovered?: boolean;
	}) {
		const points = shape.vertices.map((vertex) => vertexToPoint(vertex, converter));

		if (points.length === 0) {
			return;
		}

		ctx.save();

		applyStrokeStyle(ctx, config, selected ? config.selectedLineWidth : hovered ? config.hoverLineWidth : undefined);

		ctx.beginPath();
		ctx.moveTo(points[0].x, points[0].y);

		for (let index = 1; index < points.length; index += 1) {
			ctx.lineTo(points[index].x, points[index].y);
		}

		ctx.stroke();
		resetCanvasLineDash(ctx);

		if (points.length >= 2) {
			PathShape.drawEndArrow({
				ctx,
				previousPoint: points[points.length - 2],
				endPoint: points[points.length - 1],
				color: config.lineColor,
				opacity: config.lineOpacity,
				lineWidth: selected
					? (config.selectedLineWidth ?? config.lineWidth)
					: hovered
						? (config.hoverLineWidth ?? config.lineWidth)
						: config.lineWidth,
			});
		}

		if (selected || hovered) {
			drawHandles(ctx, PathShape.getHandles(shape, converter, config), {
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
		previewVertex,
		converter,
		config = PathShape.defaultConfig,
	}: {
		ctx: CanvasRenderingContext2D;
		vertices: ShapeVertex[];
		previewVertex: ShapeVertex | null;
		converter: ShapeCoordinateConverter;
		config?: CommonShapeConfig;
	}) {
		const draftVertices = previewVertex ? [...vertices, previewVertex] : vertices;

		PathShape.draw({
			ctx,
			shape: {
				id: "__draft_path__",
				type: "path",
				vertices: draftVertices,
			},
			converter,
			config,
			selected: true,
		});
	}

	static getHandles(
		shape: PathShapeData,
		converter: ShapeCoordinateConverter,
		config: CommonShapeConfig = PathShape.defaultConfig,
	): ShapeHandleHitbox[] {
		return shape.vertices.map((vertex, index) =>
			createHandleHitbox({
				shapeId: shape.id,
				type: index === 0 ? "start" : index === shape.vertices.length - 1 ? "end" : "move",
				point: vertexToPoint(vertex, converter),
				radius: config.handleRadius,
				cursor: "grab",
				index,
			}),
		);
	}

	static hitTest({
		point,
		shape,
		converter,
		tolerance = 8,
	}: {
		point: ShapePoint;
		shape: PathShapeData;
		converter: ShapeCoordinateConverter;
		tolerance?: number;
	}) {
		const points = shape.vertices.map((vertex) => vertexToPoint(vertex, converter));

		if (points.length === 1) {
			const onlyPoint = points[0];
			const dx = point.x - onlyPoint.x;
			const dy = point.y - onlyPoint.y;

			return Math.sqrt(dx * dx + dy * dy) <= tolerance;
		}

		for (let index = 1; index < points.length; index += 1) {
			if (getDistanceToLineSegment(point, points[index - 1], points[index]) <= tolerance) {
				return true;
			}
		}

		return false;
	}

	static move(shape: PathShapeData, delta: ShapeVertex): PathShapeData {
		return {
			...shape,
			vertices: shape.vertices.map((vertex) => ({
				time: vertex.time + delta.time,
				price: vertex.price + delta.price,
			})),
		};
	}

	static resize(shape: PathShapeData, handleIndex: number, vertex: ShapeVertex): PathShapeData {
		if (handleIndex < 0 || handleIndex >= shape.vertices.length) {
			return shape;
		}

		return {
			...shape,
			vertices: shape.vertices.map((currentVertex, index) => (index === handleIndex ? vertex : currentVertex)),
		};
	}

	private static drawEndArrow({
		ctx,
		previousPoint,
		endPoint,
		color,
		opacity,
		lineWidth,
	}: {
		ctx: CanvasRenderingContext2D;
		previousPoint: ShapePoint;
		endPoint: ShapePoint;
		color: string;
		opacity: number;
		lineWidth: number;
	}) {
		const angle = Math.atan2(endPoint.y - previousPoint.y, endPoint.x - previousPoint.x);
		const arrowLength = 12;
		const arrowAngle = Math.PI / 7;

		ctx.save();
		ctx.beginPath();
		ctx.strokeStyle = withOpacity(color, opacity);
		ctx.fillStyle = withOpacity(color, opacity);
		ctx.lineWidth = lineWidth;
		ctx.setLineDash([]);

		ctx.moveTo(endPoint.x, endPoint.y);
		ctx.lineTo(
			endPoint.x - arrowLength * Math.cos(angle - arrowAngle),
			endPoint.y - arrowLength * Math.sin(angle - arrowAngle),
		);
		ctx.lineTo(
			endPoint.x - arrowLength * Math.cos(angle + arrowAngle),
			endPoint.y - arrowLength * Math.sin(angle + arrowAngle),
		);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		ctx.restore();
	}
}
