import type { PartialShapeConfig } from "../../canvas/layers/ShapesLayer/ShapesLayer.types";
import { COLORS } from "../colors";

const SHAPE_COLORS = {
	...COLORS,
	gray: "#808080",
	orange: "#ff9500",
	purple: "#af52de",
	handleBorder: COLORS.blue,
	handleFill: COLORS.white,
} as const;

const commonPositionConfig = {
	defaultWidthCandles: 10,
	defaultStopLossPercent: 0.25,
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
	handleRadius: 5,
	hoverLineWidth: 2,
	selectedLineWidth: 2,
};

export const CHART_SHAPE_CONFIG: PartialShapeConfig = {
	trendline: {
		lineWidth: 2,
		lineColor: SHAPE_COLORS.blue,
		lineOpacity: 1,
		lineStyle: "solid",
		fillColor: SHAPE_COLORS.blue,
		fillOpacity: 0,
		handleColor: SHAPE_COLORS.handleFill,
		handleBorderColor: SHAPE_COLORS.handleBorder,
		handleRadius: 5,
		hoverLineWidth: 3,
		selectedLineWidth: 3,
	},

	rectangle: {
		lineWidth: 1,
		lineColor: SHAPE_COLORS.blue,
		lineOpacity: 0.9,
		lineStyle: "solid",
		fillColor: SHAPE_COLORS.blue,
		fillOpacity: 0.08,
		handleColor: SHAPE_COLORS.handleFill,
		handleBorderColor: SHAPE_COLORS.handleBorder,
		handleRadius: 5,
		hoverLineWidth: 2,
		selectedLineWidth: 2,
	},

	path: {
		lineWidth: 2,
		lineColor: SHAPE_COLORS.blue,
		lineOpacity: 1,
		lineStyle: "solid",
		fillColor: SHAPE_COLORS.blue,
		fillOpacity: 0,
		handleColor: SHAPE_COLORS.handleFill,
		handleBorderColor: SHAPE_COLORS.handleBorder,
		handleRadius: 5,
		hoverLineWidth: 3,
		selectedLineWidth: 3,
	},

	fibRetracement: {
		levels: [
			{
				level: 1,
				label: "1",
				color: SHAPE_COLORS.gray,
				opacity: 0.8,
				lineWidth: 1,
				lineStyle: "dashed",
			},
			{
				level: 0.72,
				label: "0.720",
				color: SHAPE_COLORS.red,
				opacity: 0.8,
				lineWidth: 1,
				lineStyle: "dashed",
			},
			{
				level: 0.618,
				label: "0.618",
				color: SHAPE_COLORS.orange,
				opacity: 0.8,
				lineWidth: 1,
				lineStyle: "dashed",
			},
			{
				level: 0.5,
				label: "0.5",
				color: SHAPE_COLORS.purple,
				opacity: 0.8,
				lineWidth: 1,
				lineStyle: "dashed",
			},
			{
				level: 0,
				label: "0",
				color: SHAPE_COLORS.gray,
				opacity: 0.8,
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
};
