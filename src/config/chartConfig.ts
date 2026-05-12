export const CHART_CONFIG = {
	zoom: {
		x: {
			speed: 0.1,

			min: 0.03,

			max: 20,
		},

		y: {
			speed: 0.1,

			min: 0.2,

			max: 10,
		},
	},

	candles: {
		defaultWidth: 8,

		defaultGap: 2,

		minBodyHeight: 1,

		/**
		 * Automatically keep
		 * latest candle visible
		 */
		autoFollowLatestCandle: true,

		/**
		 * Number of candles from
		 * right edge where auto-follow
		 * activates.
		 *
		 * 0 =
		 * only when latest candle
		 * reaches right edge
		 *
		 * 10 =
		 * auto-follow activates when
		 * latest candle reaches
		 * 10th position from right
		 */
		autoFollowThresholdCandles: 10,

		/**
		 * Empty future candle space
		 * on right side
		 */
		rightOffsetCandles: 15,

		/**
		 * Live price line
		 */
		livePriceLine: {
			visible: true,

			width: 1,

			opacity: 0.7,

			dash: [4, 4],
			bullishColor: "#22c55e",
			bearishColor: "#ef4444",
		},
	},

	crosshair: {
		color: "rgba(255,255,255,0.35)",

		thickness: 1,

		style: "dashed",
	},

	colors: {
		bullish: "#22c55e",

		bearish: "#ef4444",

		background: "#11131a",
	},
} as const;
