/**
 * Horizontal zoom behavior configuration.
 *
 * Controls how the chart scales horizontally
 * when user zooms using mouse wheel, touchpad,
 * or pinch gestures.
 *
 * @example
 * {
 *   speed: 0.05,
 *   min: 0.03,
 *   max: 20
 * }
 */
export type HorizontalZoomConfig = {
	/**
	 * Controls how aggressively horizontal zoom reacts
	 * to user input.
	 *
	 * Higher values make zooming feel faster and more sensitive.
	 * Lower values create smoother and slower zoom transitions.
	 *
	 * @example 0.05
	 */
	speed: number;

	/**
	 * Minimum allowed horizontal zoom level.
	 *
	 * Prevents excessive zoom-out where candles become
	 * too compressed and unreadable.
	 *
	 * @example 0.03
	 */
	min: number;

	/**
	 * Maximum allowed horizontal zoom level.
	 *
	 * Prevents excessive zoom-in where individual candles
	 * become unrealistically large.
	 *
	 * @example 20
	 */
	max: number;
};

/**
 * Vertical zoom behavior configuration.
 *
 * Controls how the visible price range scales
 * when user performs vertical zoom interactions.
 *
 * @example
 * {
 *   speed: 0.1,
 *   min: 10,
 *   max: 500
 * }
 */
export type VerticalZoomConfig = {
	/**
	 * Controls how aggressively vertical zoom reacts
	 * to user input.
	 *
	 * Higher values increase zoom speed.
	 * Lower values create smoother zooming behavior.
	 *
	 * @example 0.1
	 */
	speed: number;

	/**
	 * Minimum allowed visible vertical price range
	 * as a percentage of the symbol's initial viewport range.
	 *
	 * Example:
	 * 100 = same as initial zoom
	 * 50  = allow zooming in to half of initial range
	 * 10  = allow zooming in to one tenth of initial range
	 *
	 * Prevents excessive zoom-in where candles become
	 * stretched vertically beyond practical readability.
	 *
	 * @example 10
	 */
	min: number;

	/**
	 * Maximum allowed visible vertical price range
	 * as a percentage of the symbol's initial viewport range.
	 *
	 * Example:
	 * 100 = same as initial zoom
	 * 200 = allow zooming out to double the initial range
	 * 500 = allow zooming out to five times the initial range
	 *
	 * Prevents excessive zoom-out where price movement
	 * becomes visually flattened.
	 *
	 * @example 500
	 */
	max: number;
};

/**
 * Complete chart zoom configuration.
 *
 * @example
 * {
 *   x: {
 *     speed: 0.05,
 *     min: 0.03,
 *     max: 20
 *   },
 *   y: {
 *     speed: 0.1,
 *     min: 10,
 *     max: 500
 *   }
 * }
 */
export type ZoomConfig = {
	/**
	 * Horizontal zoom settings.
	 */
	x: HorizontalZoomConfig;

	/**
	 * Vertical zoom settings.
	 */
	y: VerticalZoomConfig;
};

/**
 * Live price line rendering configuration.
 *
 * Controls the appearance of the horizontal line
 * rendered at the latest candle close price.
 *
 * @example
 * {
 *   visible: true,
 *   width: 1,
 *   opacity: 0.7,
 *   dash: [4, 4],
 *   bullishColor: "#22c55e",
 *   bearishColor: "#ef4444"
 * }
 */
export type LivePriceLineConfig = {
	/**
	 * Enables or disables live price line rendering.
	 *
	 * @example true
	 */
	visible: boolean;

	/**
	 * Thickness of live price line in pixels.
	 *
	 * @example 1
	 */
	width: number;

	/**
	 * Opacity of live price line.
	 *
	 * Value range:
	 * 0 = fully transparent
	 * 1 = fully visible
	 *
	 * @example 0.7
	 */
	opacity: number;

	/**
	 * Canvas dash pattern used for line styling.
	 *
	 * Example:
	 * [4, 4] creates equal dash-gap spacing.
	 *
	 * Empty array creates solid line.
	 *
	 * @example [4, 4]
	 */
	dash: number[];

	/**
	 * Line color used when latest candle
	 * closes above or equal to open price.
	 *
	 * @example "#22c55e"
	 */
	bullishColor: string;

	/**
	 * Line color used when latest candle
	 * closes below open price.
	 *
	 * @example "#ef4444"
	 */
	bearishColor: string;
};

