"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { ChartController } from "../chart/ChartController";
import "../styles/chart.css";
import type { TradingReloadHandle, TradingReloadProps } from "./TradingReload.types";

export const TradingReload = forwardRef<TradingReloadHandle, TradingReloadProps>(
	({ className, style, ...chartProps }, ref) => {
		const containerRef = useRef<HTMLDivElement>(null);
		const controllerRef = useRef<ChartController | null>(null);
		const chartPropsRef = useRef(chartProps);

		chartPropsRef.current = chartProps;

		useImperativeHandle(ref, () => ({
			resetChartView() {
				controllerRef.current?.resetChartView();
			},
		}));

		useEffect(() => {
			const container = containerRef.current;

			if (!container) {
				return;
			}

			const controller = new ChartController(container, chartPropsRef.current);
			controllerRef.current = controller;

			return () => {
				controller.destroy();
				controllerRef.current = null;
			};
		}, []);

		// biome-ignore lint/correctness/useExhaustiveDependencies: We need multiple updates with the changes in chatProps
		useEffect(() => {
			controllerRef.current?.updateProps(chartPropsRef.current);
		}, [chartProps]);

		return (
			<div
				ref={containerRef}
				className={className}
				style={{
					width: "100%",
					height: "100%",
					...style,
				}}
			/>
		);
	},
);
