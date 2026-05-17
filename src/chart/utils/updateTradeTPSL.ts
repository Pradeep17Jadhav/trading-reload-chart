import type { TradeHandleType } from "../../canvas/layers/TradeLayer/TradeLayer.types";
import type { OpenTrade } from "../../models/Trade";

export const updateTradeTPSL = ({
	currentTrade,
	targetTrade,
	type,
	price,
}: {
	currentTrade: OpenTrade;
	targetTrade: OpenTrade;
	type: TradeHandleType;
	price: number;
}): OpenTrade => {
	if (currentTrade.ticket !== targetTrade.ticket) {
		return currentTrade;
	}

	if (type === "stopLoss") {
		return {
			...currentTrade,
			sl: price,
		};
	}

	if (type === "takeProfit") {
		return {
			...currentTrade,
			tp: price,
		};
	}

	return currentTrade;
};