/**
 * Candle rendering configuration.
 *
 * Controls candle sizing, spacing,
 * auto-follow behavior, and live price visuals.
 *
 * @example
 * {
 *   defaultWidth: 8,
 *   defaultGap: 2,
 *   minBodyHeight: 1,
 *   autoFollowLatestCandle: true,
 *   autoFollowThresholdCandles: 10,
 *   rightOffsetCandles: 15
 * }
 */
export type CandlesConfig = {
	/**
	 * Default candle body width in pixels.
	 *
	 * Larger values create wider candles.
	 *
	 * @example 8
	 */
	defaultWidth: number;

	/**
	 * Horizontal spacing between candles in pixels.
	 *
	 * @example 2
	 */
	defaultGap: number;

	/**
	 * Minimum visible candle body height in pixels.
	 *
	 * Prevents flat candles from becoming invisible
	 * when open and close prices are equal or nearly equal.
	 *
	 * @example 1
	 */
	minBodyHeight: number;

	/**
	 * Automatically keeps latest candle visible
	 * while new candles arrive.
	 *
	 * Useful for real-time trading charts.
	 *
	 * @example true
	 */
	autoFollowLatestCandle: boolean;

	/**
	 * Distance from right chart edge where
	 * auto-follow behavior activates.
	 *
	 * Example:
	 * 0 = activate only when latest candle
	 * reaches right edge.
	 *
	 * 10 = activate when latest candle reaches
	 * 10 candles away from right edge.
	 *
	 * @example 10
	 */
	autoFollowThresholdCandles: number;

	/**
	 * Number of empty future candle slots rendered
	 * on the right side of the chart.
	 *
	 * Creates visual breathing room so latest candle
	 * is not glued directly to chart edge.
	 *
	 * @example 15
	 */
	rightOffsetCandles: number;

	/**
	 * Live price line appearance settings.
	 */
	livePriceLine: LivePriceLineConfig;
};

/**
 * Crosshair rendering configuration.
 *
 * Controls appearance of horizontal and vertical
 * cursor guide lines displayed on chart hover.
 *
 * @example
 * {
 *   color: "rgba(255,255,255,0.35)",
 *   thickness: 1,
 *   style: "dashed"
 * }
 */
export type CrosshairConfig = {
	/**
	 * Crosshair line color.
	 *
	 * Supports any valid CSS color value.
	 *
	 * @example "rgba(255,255,255,0.35)"
	 */
	color: string;

	/**
	 * Crosshair line thickness in pixels.
	 *
	 * @example 1
	 */
	thickness: number;

	/**
	 * Crosshair line rendering style.
	 *
	 * solid  = continuous line
	 * dashed = spaced dash pattern
	 * dotted = dotted pattern
	 *
	 * @example "dashed"
	 */
	style: "solid" | "dashed" | "dotted";
};

/**
 * Trade handle placement configuration.
 *
 * Controls where the handle rectangle
 * is positioned horizontally inside chart.
 *
 * @example
 * {
 *   placement: "right",
 *   margin: 40
 * }
 */
export type TradeHandlePositionConfig = {
	/**
	 * Horizontal placement of handle.
	 *
	 * left   = aligned to left edge
	 * center = aligned to chart center
	 * right  = aligned to right edge
	 *
	 * @example "right"
	 */
	placement: "left" | "center" | "right";

	/**
	 * Horizontal spacing from edge.
	 *
	 * Used only when:
	 * - placement = "left"
	 * - placement = "right"
	 *
	 * Ignored for center placement.
	 *
	 * @example 40
	 */
	margin?: number;
};

/**
 * Trade handle line configuration.
 *
 * Controls visual appearance
 * of horizontal trade/order lines.
 *
 * @example
 * {
 *   width: 1,
 *   color: "#ef4444",
 *   opacity: 0.9,
 *   style: "dashed",
 *   dash: [4, 4]
 * }
 */
export type TradeHandleLineConfig = {
	/**
	 * Horizontal line thickness in pixels.
	 *
	 * @example 1
	 */
	width: number;

	/**
	 * Horizontal line color.
	 *
	 * Supports any valid CSS color.
	 *
	 * @example "#ef4444"
	 */
	color: string;

	/**
	 * Horizontal line opacity.
	 *
	 * 0 = invisible
	 * 1 = fully visible
	 *
	 * @example 0.9
	 */
	opacity: number;

	/**
	 * Horizontal line rendering style.
	 *
	 * solid  = continuous line
	 * dashed = segmented line
	 * dotted = dotted line
	 *
	 * @example "solid"
	 */
	style: "solid" | "dashed" | "dotted";

	/**
	 * Canvas dash pattern.
	 *
	 * Only applied when
	 * style = "dashed".
	 *
	 * @example [4, 4]
	 */
	dash?: number[];
};

