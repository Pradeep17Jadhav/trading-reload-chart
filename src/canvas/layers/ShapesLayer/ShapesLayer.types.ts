import type { PreviousDayHighLowConfig } from "../../../config/chartConfig.types";
import type { Candle } from "../../../models/Candle.types";
import type { ChartViewport } from "../../../models/ChartViewport.types";
import type { Point2D } from "../../../models/Point.types";

export type ShapeToolType = "trendline" | "rectangle" | "path" | "fibRetracement" | "shortPosition" | "longPosition";

export type ShapeType = ShapeToolType;

export type ShapeId = string;

export type ShapeVertex = {
	time: number;
	price: number;
};

export type ShapePoint = Point2D;

export type ShapeBoundingBox = {
	left: number;
	top: number;
	right: number;
	bottom: number;
	width: number;
	height: number;
};

export type ShapeHandleType =
	| "start"
	| "end"
	| "topLeft"
	| "topRight"
	| "bottomLeft"
	| "bottomRight"
	| "leftEdge"
	| "rightEdge"
	| "upperHeight"
	| "lowerHeight"
	| "move";

export type ShapeHandleHitbox = {
	shapeId: ShapeId;
	type: ShapeHandleType;
	x: number;
	y: number;
	radius: number;
	cursor?: string;
	index?: number;
};

export type ShapeLineStyle = "solid" | "dashed" | "dotted";

export type CommonShapeConfig = {
	lineWidth: number;
	lineColor: string;
	lineOpacity: number;
	lineStyle: ShapeLineStyle;
	fillColor?: string;
	fillOpacity?: number;
	handleColor: string;
	handleBorderColor: string;
	handleBorderThickness: number;
	handleRadius: number;
	hoverLineWidth?: number;
	selectedLineWidth?: number;
};

export type RectangleShapeConfig = CommonShapeConfig & {
	textColor: string;
	textOpacity: number;
	textFontFamily: string;
	textFontSize: number;
};

export type FibLevelValue = 1 | 0.72 | 0.618 | 0.5 | 0;

export type FibLevelConfig = {
	level: FibLevelValue;
	color: string;
	opacity: number;
	lineWidth: number;
	lineStyle: ShapeLineStyle;
	label?: string;
};

export type FibRetracementConfig = {
	levels: FibLevelConfig[];
	fillColor?: string;
	fillOpacity?: number;
	handleColor: string;
	handleBorderColor: string;
	handleBorderThickness: number;
	handleRadius: number;
	hoverLineWidth: number;
	selectedLineWidth: number;
};

export type PositionShapeConfig = {
	defaultWidthCandles: number;
	defaultStopLossPercent: number;
	defaultRiskRewardRatio: number;
	profitFillColor: string;
	profitFillOpacity: number;
	lossFillColor: string;
	lossFillOpacity: number;
	borderColor: string;
	borderOpacity: number;
	borderWidth: number;
	borderStyle: ShapeLineStyle;
	midLineColor: string;
	midLineOpacity: number;
	midLineWidth: number;
	midLineStyle: ShapeLineStyle;
	handleColor: string;
	handleBorderColor: string;
	handleBorderThickness: number;
	handleRadius: number;
	hoverLineWidth: number;
	selectedLineWidth: number;
};

export type TrendlineShape = {
	id: ShapeId;
	type: "trendline";
	vertices: [ShapeVertex, ShapeVertex];
	config?: Partial<ShapeConfig["trendline"]>;
};

export type RectangleShapeData = {
	id: ShapeId;
	type: "rectangle";
	vertices: [ShapeVertex, ShapeVertex];
	text?: string;
	config?: Partial<ShapeConfig["rectangle"]>;
};

export type PathShapeData = {
	id: ShapeId;
	type: "path";
	vertices: ShapeVertex[];
	config?: Partial<ShapeConfig["path"]>;
};

export type FibRetracementShapeData = {
	id: ShapeId;
	type: "fibRetracement";
	vertices: [ShapeVertex, ShapeVertex];
	config?: Partial<ShapeConfig["fibRetracement"]>;
};

export type PositionShapeData = {
	id: ShapeId;
	type: "shortPosition" | "longPosition";
	/**
	 * Entry/start candle time and entry price.
	 */
	entry: ShapeVertex;

	/**
	 * End candle time. This keeps width stable across timeframe changes.
	 */
	endTime: number;

	/**
	 * Loss area as percentage from entry price.
	 * Example: 0.25 means 0.25%.
	 */
	stopLossPercent: number;

	/**
	 * Profit area as percentage from entry price.
	 * Example: 0.375 means 0.375%.
	 */
	takeProfitPercent: number;

	config?: Partial<ShapeConfig["shortPosition"]> | Partial<ShapeConfig["longPosition"]>;
};

