import type { ChartControllerProps } from "../chart/ChartController.types";
import type { CSSProperties } from "react";

export type TradingReloadProps = ChartControllerProps & {
	className?: string;
	style?: CSSProperties;
};
