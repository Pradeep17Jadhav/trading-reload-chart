import type {
	Shape,
	ShapeAddedPayload,
	ShapeModifiedPayload,
	ShapeToolType,
} from "../canvas/layers/ShapesLayer/ShapesLayer.types";
import type { PastTradeIndicator } from "../canvas/layers/TradeLayer/TradeLayer.types";
import type { ChartConfig } from "../config/chartConfig.types";
import type { Candle } from "../models/Candle";
import type { OpenTrade } from "../models/Trade";
import type { DeepPartial } from "./utils/deepPartial";

export type TradeModifyPayload = {
	ticket: number;
	sl?: number | null;
	tp?: number | null;
};

export type ChartControllerProps = {
	activeSymbol: string;
	candles: Candle[];
	liveCandle?: Candle | null;
	openTrades?: OpenTrade[];
	pastTrades?: PastTradeIndicator[];
	shapes: Shape[];
	activeShapeTool: ShapeToolType | null;
	config?: DeepPartial<ChartConfig>;
	brokerTimezoneOffsetMs?: number;
	onShapeAdded?: (payload: ShapeAddedPayload) => void;
	onShapeModified?: (payload: ShapeModifiedPayload) => void;
	onActiveShapeToolChange?: (tool: ShapeToolType | null) => void;
	onTradeModify?: (payload: TradeModifyPayload) => void;
};
