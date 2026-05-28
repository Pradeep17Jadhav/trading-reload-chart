import type { PartialShapeConfig, PositionShapeConfig } from "../../canvas/layers/ShapesLayer/ShapesLayer.types";
import { COLORS } from "../colors";

const SHAPE_COLORS = {
	...COLORS,
	gray: "#808080",
	orange: "#ff9500",
	purple: "#af52de",
	handleBorder: COLORS.blue,
	handleFill: COLORS.background,
} as const;

const commonPositionConfig: Partial<PositionShapeConfig> = {
	defaultWidthCandles: 10,
	defaultStopLossPercent: 0.1,
	defaultRiskRewardRatio: 1.5,
	profitFillColor: SHAPE_COLORS.green,
	profitFillOpacity: 0.18,
	lossFillColor: SHAPE_COLORS.red,
	lossFillOpacity: 0.18,
	borderColor: SHAPE_COLORS.gray,
	borderOpacity: 0, //disabled
	borderWidth: 1,
	borderStyle: "solid" as const,
	midLineColor: SHAPE_COLORS.gray,
	midLineOpacity: 0.9,
	midLineWidth: 0.5,
	midLineStyle: "solid" as const,
	handleColor: SHAPE_COLORS.handleFill,
	handleBorderColor: SHAPE_COLORS.handleBorder,
	handleBorderThickness: 1.5,
	handleRadius: 5,
	hoverLineWidth: 2,
	selectedLineWidth: 2,
};

export const CHART_SHAPE_CONFIG: PartialShapeConfig = {
	trendline: {
		lineWidth: 1,
		lineColor: SHAPE_COLORS.blue,
		lineOpacity: 1,
		lineStyle: "solid",
		fillColor: SHAPE_COLORS.blue,
		fillOpacity: 0,
		handleColor: SHAPE_COLORS.handleFill,
		handleBorderColor: SHAPE_COLORS.handleBorder,
		handleRadius: 5,
		hoverLineWidth: 1,
		selectedLineWidth: 1.1,
	},

	rectangle: {
		lineWidth: 1,
		lineColor: SHAPE_COLORS.purple,
		lineOpacity: 0.6,
		lineStyle: "solid",
		fillColor: SHAPE_COLORS.purple,
		fillOpacity: 0.06,
		handleColor: SHAPE_COLORS.handleFill,
		handleBorderColor: SHAPE_COLORS.handleBorder,
		handleRadius: 5,
		hoverLineWidth: 1,
		selectedLineWidth: 1.1,
		textColor: COLORS.white,
		textOpacity: 1,
		textFontFamily: "Arial",
		textFontSize: 20,
	},

	path: {
		lineWidth: 1,
		lineColor: SHAPE_COLORS.yellow,
		lineOpacity: 0.8,
		lineStyle: "solid",
		fillColor: SHAPE_COLORS.yellow,
		fillOpacity: 0,
		handleColor: SHAPE_COLORS.handleFill,
		handleBorderColor: SHAPE_COLORS.handleBorder,
		handleRadius: 5,
		hoverLineWidth: 1,
		selectedLineWidth: 1.1,
	},

	fibRetracement: {
		levels: [
			{
				level: 1,
				label: "1",
				color: SHAPE_COLORS.gray,
				opacity: 0.5,
				lineWidth: 1,
				lineStyle: "dashed",
			},
			{
				level: 0.72,
				label: "0.720",
				color: SHAPE_COLORS.red,
				opacity: 0.5,
				lineWidth: 1,
				lineStyle: "dashed",
			},
			{
				level: 0.618,
				label: "0.618",
				color: SHAPE_COLORS.orange,
				opacity: 0.5,
				lineWidth: 1,
				lineStyle: "dashed",
			},
			{
				level: 0.5,
				label: "0.5",
				color: SHAPE_COLORS.purple,
				opacity: 0.5,
				lineWidth: 1,
				lineStyle: "dashed",
			},
			{
				level: 0,
				label: "0",
				color: SHAPE_COLORS.gray,
				opacity: 0.5,
				lineWidth: 1,
				lineStyle: "dashed",
			},
		],
		fillColor: SHAPE_COLORS.gray,
		fillOpacity: 0,
		handleColor: SHAPE_COLORS.handleFill,
		handleBorderColor: SHAPE_COLORS.handleBorder,
		handleRadius: 5,
		hoverLineWidth: 1,
		selectedLineWidth: 1,
	},

	longPosition: { ...commonPositionConfig },

	shortPosition: { ...commonPositionConfig },

	previousDayHighLow: {
		line: {
			color: COLORS.red,
			width: 1,
			opacity: 0.7,
			dash: [4, 16],
		},
		text: {
			color: COLORS.white,
			font: "11px Arial",
			paddingX: 6,
		},
	},
};
