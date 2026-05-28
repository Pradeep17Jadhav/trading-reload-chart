import type { PreviousDayHighLowConfig } from "../../../config/chartConfig.types";
import type { Candle } from "../../../models/Candle.types";
import type { ChartViewport } from "../../../models/ChartViewport.types";
import type { Point2D } from "../../../models/Point.types";

/**
 * Drawing tool names supported by the public chart API.
 *
 * @example `"trendline"`
 */
export type ShapeToolType = "trendline" | "rectangle" | "path" | "fibRetracement" | "shortPosition" | "longPosition";

/**
 * Shape discriminator stored on each shape object.
 *
 * @example `"rectangle"`
 */
export type ShapeType = ShapeToolType;

/**
 * Unique identifier for a chart shape.
 *
 * @example `"shape-1"`
 */
export type ShapeId = string;

/**
 * Shape anchor in chart coordinates.
 *
 * `time` is in milliseconds UTC and `price` is the corresponding price level.
 *
 * @example
 * ```ts
 * const vertex: ShapeVertex = {
 *   time: 1716883200000,
 *   price: 1.085,
 * };
 * ```
 */
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

/**
 * Line style used by shape borders and helper lines.
 *
 * @example `"dashed"`
 */
export type ShapeLineStyle = "solid" | "dashed" | "dotted";

/**
 * Shared styling for line-based shapes.
 *
 * @example
 * ```ts
 * const config: CommonShapeConfig = {
 *   lineWidth: 2,
 *   lineColor: "#4ade80",
 *   lineOpacity: 1,
 *   lineStyle: "solid",
 *   handleColor: "#ffffff",
 *   handleBorderColor: "#111827",
 *   handleBorderThickness: 1,
 *   handleRadius: 4,
 * };
 * ```
 */
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

/**
 * Trendline shape defined by two vertices.
 *
 * @example
 * ```ts
 * const shape: TrendlineShape = {
 *   id: "trend-1",
 *   type: "trendline",
 *   vertices: [
 *     { time: 1716883200000, price: 1.084 },
 *     { time: 1716886800000, price: 1.088 },
 *   ],
 * };
 * ```
 */
export type TrendlineShape = {
	id: ShapeId;
	type: "trendline";
	vertices: [ShapeVertex, ShapeVertex];
	config?: Partial<ShapeConfig["trendline"]>;
};

/**
 * Rectangle annotation with optional text.
 *
 * @example
 * ```ts
 * const shape: RectangleShapeData = {
 *   id: "zone-1",
 *   type: "rectangle",
 *   vertices: [
 *     { time: 1716883200000, price: 1.084 },
 *     { time: 1716888600000, price: 1.0815 },
 *   ],
 *   text: "Demand",
 * };
 * ```
 */
export type RectangleShapeData = {
	id: ShapeId;
	type: "rectangle";
	vertices: [ShapeVertex, ShapeVertex];
	text?: string;
	config?: Partial<ShapeConfig["rectangle"]>;
};

/**
 * Freeform path made from one or more vertices.
 *
 * @example
 * ```ts
 * const shape: PathShapeData = {
 *   id: "path-1",
 *   type: "path",
 *   vertices: [
 *     { time: 1716883200000, price: 1.084 },
 *     { time: 1716885000000, price: 1.0855 },
 *     { time: 1716886800000, price: 1.085 },
 *   ],
 * };
 * ```
 */
export type PathShapeData = {
	id: ShapeId;
	type: "path";
	vertices: ShapeVertex[];
	config?: Partial<ShapeConfig["path"]>;
};

/**
 * Fibonacci retracement defined by start and end vertices.
 *
 * @example
 * ```ts
 * const shape: FibRetracementShapeData = {
 *   id: "fib-1",
 *   type: "fibRetracement",
 *   vertices: [
 *     { time: 1716883200000, price: 1.08 },
 *     { time: 1716888600000, price: 1.09 },
 *   ],
 * };
 * ```
 */
export type FibRetracementShapeData = {
	id: ShapeId;
	type: "fibRetracement";
	vertices: [ShapeVertex, ShapeVertex];
	config?: Partial<ShapeConfig["fibRetracement"]>;
};

/**
 * Long or short position planning shape.
 *
 * @example
 * ```ts
 * const shape: PositionShapeData = {
 *   id: "position-1",
 *   type: "longPosition",
 *   entry: { time: 1716883200000, price: 1.085 },
 *   endTime: 1716888600000,
 *   stopLossPercent: 0.25,
 *   takeProfitPercent: 0.5,
 * };
 * ```
 */
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

/**
 * Union of every shape the library can render and edit.
 *
 * @example
 * ```ts
 * const shapes: Shape[] = [
 *   {
 *     id: "shape-1",
 *     type: "trendline",
 *     vertices: [
 *       { time: 1716883200000, price: 1.084 },
 *       { time: 1716886800000, price: 1.088 },
 *     ],
 *   },
 * ];
 * ```
 */
