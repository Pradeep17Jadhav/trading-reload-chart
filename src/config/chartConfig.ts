// chartConfig.ts

import type {
	ChartConfig,
	MissingTradeProtectionHandleRectConfig,
	TemporaryTradeProtectionHandleRectConfig,
	TradeHandleLineConfig,
	TradeHandleRectConfig,
} from "./chartConfig.types";

const COLORS = {
	blue: "#2962ff",
	green: "#22c55e",
	red: "#ef4444",
	background: "#11131a",
	handleBackground: "#111827",
	slBackground: "#2a1111",
	tpBackground: "#0d2418",
	axisBorder: "rgb(89, 89, 89)",
	axisText: "rgba(255, 255, 255, 0.60)",
	axisTick: "rgba(255,255,255,0.12)",
	axisYTick: "rgba(255,255,255,0.06)",
	divider: "rgba(255,255,255,0.12)",
	white: "#ffffff",
	crosshairLabelBackground: "#494949",
} as const;

const FONT = {
	default: "12px Arial",
} as const;

const commonDashedLine: Pick<TradeHandleLineConfig, "width" | "opacity" | "style" | "dash"> = {
	width: 1,
	opacity: 0.9,
	style: "dashed",
	dash: [4, 4],
};

const commonDottedLine: Pick<TradeHandleLineConfig, "width" | "opacity" | "style" | "dash"> = {
	width: 1,
	opacity: 0.9,
	style: "dotted",
	dash: [2, 4],
};

const commonHandleProperties: TradeHandleRectConfig = {
	height: 22,
	widthVolume: 60,
	widthPNL: 80,
	widthClose: 24,
	position: {
		placement: "left",
		margin: 100,
	},
	borderWidth: 1,
	borderColor: COLORS.blue,
	borderOpacity: 0.9,
	backgroundColor: COLORS.handleBackground,
	backgroundOpacity: 0.9,
	sectionDividerColor: COLORS.divider,
	paddingX: 10,
	closeButtonColor: COLORS.blue,
	showVolumeSection: true,
	showPnlSection: true,
	showCloseSection: true,
};

const commonMissingProtectionHandleProperties: MissingTradeProtectionHandleRectConfig = {
	width: 32,
	height: 22,
	gapFromStartPriceHandle: 6,
	gapBetweenHandles: 4,
	placement: "right",
	borderWidth: 1,
	borderColor: COLORS.white,
	borderOpacity: 0.5,
	backgroundColor: COLORS.handleBackground,
	backgroundOpacity: 0.3,
	textColor: COLORS.white,
	textOpacity: 0.6,
	font: FONT.default,
};

const commonTemporaryProtectionHandleProperties: TemporaryTradeProtectionHandleRectConfig = {
	height: 22,
	widthPNL: 80,
	position: {
		placement: "left",
		margin: 100,
	},
	borderWidth: 1,
	borderColor: COLORS.white,
	borderOpacity: 0.45,
	backgroundColor: COLORS.handleBackground,
	backgroundOpacity: 0.9,
	paddingX: 10,
	textColor: COLORS.white,
	textOpacity: 0.85,
	font: FONT.default,
};

export const CHART_CONFIG: ChartConfig = {
	zoom: {
		x: {
			speed: 0.05,
			min: 0.03,
			max: 20,
		},
		y: {
			speed: 0.1,
			min: 10,
			max: 500,
		},
	},

	candles: {
		defaultWidth: 8,
		defaultGap: 2,
		minBodyHeight: 1,
		autoFollowLatestCandle: true,
		autoFollowThresholdCandles: 10,
		rightOffsetCandles: 15,

		livePriceLine: {
			visible: true,
			width: 1,
			opacity: 0.7,
			dash: [4, 4],
			bullishColor: COLORS.green,
			bearishColor: COLORS.red,
		},
	},

	crosshair: {
		color: "rgba(255,255,255,0.35)",
		thickness: 1,
		style: "dashed",
	},

	axis: {
		axisXHeight: 30,

		axisX: {
			height: 30,
			backgroundColor: COLORS.background,
			borderColor: COLORS.axisBorder,
			borderWidth: 1,
			textColor: COLORS.axisText,
			font: FONT.default,
			textAlign: "center",
			tickColor: COLORS.axisTick,
			tickWidth: 1,
			tickLength: 4,
			labelOffsetY: 16,
			minLabelGap: 16,
			crosshairLabel: {
				backgroundColor: COLORS.crosshairLabelBackground,
				borderColor: COLORS.crosshairLabelBackground,
				borderWidth: 1,
				textColor: COLORS.white,
				font: FONT.default,
				paddingX: 8,
				height: 26,
			},
		},

		axisY: {
			width: 80,
			backgroundColor: COLORS.background,
			borderColor: COLORS.axisBorder,
			borderWidth: 1,
			textColor: COLORS.axisText,
			font: FONT.default,
			textAlign: "left",
			tickCount: 12,
			tickColor: COLORS.axisYTick,
			tickWidth: 1,
			tickLength: 8,
			labelOffsetX: 8,
			crosshairLabel: {
				backgroundColor: COLORS.crosshairLabelBackground,
				borderColor: COLORS.crosshairLabelBackground,
				borderWidth: 1,
				textColor: COLORS.white,
				font: FONT.default,
				paddingX: 8,
				height: 20,
			},
		},
	},

	tradeHandles: {
		font: FONT.default,
		textColor: COLORS.white,
		textOpacity: 0.8,

		pnlTextColors: {
			positive: COLORS.green,
			negative: COLORS.red,
		},

		slHandle: {
			handle: {
				...commonHandleProperties,
				borderColor: COLORS.red,
				borderOpacity: 0.4,
				backgroundColor: COLORS.slBackground,
				closeButtonColor: COLORS.red,
				showVolumeSection: false,
			},

			handleLine: {
				...commonDashedLine,
				color: COLORS.red,
			},
		},

		tpHandle: {
			handle: {
				...commonHandleProperties,
				borderColor: COLORS.green,
				borderOpacity: 0.4,
				backgroundColor: COLORS.tpBackground,
				closeButtonColor: COLORS.green,
				showVolumeSection: false,
			},

			handleLine: {
				...commonDashedLine,
				color: COLORS.green,
			},
		},

		startPriceHandle: {
			handle: {
				...commonHandleProperties,
			},

			handleLine: {
				width: 1,
				color: COLORS.blue,
				opacity: 1,
				style: "solid",
			},
		},

		missingProtectionHandles: {
			visible: true,
			dragActivationThresholdPx: 2,

			slHandle: {
				...commonMissingProtectionHandleProperties,
				borderColor: COLORS.red,
				backgroundColor: COLORS.slBackground,
				textColor: COLORS.red,
			},

			tpHandle: {
				...commonMissingProtectionHandleProperties,
				borderColor: COLORS.green,
				backgroundColor: COLORS.tpBackground,
				textColor: COLORS.green,
			},

			temporarySlHandle: {
				...commonTemporaryProtectionHandleProperties,
				borderColor: COLORS.red,
				backgroundColor: COLORS.slBackground,
				textColor: COLORS.red,
			},

			temporaryTpHandle: {
				...commonTemporaryProtectionHandleProperties,
				borderColor: COLORS.green,
				backgroundColor: COLORS.tpBackground,
				textColor: COLORS.green,
			},

			temporarySlLine: {
				...commonDottedLine,
				color: COLORS.red,
			},

			temporaryTpLine: {
				...commonDottedLine,
				color: COLORS.green,
			},
		},
	},

	colors: {
		bullish: COLORS.green,
		bearish: COLORS.red,
		background: COLORS.background,
	},
};
