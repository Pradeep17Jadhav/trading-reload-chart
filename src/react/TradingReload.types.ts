import type { CSSProperties } from "react";
import type { ChartControllerProps } from "../chart/ChartController.types";

export type TradingReloadHandle = {
	resetChartView: () => void;
};

export type TradingReloadProps = ChartControllerProps & {
	className?: string;
	style?: CSSProperties;
};
