import type { CSSProperties } from "react";
import type { ChartControllerProps } from "../chart/ChartController.types";

/**
 * Imperative methods exposed through the `ref` passed to {@link TradingReload}.
 *
 * @example
 * ```tsx
 * const chartRef = useRef<TradingReloadHandle>(null);
 *
 * <TradingReload ref={chartRef} {...props} />;
 *
 * chartRef.current?.resetChartView();
 * ```
 */
export type TradingReloadHandle = {
	/**
	 * Resets the chart back to its default pan and zoom state.
	 *
	 * @example
	 * ```tsx
	 * <button onClick={() => chartRef.current?.resetChartView()}>
	 *   Reset view
	 * </button>
	 * ```
	 */
	resetChartView: () => void;
};

/**
 * Props accepted by the public `TradingReload` React component.
 *
 * All market data, shapes, trades, and active tool state are controlled by the
 * parent application.
 *
 * @example
 * ```tsx
 * <TradingReload
 *   activeSymbol="EURUSD"
 *   candles={candles}
 *   liveCandle={liveCandle}
 *   openTrades={openTrades}
 *   pastTrades={pastTrades}
 *   shapes={shapes}
 *   activeShapeTool={activeShapeTool}
 *   onShapeAdded={({ shape }) => setShapes((prev) => [...prev, shape])}
 *   onActiveShapeToolChange={setActiveShapeTool}
 * />
 * ```
 */
export type TradingReloadProps = ChartControllerProps & {
	/**
	 * Optional class applied to the chart root element.
	 *
	 * @example
	 * ```tsx
	 * <TradingReload className="chart-shell" {...props} />
	 * ```
	 */
	className?: string;

	/**
	 * Optional inline styles applied to the chart root element.
	 *
	 * The chart always stretches to `width: 100%` and `height: 100%` of the
	 * parent, so give the parent a real size.
	 *
	 * @example
	 * ```tsx
	 * <TradingReload
	 *   style={{ minHeight: 480, borderRadius: 12 }}
	 *   {...props}
	 * />
	 * ```
	 */
	style?: CSSProperties;
};
