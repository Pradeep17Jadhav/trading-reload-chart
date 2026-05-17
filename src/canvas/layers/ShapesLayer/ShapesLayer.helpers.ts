import type { Candle } from "../../../models/Candle";
import type {
	FibLevelValue,
	Shape,
	ShapeBoundingBox,
	ShapeCoordinateConverter,
	ShapeDrawStyle,
	ShapeHandleHitbox,
	ShapeLineStyle,
	ShapePoint,
	ShapeVertex,
} from "./ShapesLayer.types";

export const SHAPE_HIT_TOLERANCE = 8;
export const SHAPE_HANDLE_RADIUS = 5;

export const generateShapeId = () => {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}

	return `shape-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const getCanvasPoint = (canvas: HTMLCanvasElement, event: PointerEvent | MouseEvent): ShapePoint => {
	const rect = canvas.getBoundingClientRect();
	const scaleX = canvas.width / rect.width;
	const scaleY = canvas.height / rect.height;

	return {
		x: (event.clientX - rect.left) * scaleX,
		y: (event.clientY - rect.top) * scaleY,
	};
};

export const createVertexFromPoint = (point: ShapePoint, converter: ShapeCoordinateConverter): ShapeVertex => ({
	time: converter.getNearestCandleTimeForX(point.x),
	price: converter.getPriceForY(point.y),
});

export const vertexToPoint = (vertex: ShapeVertex, converter: ShapeCoordinateConverter): ShapePoint => ({
	x: converter.getXForTime(vertex.time),
	y: converter.getYForPrice(vertex.price),
});

export const getBoundingBoxFromPoints = (pointA: ShapePoint, pointB: ShapePoint): ShapeBoundingBox => {
	const left = Math.min(pointA.x, pointB.x);
	const right = Math.max(pointA.x, pointB.x);
	const top = Math.min(pointA.y, pointB.y);
	const bottom = Math.max(pointA.y, pointB.y);

	return {
		left,
		top,
		right,
		bottom,
		width: right - left,
		height: bottom - top,
	};
};

export const getBoundingBoxFromVertices = (
	vertexA: ShapeVertex,
	vertexB: ShapeVertex,
	converter: ShapeCoordinateConverter,
): ShapeBoundingBox => getBoundingBoxFromPoints(vertexToPoint(vertexA, converter), vertexToPoint(vertexB, converter));

export const getBoundingBoxFromShape = (shape: Shape, converter: ShapeCoordinateConverter): ShapeBoundingBox => {
	if (shape.type === "shortPosition" || shape.type === "longPosition") {
		const entryPoint = vertexToPoint(shape.entry, converter);
		const endX = converter.getXForTime(shape.endTime);
		const isLong = shape.type === "longPosition";

		const upperPercent = isLong ? shape.takeProfitPercent : shape.stopLossPercent;
		const lowerPercent = isLong ? shape.stopLossPercent : shape.takeProfitPercent;

		const upperPrice = shape.entry.price * (1 + upperPercent / 100);
		const lowerPrice = shape.entry.price * (1 - lowerPercent / 100);

		return getBoundingBoxFromPoints(
			{
				x: entryPoint.x,
				y: converter.getYForPrice(upperPrice),
			},
			{
				x: endX,
				y: converter.getYForPrice(lowerPrice),
			},
		);
	}

	const vertices = (shape as Exclude<Shape, { type: "shortPosition" | "longPosition" }>).vertices;

	if (vertices.length === 0) {
		return {
			left: 0,
			top: 0,
			right: 0,
			bottom: 0,
			width: 0,
			height: 0,
		};
	}

	const points = vertices.map((vertex) => vertexToPoint(vertex, converter));
	const xs = points.map((point) => point.x);
	const ys = points.map((point) => point.y);

	const left = Math.min(...xs);
	const right = Math.max(...xs);
	const top = Math.min(...ys);
	const bottom = Math.max(...ys);

	return {
		left,
		top,
		right,
		bottom,
		width: right - left,
		height: bottom - top,
	};
};

export const getDistance = (pointA: ShapePoint, pointB: ShapePoint) => {
	const dx = pointA.x - pointB.x;
	const dy = pointA.y - pointB.y;

	return Math.sqrt(dx * dx + dy * dy);
};

export const getDistanceToLineSegment = (point: ShapePoint, lineStart: ShapePoint, lineEnd: ShapePoint) => {
	const dx = lineEnd.x - lineStart.x;
	const dy = lineEnd.y - lineStart.y;
	const lengthSquared = dx * dx + dy * dy;

	if (lengthSquared === 0) {
		return getDistance(point, lineStart);
	}

	const t = Math.max(0, Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSquared));

	const projection = {
		x: lineStart.x + t * dx,
		y: lineStart.y + t * dy,
	};

	return getDistance(point, projection);
};

export const isPointInsideBoundingBox = (point: ShapePoint, box: ShapeBoundingBox, padding = 0): boolean =>
	point.x >= box.left - padding &&
	point.x <= box.right + padding &&
	point.y >= box.top - padding &&
	point.y <= box.bottom + padding;

export const isPointNearBoundingBoxBorder = (
	point: ShapePoint,
	box: ShapeBoundingBox,
	tolerance = SHAPE_HIT_TOLERANCE,
): boolean => {
	if (!isPointInsideBoundingBox(point, box, tolerance)) {
		return false;
	}

	const nearLeft = Math.abs(point.x - box.left) <= tolerance;
	const nearRight = Math.abs(point.x - box.right) <= tolerance;
	const nearTop = Math.abs(point.y - box.top) <= tolerance;
	const nearBottom = Math.abs(point.y - box.bottom) <= tolerance;

	const withinHorizontalSpan = point.x >= box.left - tolerance && point.x <= box.right + tolerance;
	const withinVerticalSpan = point.y >= box.top - tolerance && point.y <= box.bottom + tolerance;

	return ((nearLeft || nearRight) && withinVerticalSpan) || ((nearTop || nearBottom) && withinHorizontalSpan);
};

export const createHandleHitbox = ({
	shapeId,
	type,
	point,
	radius = SHAPE_HANDLE_RADIUS,
	cursor,
	index,
}: {
	shapeId: string;
	type: ShapeHandleHitbox["type"];
	point: ShapePoint;
	radius?: number;
	cursor?: string;
	index?: number;
}): ShapeHandleHitbox => ({
	shapeId,
	type,
	x: point.x,
	y: point.y,
	radius,
	cursor,
	index,
});

export const isPointInsideHandle = (point: ShapePoint, handle: ShapeHandleHitbox) =>
	getDistance(point, handle) <= handle.radius + 2;

export const getLineDash = (lineStyle: ShapeLineStyle, lineWidth = 1): number[] => {
	if (lineStyle === "dashed") {
		return [lineWidth * 6, lineWidth * 4];
	}

	if (lineStyle === "dotted") {
		return [lineWidth, lineWidth * 3];
	}

	return [];
};

export const applyStrokeStyle = (
	ctx: CanvasRenderingContext2D,
	style: Pick<ShapeDrawStyle, "lineColor" | "lineOpacity" | "lineWidth" | "lineStyle">,
	lineWidthOverride?: number,
) => {
	ctx.strokeStyle = withOpacity(style.lineColor, style.lineOpacity);
	ctx.lineWidth = lineWidthOverride ?? style.lineWidth;
	ctx.setLineDash(getLineDash(style.lineStyle, ctx.lineWidth));
};

export const applyFillStyle = (
	ctx: CanvasRenderingContext2D,
	fillColor: string | undefined,
	fillOpacity: number | undefined,
) => {
	if (!fillColor || fillOpacity === undefined || fillOpacity <= 0) {
		return false;
	}

	ctx.fillStyle = withOpacity(fillColor, fillOpacity);
	return true;
};

export const resetCanvasLineDash = (ctx: CanvasRenderingContext2D) => {
	ctx.setLineDash([]);
};

export const drawHandle = (
	ctx: CanvasRenderingContext2D,
	handle: ShapeHandleHitbox,
	options: {
		fillColor: string;
		borderColor: string;
		borderThickness: number;
	} = {
		fillColor: "#ffffff",
		borderColor: "#2962ff",
		borderThickness: 3,
	},
) => {
	ctx.save();
	ctx.beginPath();
	ctx.arc(handle.x, handle.y, handle.radius, 0, Math.PI * 2);
	ctx.fillStyle = options.fillColor;
	ctx.fill();
	ctx.lineWidth = options.borderThickness;
	ctx.strokeStyle = options.borderColor;
	ctx.stroke();
	ctx.restore();
};

export const drawHandles = (
	ctx: CanvasRenderingContext2D,
	handles: ShapeHandleHitbox[],
	options?: {
		fillColor: string;
		borderColor: string;
		borderThickness: number;
	},
) => {
	handles.forEach((handle) => {
		drawHandle(ctx, handle, options);
	});
};

export const withOpacity = (color: string, opacity: number): string => {
	const clampedOpacity = clamp(opacity, 0, 1);

	if (color.startsWith("rgba(")) {
		return color;
	}

	if (color.startsWith("rgb(")) {
		return color.replace("rgb(", "rgba(").replace(")", `, ${clampedOpacity})`);
	}

	if (color.startsWith("#")) {
		return hexToRgba(color, clampedOpacity);
	}

	return color;
};

export const hexToRgba = (hex: string, opacity: number): string => {
	const normalizedHex = hex.replace("#", "");
	const fullHex =
		normalizedHex.length === 3
			? normalizedHex
					.split("")
					.map((char) => `${char}${char}`)
					.join("")
			: normalizedHex;

	const red = parseInt(fullHex.slice(0, 2), 16);
	const green = parseInt(fullHex.slice(2, 4), 16);
	const blue = parseInt(fullHex.slice(4, 6), 16);

	return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
};

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const getFibLevelPrice = (startPrice: number, endPrice: number, level: FibLevelValue) =>
	endPrice + (startPrice - endPrice) * level;

export const getNearestCandleIndexByTime = (candles: Candle[], time: number): number => {
	if (candles.length === 0) {
		return -1;
	}

	let nearestIndex = 0;
	let nearestDistance = Math.abs(candles[0].time - time);

	for (let index = 1; index < candles.length; index += 1) {
		const distance = Math.abs(candles[index].time - time);

		if (distance < nearestDistance) {
			nearestDistance = distance;
			nearestIndex = index;
		}
	}

	return nearestIndex;
};

export const getAverageCandleTimeStep = (candles: Candle[]): number => {
	if (candles.length < 2) {
		return 15 * 60 * 1000;
	}

	const steps: number[] = [];

	for (let index = 1; index < candles.length; index += 1) {
		const step = candles[index].time - candles[index - 1].time;

		if (step > 0) {
			steps.push(step);
		}
	}

	if (steps.length === 0) {
		return 15 * 60 * 1000;
	}

	const total = steps.reduce((sum, step) => sum + step, 0);

	return total / steps.length;
};

export const getFutureCandleTime = (candles: Candle[], startTime: number, candleCount: number): number => {
	const nearestIndex = getNearestCandleIndexByTime(candles, startTime);
	const targetIndex = nearestIndex + candleCount;

	if (nearestIndex >= 0 && targetIndex >= 0 && targetIndex < candles.length) {
		return candles[targetIndex].time;
	}

	return startTime + getAverageCandleTimeStep(candles) * candleCount;
};

export const getCursorForHandle = (handleType: ShapeHandleHitbox["type"]): string => {
	switch (handleType) {
		case "start":
		case "end":
			return "grab";

		case "topLeft":
		case "bottomRight":
			return "nwse-resize";

		case "topRight":
		case "bottomLeft":
			return "nesw-resize";

		case "leftEdge":
		case "rightEdge":
			return "ew-resize";

		case "upperHeight":
		case "lowerHeight":
			return "ns-resize";

		default:
			return "move";
	}
};

export const hasPrimaryButton = (event: PointerEvent | MouseEvent): boolean => {
	if (event instanceof MouseEvent && event.type === "contextmenu") {
		return false;
	}

	if ("button" in event && event.type === "pointerdown") {
		return event.button === 0;
	}

	return true;
};
