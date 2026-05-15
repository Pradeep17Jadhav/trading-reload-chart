// chartConfig.types.ts
import type { PartialShapeConfig } from "../canvas/layers/ShapesLayer/ShapesLayer.types";

export type { PartialShapeConfig };

export type HorizontalZoomConfig = {
	speed: number;
	min: number;
	max: number;
};

export type VerticalZoomConfig = {
	speed: number;
	min: number;
	max: number;
};

export type ZoomConfig = {
	x: HorizontalZoomConfig;
	y: VerticalZoomConfig;
};

export type LivePriceLineConfig = {
	visible: boolean;
	width: number;
	opacity: number;
	dash: number[];
	bullishColor: string;
	bearishColor: string;
};

export type CandlesConfig = {
	defaultWidth: number;
	defaultGap: number;
	minBodyHeight: number;
	autoFollowLatestCandle: boolean;
	autoFollowThresholdCandles: number;
	rightOffsetCandles: number;
	livePriceLine: LivePriceLineConfig;
};

export type VolumeConfig = {
	visible: boolean;
	bullishColor: string;
	bearishColor: string;
	opacity: number;
	height: number;
	bottomOffset: number;
	minBarHeight: number;
};

export type CrosshairConfig = {
	color: string;
	thickness: number;
	style: "solid" | "dashed" | "dotted";
};

export type TradeHandlePositionConfig = {
	placement: "left" | "center" | "right";
	margin?: number;
};

export type TradeHandleLineConfig = {
	width: number;
	color: string;
	opacity: number;
	style: "solid" | "dashed" | "dotted";
	dash?: number[];
};

export type TradeHandleRectConfig = {
	height: number;
	widthVolume: number;
	widthPNL: number;
	widthClose: number;
	position: TradeHandlePositionConfig;
	borderWidth: number;
	borderColor: string;
	borderOpacity: number;
	backgroundColor: string;
	backgroundOpacity: number;
	sectionDividerColor: string;
	paddingX: number;
	closeButtonColor: string;
	showVolumeSection: boolean;
	showPnlSection: boolean;
	showCloseSection: boolean;
};

export type TradeHandleStyleConfig = {
	handle: TradeHandleRectConfig;
	handleLine: TradeHandleLineConfig;
};

export type TradePnlTextColorConfig = {
	positive: string;
	negative: string;
};

export type MissingTradeProtectionHandlePlacement = "left" | "right";

export type MissingTradeProtectionHandleRectConfig = {
	width: number;
	height: number;
	gapFromStartPriceHandle: number;
	gapBetweenHandles: number;
	placement: MissingTradeProtectionHandlePlacement;
	borderWidth: number;
	borderColor: string;
	borderOpacity: number;
	backgroundColor: string;
	backgroundOpacity: number;
	textColor: string;
	textOpacity: number;
	font: string;
};

export type TemporaryTradeProtectionHandleRectConfig = {
	height: number;
	widthPNL: number;
	position: TradeHandlePositionConfig;
	borderWidth: number;
	borderColor: string;
	borderOpacity: number;
	backgroundColor: string;
	backgroundOpacity: number;
	paddingX: number;
	textColor: string;
	textOpacity: number;
	font: string;
};

export type MissingTradeProtectionConfig = {
	visible: boolean;
	dragActivationThresholdPx: number;
	slHandle: MissingTradeProtectionHandleRectConfig;
	tpHandle: MissingTradeProtectionHandleRectConfig;
	temporarySlHandle: TemporaryTradeProtectionHandleRectConfig;
	temporaryTpHandle: TemporaryTradeProtectionHandleRectConfig;
	temporarySlLine: TradeHandleLineConfig;
	temporaryTpLine: TradeHandleLineConfig;
};

export type TradeHandlesConfig = {
	font: string;
	textColor: string;
	textOpacity: number;
	pnlTextColors: TradePnlTextColorConfig;
	slHandle: TradeHandleStyleConfig;
	tpHandle: TradeHandleStyleConfig;
	startPriceHandle: TradeHandleStyleConfig;
	missingProtectionHandles: MissingTradeProtectionConfig;
};

export type ColorsConfig = {
	bullish: string;
	bearish: string;
	background: string;
};

export type AxisCrosshairLabelConfig = {
	backgroundColor: string;
	borderColor: string;
	borderWidth: number;
	textColor: string;
	font: string;
	paddingX: number;
	height: number;
};

export type AxisYConfig = {
	width: number;
	backgroundColor: string;
	borderColor: string;
	borderWidth: number;
	textColor: string;
	font: string;
	textAlign: CanvasTextAlign;
	tickCount: number;
	tickColor: string;
	tickWidth: number;
	tickLength: number;
	labelOffsetX: number;
	crosshairLabel: AxisCrosshairLabelConfig;
};

export type AxisXConfig = {
	height: number;
	backgroundColor: string;
	borderColor: string;
	borderWidth: number;
	textColor: string;
	font: string;
	textAlign: CanvasTextAlign;
	tickColor: string;
	tickWidth: number;
	tickLength: number;
	labelOffsetY: number;
	minLabelGap: number;
	crosshairLabel: AxisCrosshairLabelConfig;
};

export type AxisConfig = {
	axisXHeight: number;
	axisX: AxisXConfig;
	axisY: AxisYConfig;
};

export type ChartConfig = {
	zoom: ZoomConfig;
	candles: CandlesConfig;
	volume: VolumeConfig;
	crosshair: CrosshairConfig;
	tradeHandles: TradeHandlesConfig;
	colors: ColorsConfig;
	axis: AxisConfig;
	shapes: PartialShapeConfig;
};
