/**
 * Trade direction used by open and historical trade overlays.
 *
 * @example `"buy"`
 */
export type TradeDirection = "buy" | "sell";

/**
 * Shared trade fields used by open and closed trade records.
 *
 * @example
 * ```ts
 * const trade: BaseTrade = {
 *   ticket: 101245,
 *   symbol: "EURUSD",
 *   volume: 0.5,
 *   sl: 1.0835,
 *   tp: 1.091,
 *   type: "buy",
 *   openTime: 1716883200000,
 *   openPrice: 1.085,
 *   commission: 0,
 *   swap: 0,
 *   pnl: 12.5,
 * };
 * ```
 */
export type BaseTrade = {
	/** Broker ticket identifier.
	 *
	 * @example `101245`
	 */
	ticket: number;
	/** Trade symbol.
	 *
	 * @example `"EURUSD"`
	 */
	symbol: string;
	/** Position size or lot size.
	 *
	 * @example `0.5`
	 */
	volume: number;
	/** Stop-loss price, or `null` when not set.
	 *
	 * @example `1.0835`
	 */
	sl: number | null;
	/** Take-profit price, or `null` when not set.
	 *
	 * @example `1.091`
	 */
	tp: number | null;
	/** Trade direction.
	 *
	 * @example `"buy"`
	 */
	type: TradeDirection;
	/** Trade open time in milliseconds UTC.
	 *
	 * @example `1716883200000`
	 */
	openTime: number;
	/** Trade entry price.
	 *
	 * @example `1.085`
	 */
	openPrice: number;
	/** Commission charged by the broker.
	 *
	 * @example `0`
	 */
	commission: number;
	/** Swap or rollover cost.
	 *
	 * @example `0`
	 */
	swap: number;
	/** Current or realized profit and loss.
	 *
	 * @example `12.5`
	 */
	pnl: number;
};

/**
 * Open trade rendered with draggable protection handles.
 *
 * @example
 * ```ts
 * const trade: OpenTrade = {
 *   ticket: 101245,
 *   symbol: "EURUSD",
 *   volume: 0.5,
 *   sl: 1.0835,
 *   tp: 1.091,
 *   type: "buy",
 *   openTime: 1716883200000,
 *   openPrice: 1.085,
 *   commission: 0,
 *   swap: 0,
 *   pnl: 12.5,
 *   status: "open",
 * };
 * ```
 */
export type OpenTrade = BaseTrade & {
	/** Open-trade status discriminator.
	 *
	 * @example `"open"`
	 */
	status: "open";
};

/**
 * Closed trade record that includes exit information.
 *
 * @example
 * ```ts
 * const trade: ClosedTrade = {
 *   ticket: 101245,
 *   symbol: "EURUSD",
 *   volume: 0.5,
 *   sl: 1.0835,
 *   tp: 1.091,
 *   type: "buy",
 *   openTime: 1716883200000,
 *   openPrice: 1.085,
 *   closeTime: 1716886800000,
 *   closePrice: 1.0905,
 *   commission: 0,
 *   swap: 0,
 *   pnl: 27.5,
 *   status: "closed",
 * };
 * ```
 */
export type ClosedTrade = BaseTrade & {
	/** Trade exit price.
	 *
	 * @example `1.0905`
	 */
	closePrice: number;
	/** Trade exit time in milliseconds UTC.
	 *
	 * @example `1716886800000`
	 */
	closeTime: number;
	/** Closed-trade status discriminator.
	 *
	 * @example `"closed"`
	 */
	status: "closed";
};
