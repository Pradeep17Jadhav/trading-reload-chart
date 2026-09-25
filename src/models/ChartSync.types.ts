export type ChartViewState = {
	/** UTC timestamp of the chart's rightmost visible candle. */
	rightmostVisibleTime: number;
	/** Normalized screen position of that candle, from 0 to 1. */
	rightmostVisibleX: number;
	/** UTC timestamp of the plot's right edge. */
	rightEdgeTime: number;
	/** Visible duration represented by the plot, in milliseconds. */
	visibleDurationMs: number;
};

export type ChartCursorState = {
	/** UTC timestamp selected by the vertical crosshair. */
	time: number;
	/** Price selected by the horizontal crosshair. */
	price: number;
};