/**
 * Trade handle rectangle configuration.
 *
 * Controls sizing, colors, borders,
 * spacing, section widths,
 * positioning, and visibility
 * of trade handle containers.
 *
 * @example
 * {
 *   height: 28,
 *   widthVolume: 80,
 *   widthPNL: 90,
 *   widthClose: 32
 * }
 */
export type TradeHandleRectConfig = {
	/**
	 * Total handle height in pixels.
	 *
	 * @example 28
	 */
	height: number;

	/**
	 * Width of volume section.
	 *
	 * @example 80
	 */
	widthVolume: number;

	/**
	 * Width of pnl section.
	 *
	 * @example 90
	 */
	widthPNL: number;

	/**
	 * Width of close section.
	 *
	 * @example 32
	 */
	widthClose: number;

	/**
	 * Handle horizontal placement settings.
	 */
	position: TradeHandlePositionConfig;

	/**
	 * Border thickness in pixels.
	 *
	 * @example 1
	 */
	borderWidth: number;

	/**
	 * Border color.
	 *
	 * Supports any valid CSS color.
	 *
	 * @example "#ffffff"
	 */
	borderColor: string;

	/**
	 * Border opacity.
	 *
	 * @example 0.25
	 */
	borderOpacity: number;

	/**
	 * Background fill color.
	 *
	 * @example "#111827"
	 */
	backgroundColor: string;

	/**
	 * Background fill opacity.
	 *
	 * @example 0.95
	 */
	backgroundOpacity: number;

	/**
	 * Divider color between sections.
	 *
	 * @example "rgba(255,255,255,0.12)"
	 */
	sectionDividerColor: string;

	/**
	 * Internal horizontal padding.
	 *
	 * @example 10
	 */
	paddingX: number;

	/**
	 * Close button text/icon color.
	 *
	 * @example "#ef4444"
	 */
	closeButtonColor: string;

	/**
	 * Controls visibility of
	 * volume section.
	 *
	 * @example true
	 */
	showVolumeSection: boolean;

	/**
	 * Controls visibility of
	 * pnl section.
	 *
	 * @example true
	 */
	showPnlSection: boolean;

	/**
	 * Controls visibility of
	 * close button section.
	 *
	 * @example true
	 */
	showCloseSection: boolean;
};

/**
 * Reusable trade handle style configuration.
 *
 * Combines:
 * - rectangle visuals
 * - horizontal line visuals
 *
 * Used for:
 * - SL handles
 * - TP handles
 * - Start price handles
 * - Future pending order handles
 *
 * @example
 * {
 *   handle: { ... },
 *   handleLine: { ... }
 * }
 */
export type TradeHandleStyleConfig = {
	/**
	 * Rectangle handle visuals.
	 */
	handle: TradeHandleRectConfig;

	/**
	 * Horizontal line visuals.
	 */
	handleLine: TradeHandleLineConfig;
};

/**
 * Global trade handle configuration.
 *
 * Contains shared typography settings
 * and individual styling for each
 * trade handle type.
 *
 * @example
 * {
 *   font: "12px Inter",
 *   textColor: "#ffffff",
 *   textOpacity: 0.8,
 *   slHandle: { ... },
 *   tpHandle: { ... },
 *   startPriceHandle: { ... }
 * }
 */
export type TradeHandlesConfig = {
	/**
	 * Canvas font declaration.
	 *
	 * @example "12px Inter"
	 */
	font: string;

	/**
	 * Shared text color used across
	 * all trade handles.
	 *
	 * @example "#ffffff"
	 */
	textColor: string;

	/**
	 * Shared text opacity.
	 *
	 * @example 0.8
	 */
	textOpacity: number;

	/**
	 * Stop-loss handle styling.
	 */
	slHandle: TradeHandleStyleConfig;

	/**
	 * Take-profit handle styling.
	 */
	tpHandle: TradeHandleStyleConfig;

	/**
	 * Entry/start price handle styling.
	 */
	startPriceHandle: TradeHandleStyleConfig;
};

