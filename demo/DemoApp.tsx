import { useCallback, useEffect, useState } from "react";
import type { Shape, ShapeToolType } from "../src/canvas/layers/ShapesLayer/ShapesLayer.types";
import type { PastTradeIndicator } from "../src/canvas/layers/TradeLayer/TradeLayer.types";
import type { TradeModifyPayload } from "../src/chart/ChartController.types";
import type { Candle } from "../src/models/Candle";
import type { OpenTrade } from "../src/models/Trade";
import { TradingReload } from "../src/react/TradingReload";
import { createDemoShapes } from "./createDemoShapes";
import {
	fetchHistoricalCandles,
	fetchPastTrades,
	getModifiedTradeFromResponse,
	modifyTrade,
	subscribeLiveCandles,
	subscribeOpenTrades,
} from "./demoApi";
import {
	DEMO_ACTIVE_SYMBOL,
	DEMO_BROKER_TIMEZONE_OFFSET_MS,
	DEMO_CHART_CONFIG,
	DEMO_INITIAL_SHAPE_TOOL,
} from "./demoDefaults";

const applyTradeModifyToOpenTrades = ({
	trades,
	data,
	fallbackPayload,
}: {
	trades: OpenTrade[];
	data: unknown;
	fallbackPayload: TradeModifyPayload;
}) => {
	const responseTrade = getModifiedTradeFromResponse(data);

	return trades.map((trade) => {
		if (responseTrade && trade.ticket === responseTrade.ticket) {
			return {
				...trade,
				...responseTrade,
			};
		}

		if (trade.ticket !== fallbackPayload.ticket) {
			return trade;
		}

		return {
			...trade,
			...(fallbackPayload.sl !== undefined ? { sl: fallbackPayload.sl } : {}),
			...(fallbackPayload.tp !== undefined ? { tp: fallbackPayload.tp } : {}),
		};
	});
};

export const DemoApp = () => {
	const [candles, setCandles] = useState<Candle[]>([]);
	const [liveCandle, setLiveCandle] = useState<Candle | null>(null);
	const [openTrades, setOpenTrades] = useState<OpenTrade[]>([]);
	const [pastTrades, setPastTrades] = useState<PastTradeIndicator[]>([]);
	const [shapes, setShapes] = useState<Shape[]>([]);
	const [activeShapeTool, setActiveShapeTool] = useState<ShapeToolType | null>(DEMO_INITIAL_SHAPE_TOOL);
	const [loadError, setLoadError] = useState<string | null>(null);

	useEffect(() => {
		let isCancelled = false;

		const load = async () => {
			try {
				const [historicalCandles, history] = await Promise.all([fetchHistoricalCandles(), fetchPastTrades()]);

				if (isCancelled) {
					return;
				}

				setCandles(historicalCandles);
				setPastTrades(history);
				setShapes(createDemoShapes(historicalCandles));
			} catch (error) {
				if (!isCancelled) {
					setLoadError(error instanceof Error ? error.message : "Failed to load chart data");
					console.error("Failed to load candles", error);
				}
			}
		};

		void load();

		return () => {
			isCancelled = true;
		};
	}, []);

	useEffect(() => {
		if (candles.length === 0) {
			return;
		}

		return subscribeOpenTrades(setOpenTrades);
	}, [candles.length]);

	useEffect(() => {
		if (candles.length === 0) {
			return;
		}

		return subscribeLiveCandles((candle) => {
			setLiveCandle(candle);
		});
	}, [candles.length]);

	useEffect(() => {
		window.setActiveShapeTool = (tool: ShapeToolType | null) => {
			setActiveShapeTool(tool);
		};
		window.getShapeToolActive = () => activeShapeTool !== null;

		return () => {
			delete window.setActiveShapeTool;
			delete window.getShapeToolActive;
		};
	}, [activeShapeTool]);

	const handleTradeModify = useCallback(async (payload: TradeModifyPayload) => {
		try {
			const { data, fallbackPayload } = await modifyTrade(payload);
			setOpenTrades((currentTrades) =>
				applyTradeModifyToOpenTrades({
					trades: currentTrades,
					data,
					fallbackPayload,
				}),
			);
		} catch (error) {
			console.error("Failed to modify the trade", error);
		}
	}, []);

	if (loadError) {
		return (
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					width: "100%",
					height: "100%",
					color: "#f5f5f5",
				}}
			>
				{loadError}
			</div>
		);
	}

	return (
		<TradingReload
			activeSymbol={DEMO_ACTIVE_SYMBOL}
			candles={candles}
			liveCandle={liveCandle}
			openTrades={openTrades}
			pastTrades={pastTrades}
			shapes={shapes}
			activeShapeTool={activeShapeTool}
			config={DEMO_CHART_CONFIG}
			brokerTimezoneOffsetMs={DEMO_BROKER_TIMEZONE_OFFSET_MS}
			onShapeAdded={(payload) => {
				console.log("Shape added", payload);
				setShapes((currentShapes) => [...currentShapes, payload.shape]);
				setActiveShapeTool(null);
			}}
			onShapeModified={(payload) => {
				console.log("Shape modified", payload);
				setShapes((currentShapes) =>
					currentShapes.map((shape) => (shape.id === payload.shape.id ? payload.shape : shape)),
				);
			}}
			onActiveShapeToolChange={setActiveShapeTool}
			onTradeModify={handleTradeModify}
		/>
	);
};

declare global {
	interface Window {
		setActiveShapeTool?: (tool: ShapeToolType | null) => void;
		getShapeToolActive?: () => boolean;
	}
}
