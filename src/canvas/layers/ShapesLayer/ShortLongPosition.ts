import { getPipSize } from "../TradeLayer/TradeLayer.helpers";
import {
	createHandleHitbox,
	drawHandles,
	getLineDash,
	isPointInsideBoundingBox,
	isPointInsideHandle,
	resetCanvasLineDash,
	vertexToPoint,
	withOpacity,
} from "./ShapesLayer.helpers";
import type {
	PositionShapeConfig,
	PositionShapeData,
	ShapeBoundingBox,
	ShapeCoordinateConverter,
	ShapeHandleHitbox,
	ShapePoint,
	ShapeVertex,
} from "./ShapesLayer.types";

type PositionGeometry = {
	entryPoint: ShapePoint;
	endX: number;
	entryY: number;
	box: ShapeBoundingBox;
	profitBox: ShapeBoundingBox;
	lossBox: ShapeBoundingBox;
	upperPrice: number;
	lowerPrice: number;
};

export class ShortLongPosition {
	static defaultLongConfig: PositionShapeConfig = {
		defaultWidthCandles: 10,
		defaultStopLossPercent: 0.25,
		defaultRiskRewardRatio: 1.5,
		profitFillColor: "#00c853",
		profitFillOpacity: 0.18,
		lossFillColor: "#ff3b30",
		lossFillOpacity: 0.18,
		borderColor: "#808080",
		borderOpacity: 0.8,
		borderWidth: 1,
		borderStyle: "solid",
		midLineColor: "#808080",
		midLineOpacity: 0.9,
		midLineWidth: 1,
		midLineStyle: "dashed",
		handleColor: "#ffffff",
		handleBorderColor: "#2962ff",
		handleBorderThickness: 1.5,
		handleRadius: 5,
		hoverLineWidth: 2,
		selectedLineWidth: 2,
	};

	static defaultShortConfig: PositionShapeConfig = {
		...ShortLongPosition.defaultLongConfig,
	};

	static draw({
		ctx,
		activeSymbol,
		shape,
		converter,
		config = shape.type === "longPosition" ? ShortLongPosition.defaultLongConfig : ShortLongPosition.defaultShortConfig,
		selected = false,
		hovered = false,
	}: {
		ctx: CanvasRenderingContext2D;
		activeSymbol: string;
		shape: PositionShapeData;
		converter: ShapeCoordinateConverter;
		config?: PositionShapeConfig;
		selected?: boolean;
		hovered?: boolean;
	}) {
		const geometry = ShortLongPosition.getGeometry(shape, converter);

		ctx.save();

		ctx.fillStyle = withOpacity(config.profitFillColor, config.profitFillOpacity);
		ctx.fillRect(geometry.profitBox.left, geometry.profitBox.top, geometry.profitBox.width, geometry.profitBox.height);

		ctx.fillStyle = withOpacity(config.lossFillColor, config.lossFillOpacity);
		ctx.fillRect(geometry.lossBox.left, geometry.lossBox.top, geometry.lossBox.width, geometry.lossBox.height);

		const borderWidth = selected
			? Math.max(config.borderWidth, config.selectedLineWidth)
			: hovered
				? Math.max(config.borderWidth, config.hoverLineWidth)
				: config.borderWidth;

		ctx.strokeStyle = withOpacity(config.borderColor, config.borderOpacity);
		ctx.lineWidth = borderWidth;
		ctx.setLineDash(getLineDash(config.borderStyle, borderWidth));
		ctx.strokeRect(geometry.box.left, geometry.box.top, geometry.box.width, geometry.box.height);

		ctx.beginPath();
		ctx.strokeStyle = withOpacity(config.midLineColor, config.midLineOpacity);
		ctx.lineWidth = config.midLineWidth;
		ctx.setLineDash(getLineDash(config.midLineStyle, config.midLineWidth));
		ctx.moveTo(geometry.box.left, geometry.entryY);
		ctx.lineTo(geometry.box.right, geometry.entryY);
		ctx.stroke();

		resetCanvasLineDash(ctx);

		ShortLongPosition.drawLabels({
			ctx,
			activeSymbol,
			shape,
			geometry,
			config,
		});

		if (selected) {
			drawHandles(ctx, ShortLongPosition.getHandles(shape, converter, config), {
				fillColor: config.handleColor,
				borderColor: config.handleBorderColor,
				borderThickness: config.handleBorderThickness,
			});
		}

		ctx.restore();
	}