/**
 * Global chart color palette.
 *
 * Defines default colors used across chart rendering.
 *
 * @example
 * {
 *   bullish: "#22c55e",
 *   bearish: "#ef4444",
 *   background: "#11131a"
 * }
 */
export type ColorsConfig = {
	/**
	 * Color used for bullish candles
	 * where close price >= open price.
	 *
	 * @example "#22c55e"
	 */
	bullish: string;

	/**
	 * Color used for bearish candles
	 * where close price < open price.
	 *
	 * @example "#ef4444"
	 */
	bearish: string;

	/**
	 * Main chart background color.
	 *
	 * @example "#11131a"
	 */
	background: string;
};

/**
 * Vertical price axis configuration.
 *
 * Controls appearance, spacing,
 * typography, tick rendering,
 * and alignment of the right-side
 * price axis.
 *
 * @example
 * {
 *   width: 60,
 *   backgroundColor: "#0f172a",
 *   borderColor: "rgba(255,255,255,0.08)",
 *   borderWidth: 1,
 *   textColor: "rgba(255,255,255,0.8)",
 *   font: "11px Inter",
 *   textAlign: "left",
 *   tickCount: 12,
 *   tickColor: "rgba(255,255,255,0.06)",
 *   tickWidth: 1,
 *   tickLength: 8,
 *   labelOffsetX: 12
 * }
 */

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
	/**
	 * Width of right-side axis canvas.
	 *
	 * @example 60
	 */
	width: number;

	/**
	 * Axis background fill color.
	 *
	 * @example "#0f172a"
	 */
	backgroundColor: string;

	/**
	 * Left border color of axis.
	 *
	 * @example "rgba(255,255,255,0.08)"
	 */
	borderColor: string;

	/**
	 * Left border thickness in pixels.
	 *
	 * @example 1
	 */
	borderWidth: number;

	/**
	 * Label text color.
	 *
	 * @example "rgba(255,255,255,0.8)"
	 */
	textColor: string;

	/**
	 * Canvas font declaration.
	 *
	 * @example "11px Inter"
	 */
	font: string;

	/**
	 * Horizontal text alignment.
	 *
	 * @example "left"
	 */
	textAlign: CanvasTextAlign;

	/**
	 * Number of visible ticks.
	 *
	 * Higher values create denser axis labels.
	 *
	 * @example 12
	 */
	tickCount: number;

	/**
	 * Tick line color.
	 *
	 * @example "rgba(255,255,255,0.06)"
	 */
	tickColor: string;

	/**
	 * Tick line thickness in pixels.
	 *
	 * @example 1
	 */
	tickWidth: number;

	/**
	 * Horizontal tick line length in pixels.
	 *
	 * @example 8
	 */
	tickLength: number;

	/**
	 * Horizontal label offset from tick line.
	 *
	 * @example 12
	 */
	labelOffsetX: number;

	crosshairLabel: AxisCrosshairLabelConfig;
};

/**
 * Axis layout and rendering configuration.
 *
 * Controls sizing and appearance
 * of chart axes.
 *
 * @example
 * {
 *   axisXHeight: 32,
 *   axisY: {
 *     width: 60
 *   }
 * }
 */
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
	/**
	 * Bottom horizontal axis height in pixels.
	 *
	 * @example 32
	 */
	axisXHeight: number;

	/**
	 * Right-side vertical axis configuration.
	 */
	axisX: AxisXConfig;
	axisY: AxisYConfig;
};

/**
 * Complete chart configuration object.
 *
 * Contains all configurable behavior and styling
 * options for chart rendering, interaction,
 * zooming, candles, crosshair, trade handles,
 * and colors.
 *
 * @example
 * {
 *   zoom: { ... },
 *   candles: { ... },
 *   crosshair: { ... },
 *   tradeHandles: { ... },
 *   colors: { ... }
 * }
 */
export type ChartConfig = {
	/**
	 * Zoom interaction settings.
	 */
	zoom: ZoomConfig;

	/**
	 * Candle rendering settings.
	 */
	candles: CandlesConfig;

	/**
	 * Crosshair appearance settings.
	 */
	crosshair: CrosshairConfig;

	/**
	 * Trade handle rendering settings.
	 */
	tradeHandles: TradeHandlesConfig;

	/**
	 * Global chart color settings.
	 */
	colors: ColorsConfig;

	/**
	 * Chart axis configuration.
	 */
	axis: AxisConfig;
};
