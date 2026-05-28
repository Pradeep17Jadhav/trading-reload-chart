import type {
	Shape,
	ShapeAddedPayload,
	ShapeModifiedPayload,
	ShapeSelectedPayload,
	ShapeToolType,
} from "../canvas/layers/ShapesLayer/ShapesLayer.types";
import type { PastTrade } from "../canvas/layers/TradeLayer/TradeLayer.types";
import type { ChartConfig } from "../config/chartConfig.types";
import type { Candle } from "../models/Candle.types";
import type { OpenTrade } from "../models/Trade.types";
import type { DeepPartial } from "./utils/deepPartial.types";

export type TradeModifyPayload = {
	ticket: number;
	sl?: number | null;
	tp?: number | null;
};

export type PreviousDay = {
	high: number;
	low: number;
};

export type ChartControllerProps = {
	activeSymbol: string;
	candles: Candle[];
	liveCandle: Candle | null;
	openTrades: OpenTrade[];
	pastTrades: PastTrade[];
	shapes: Shape[];
	activeShapeTool: ShapeToolType | null;
	config?: DeepPartial<ChartConfig>;
	brokerTimezoneOffsetMs?: number;
	previousDay?: PreviousDay | null;
	onShapeAdded?: (payload: ShapeAddedPayload) => void;
	onShapeModified?: (payload: ShapeModifiedPayload) => void;
	onShapeSelected?: (payload: ShapeSelectedPayload | null) => void;
	onActiveShapeToolChange?: (tool: ShapeToolType | null) => void;
	onTradeModify?: (payload: TradeModifyPayload) => void;
	onTradeClose?: (payload: { ticket: number }) => void;
};