export type Shape = TrendlineShape | RectangleShapeData | PathShapeData | FibRetracementShapeData | PositionShapeData;

export type ShapeConfig = {
	trendline: CommonShapeConfig;
	rectangle: RectangleShapeConfig;
	path: CommonShapeConfig;
	fibRetracement: FibRetracementConfig;
	shortPosition: PositionShapeConfig;
	longPosition: PositionShapeConfig;
};

export type PartialShapeConfig = Partial<{
	trendline: Partial<CommonShapeConfig>;
	rectangle: Partial<RectangleShapeConfig>;
	path: Partial<CommonShapeConfig>;
	fibRetracement: Partial<FibRetracementConfig>;
	shortPosition: Partial<PositionShapeConfig>;
	longPosition: Partial<PositionShapeConfig>;
	previousDayHighLow: PreviousDayHighLowConfig;
}>;

export type ShapeAddedPayload = {
	type: ShapeType;
	id: ShapeId;
	shape: Shape;
};

export type ShapeModifiedPayload = {
	id: ShapeId;
	type: ShapeType;
	shape: Shape;
};

export type ShapeSelectedPayload =
	| {
			shapeId: ShapeId;
			type: "trendline";
			config: ShapeConfig["trendline"];
	  }
	| {
			shapeId: ShapeId;
			type: "rectangle";
			config: ShapeConfig["rectangle"];
	  }
	| {
			shapeId: ShapeId;
			type: "path";
			config: ShapeConfig["path"];
	  }
	| {
			shapeId: ShapeId;
			type: "fibRetracement";
			config: ShapeConfig["fibRetracement"];
	  }
	| {
			shapeId: ShapeId;
			type: "shortPosition";
			config: ShapeConfig["shortPosition"];
	  }
	| {
			shapeId: ShapeId;
			type: "longPosition";
			config: ShapeConfig["longPosition"];
	  };

/**
 * Adapter around ExistingCandlesLayer viewport/candle conversion behavior.
 *
 * Shapes are stored in time + price coordinates, but rendered in canvas
 * coordinates. ShapesLayer receives the real viewport object from
 * ExistingCandlesLayer and uses these callbacks/helpers to convert safely.
 */
export type ShapeCoordinateConverter = {
	candles: Candle[];
	viewport: ChartViewport | null;
	getXForTime: (time: number) => number;
	getYForPrice: (price: number) => number;
	getTimeForX: (x: number) => number;
	getPriceForY: (y: number) => number;
	getNearestCandleTimeForX: (x: number) => number;
	getCandleWidth: () => number;
};

export type ShapePointerContext = {
	point: ShapePoint;
	vertex: ShapeVertex;
	event: PointerEvent | MouseEvent;
};

export type ShapeHitTestResult = {
	shape: Shape;
	handle?: ShapeHandleHitbox;
	isBodyHit: boolean;
	cursor: string;
};

export type ActiveShapeDraft =
	| {
			type: "trendline";
			id: ShapeId;
			vertices: [ShapeVertex, ShapeVertex];
	  }
	| {
			type: "rectangle";
			id: ShapeId;
			vertices: [ShapeVertex, ShapeVertex];
	  }
	| {
			type: "path";
			id: ShapeId;
			vertices: ShapeVertex[];
			previewVertex: ShapeVertex | null;
	  }
	| {
			type: "fibRetracement";
			id: ShapeId;
			vertices: [ShapeVertex, ShapeVertex];
	  };

export type ActiveShapeEdit =
	| {
			mode: "move";
			shape: Shape;
			startPoint: ShapePoint;
			startVertex: ShapeVertex;
	  }
	| {
			mode: "resize";
			shape: Shape;
			handleType: ShapeHandleType;
			handleIndex?: number;
			startPoint: ShapePoint;
			startVertex: ShapeVertex;
	  };

export type ShapesLayerOptions = {
	canvas: HTMLCanvasElement;
	candles: Candle[];
	activeSymbol: string;
	shapes: Shape[];
	activeTool?: ShapeToolType | null;
	config?: PartialShapeConfig;
	onShapeAdded?: (payload: ShapeAddedPayload) => void;
	onShapeModified?: (payload: ShapeModifiedPayload) => void;
	onShapeSelected?: (payload: ShapeSelectedPayload | null) => void;
	onToolChange?: (tool: ShapeToolType | null) => void;
};

export type InternalDragState = {
	edit: ActiveShapeEdit;
	lastModifiedShape: Shape;
};