	static createFromVertex({
		id,
		type,
		entry,
		converter,
		config = type === "longPosition" ? ShortLongPosition.defaultLongConfig : ShortLongPosition.defaultShortConfig,
	}: {
		id: string;
		type: PositionShapeData["type"];
		entry: ShapeVertex;
		converter: ShapeCoordinateConverter;
		config?: PositionShapeConfig;
	}): PositionShapeData {
		const endTime = converter.getTimeForX(
			converter.getXForTime(entry.time) + converter.getCandleWidth() * config.defaultWidthCandles,
		);
		const stopLossPercent = config.defaultStopLossPercent;
		const takeProfitPercent = stopLossPercent * config.defaultRiskRewardRatio;

		return {
			id,
			type,
			entry,
			endTime,
			stopLossPercent,
			takeProfitPercent,
		};
	}

	static getGeometry(shape: PositionShapeData, converter: ShapeCoordinateConverter): PositionGeometry {
		const entryPoint = vertexToPoint(shape.entry, converter);
		const endX = converter.getXForTime(shape.endTime);
		const left = Math.min(entryPoint.x, endX);
		const right = Math.max(entryPoint.x, endX);
		const isLong = shape.type === "longPosition";

		const upperPercent = isLong ? shape.takeProfitPercent : shape.stopLossPercent;
		const lowerPercent = isLong ? shape.stopLossPercent : shape.takeProfitPercent;

		const upperPrice = shape.entry.price * (1 + upperPercent / 100);
		const lowerPrice = shape.entry.price * (1 - lowerPercent / 100);

		const upperY = converter.getYForPrice(upperPrice);
		const lowerY = converter.getYForPrice(lowerPrice);
		const top = Math.min(upperY, lowerY, entryPoint.y);
		const bottom = Math.max(upperY, lowerY, entryPoint.y);

		const upperBox: ShapeBoundingBox = {
			left,
			top,
			right,
			bottom: entryPoint.y,
			width: right - left,
			height: Math.abs(entryPoint.y - top),
		};

		const lowerBox: ShapeBoundingBox = {
			left,
			top: entryPoint.y,
			right,
			bottom,
			width: right - left,
			height: Math.abs(bottom - entryPoint.y),
		};

		return {
			entryPoint,
			endX,
			entryY: entryPoint.y,
			upperPrice,
			lowerPrice,
			box: {
				left,
				top,
				right,
				bottom,
				width: right - left,
				height: bottom - top,
			},
			profitBox: isLong ? upperBox : lowerBox,
			lossBox: isLong ? lowerBox : upperBox,
		};
	}

	static getHandles(
		shape: PositionShapeData,
		converter: ShapeCoordinateConverter,
		config?: PositionShapeConfig,
	): ShapeHandleHitbox[] {
		const resolvedConfig =
			config ??
			(shape.type === "longPosition" ? ShortLongPosition.defaultLongConfig : ShortLongPosition.defaultShortConfig);
		const geometry = ShortLongPosition.getGeometry(shape, converter);

		return [
			createHandleHitbox({
				shapeId: shape.id,
				type: "upperHeight",
				point: {
					x: geometry.box.left,
					y: geometry.box.top,
				},
				radius: resolvedConfig.handleRadius,
				cursor: "ns-resize",
			}),
			createHandleHitbox({
				shapeId: shape.id,
				type: "lowerHeight",
				point: {
					x: geometry.box.left,
					y: geometry.box.bottom,
				},
				radius: resolvedConfig.handleRadius,
				cursor: "ns-resize",
			}),
			createHandleHitbox({
				shapeId: shape.id,
				type: "start",
				point: {
					x: geometry.entryPoint.x,
					y: geometry.entryY,
				},
				radius: resolvedConfig.handleRadius,
				cursor: "ns-resize",
			}),
			createHandleHitbox({
				shapeId: shape.id,
				type: "end",
				point: {
					x: geometry.endX,
					y: geometry.entryY,
				},
				radius: resolvedConfig.handleRadius,
				cursor: "ew-resize",
			}),
		];
	}