export type Shape = TrendlineShape | RectangleShapeData | PathShapeData | FibRetracementShapeData | PositionShapeData;

/**
 * Full shape configuration tree used internally by the chart.
 *
 * Consumers usually pass a partial override through `config.shapes`.
 *
 * @example
 * ```ts
 * const config: ShapeConfig = {
 *   trendline: { lineWidth: 2, lineColor: "#4ade80", lineOpacity: 1, lineStyle: "solid", handleColor: "#fff", handleBorderColor: "#111827", handleBorderThickness: 1, handleRadius: 4 },
 *   rectangle: { lineWidth: 2, lineColor: "#60a5fa", lineOpacity: 1, lineStyle: "solid", handleColor: "#fff", handleBorderColor: "#111827", handleBorderThickness: 1, handleRadius: 4, textColor: "#fff", textOpacity: 1, textFontFamily: "Arial", textFontSize: 12 },
 *   path: { lineWidth: 2, lineColor: "#f59e0b", lineOpacity: 1, lineStyle: "solid", handleColor: "#fff", handleBorderColor: "#111827", handleBorderThickness: 1, handleRadius: 4 },
 *   fibRetracement: { levels: [], handleColor: "#fff", handleBorderColor: "#111827", handleBorderThickness: 1, handleRadius: 4, hoverLineWidth: 3, selectedLineWidth: 3 },
 *   shortPosition: { defaultWidthCandles: 20, defaultStopLossPercent: 0.25, defaultRiskRewardRatio: 2, profitFillColor: "#16a34a", profitFillOpacity: 0.2, lossFillColor: "#dc2626", lossFillOpacity: 0.2, borderColor: "#fff", borderOpacity: 1, borderWidth: 1, borderStyle: "solid", midLineColor: "#fff", midLineOpacity: 0.8, midLineWidth: 1, midLineStyle: "dashed", handleColor: "#fff", handleBorderColor: "#111827", handleBorderThickness: 1, handleRadius: 4, hoverLineWidth: 2, selectedLineWidth: 2 },
 *   longPosition: { defaultWidthCandles: 20, defaultStopLossPercent: 0.25, defaultRiskRewardRatio: 2, profitFillColor: "#16a34a", profitFillOpacity: 0.2, lossFillColor: "#dc2626", lossFillOpacity: 0.2, borderColor: "#fff", borderOpacity: 1, borderWidth: 1, borderStyle: "solid", midLineColor: "#fff", midLineOpacity: 0.8, midLineWidth: 1, midLineStyle: "dashed", handleColor: "#fff", handleBorderColor: "#111827", handleBorderThickness: 1, handleRadius: 4, hoverLineWidth: 2, selectedLineWidth: 2 },
 * };
 * ```
 */
export type ShapeConfig = {
	trendline: CommonShapeConfig;
	rectangle: RectangleShapeConfig;
	path: CommonShapeConfig;
	fibRetracement: FibRetracementConfig;
	shortPosition: PositionShapeConfig;
	longPosition: PositionShapeConfig;
};

/**
 * Partial shape config override accepted through `ChartConfig`.
 *
 * @example
 * ```ts
 * const shapes: PartialShapeConfig = {
 *   trendline: { lineColor: "#22c55e" },
 *   rectangle: { textColor: "#f8fafc" },
 * };
 * ```
 */
export type PartialShapeConfig = Partial<{
	trendline: Partial<CommonShapeConfig>;
	rectangle: Partial<RectangleShapeConfig>;
	path: Partial<CommonShapeConfig>;
	fibRetracement: Partial<FibRetracementConfig>;
	shortPosition: Partial<PositionShapeConfig>;
	longPosition: Partial<PositionShapeConfig>;
	previousDayHighLow: PreviousDayHighLowConfig;
}>;

/**
 * Payload emitted after completing a new shape.
 *
 * @example
 * ```ts
 * onShapeAdded: ({ type, shape }) => console.log(type, shape)
 * ```
 */
export type ShapeAddedPayload = {
	type: ShapeType;
	id: ShapeId;
	shape: Shape;
};

/**
 * Payload emitted after editing an existing shape.
 *
 * @example
 * ```ts
 * onShapeModified: ({ id, shape }) => updateShape(id, shape)
 * ```
 */
export type ShapeModifiedPayload = {
	id: ShapeId;
	type: ShapeType;
	shape: Shape;
};

/**
 * Payload describing the currently selected shape and its resolved config.
 *
 * @example
 * ```ts
 * onShapeSelected: (payload) => {
 *   if (payload?.type === "rectangle") {
 *     console.log(payload.config.textColor);
 *   }
 * }
 * ```
 */
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