	static hitTest({
		point,
		shape,
		converter,
		config,
	}: {
		point: ShapePoint;
		shape: PositionShapeData;
		converter: ShapeCoordinateConverter;
		config?: PositionShapeConfig;
	}) {
		const handles = ShortLongPosition.getHandles(shape, converter, config);

		if (handles.some((handle) => isPointInsideHandle(point, handle))) {
			return true;
		}

		const geometry = ShortLongPosition.getGeometry(shape, converter);

		return isPointInsideBoundingBox(point, geometry.box);
	}

	static move(shape: PositionShapeData, delta: ShapeVertex): PositionShapeData {
		return {
			...shape,
			entry: {
				time: shape.entry.time + delta.time,
				price: shape.entry.price + delta.price,
			},
			endTime: shape.endTime + delta.time,
		};
	}

	static resize({
		shape,
		handleType,
		vertex,
		converter,
	}: {
		shape: PositionShapeData;
		handleType: ShapeHandleHitbox["type"];
		vertex: ShapeVertex;
		converter: ShapeCoordinateConverter;
	}): PositionShapeData {
		if (handleType === "start") {
			return {
				...shape,
				entry: {
					time: shape.entry.time,
					price: vertex.price,
				},
			};
		}

		if (handleType === "end") {
			return {
				...shape,
				endTime: vertex.time,
			};
		}

		if (handleType === "upperHeight") {
			return ShortLongPosition.resizeUpperHeight(shape, vertex.price);
		}

		if (handleType === "lowerHeight") {
			return ShortLongPosition.resizeLowerHeight(shape, vertex.price);
		}

		return {
			...shape,
			endTime: converter.getTimeForX(converter.getXForTime(shape.endTime)),
		};
	}

	private static resizeUpperHeight(shape: PositionShapeData, price: number): PositionShapeData {
		const percent = Math.max(0, ((price - shape.entry.price) / shape.entry.price) * 100);

		if (shape.type === "longPosition") {
			return {
				...shape,
				takeProfitPercent: percent,
			};
		}

		return {
			...shape,
			stopLossPercent: percent,
		};
	}

	private static resizeLowerHeight(shape: PositionShapeData, price: number): PositionShapeData {
		const percent = Math.max(0, ((shape.entry.price - price) / shape.entry.price) * 100);

		if (shape.type === "longPosition") {
			return {
				...shape,
				stopLossPercent: percent,
			};
		}

		return {
			...shape,
			takeProfitPercent: percent,
		};
	}

	private static drawLabels({
		ctx,
		activeSymbol,
		shape,
		geometry,
		config,
	}: {
		ctx: CanvasRenderingContext2D;
		activeSymbol: string;
		shape: PositionShapeData;
		geometry: PositionGeometry;
		config: PositionShapeConfig;
	}) {
		ctx.save();
		ctx.font = "11px sans-serif";
		ctx.textBaseline = "middle";

		const type = shape.type;
		const pipSize = getPipSize(activeSymbol);
		const profitPips = (shape.entry.price * (shape.takeProfitPercent / 100)) / pipSize;
		const lossPips = (shape.entry.price * (shape.stopLossPercent / 100)) / pipSize;
		const labelX = geometry.box.left + 6;
		const rrr = profitPips / lossPips;
		ctx.fillStyle = withOpacity(config.profitFillColor, 0.95);
		const profitLabelPosition =
			type === "longPosition"
				? geometry.profitBox.top + geometry.profitBox.height / 10
				: geometry.profitBox.bottom - geometry.profitBox.height / 10;
		ctx.fillText(`${profitPips.toFixed(2)} (${rrr.toFixed(2)})`, labelX, profitLabelPosition);

		ctx.fillStyle = withOpacity(config.lossFillColor, 0.95);
		const lossLabelPosition =
			type === "shortPosition"
				? geometry.lossBox.top + geometry.lossBox.height / 10
				: geometry.lossBox.bottom - geometry.lossBox.height / 10;
		ctx.fillText(lossPips.toFixed(1), labelX, lossLabelPosition);
	}
}
