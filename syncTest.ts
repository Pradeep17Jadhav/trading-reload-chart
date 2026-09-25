import { ExistingCandlesLayer } from "./src/canvas/layers/ExistingCandlesLayer";
import { CHART_CONFIG } from "./src/config/chartConfig";
import type { Candle } from "./src/models/Candle.types";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const WIDTH = 800;
const HEIGHT = 600;

const failures: string[] = [];

const check = (name: string, condition: boolean, detail = "") => {
	console.log(`  ${condition ? "PASS" : "FAIL"}  ${name}${condition ? "" : `  ->  ${detail}`}`);
	if (!condition) {
		failures.push(name);
	}
};

const near = (a: number, b: number, tolerance: number) => Math.abs(a - b) <= tolerance;

const anchorIsReal = (target: ExistingCandlesLayer, time: number) =>
	target.candles.some((candle) => candle.time === time);

const makeCanvas = (width: number, height: number) => {
	const ctx = {
		clearRect: () => {},
		beginPath: () => {},
		moveTo: () => {},
		lineTo: () => {},
		stroke: () => {},
		fillRect: () => {},
		save: () => {},
		restore: () => {},
		setLineDash: () => {},
		strokeStyle: "",
		fillStyle: "",
		lineWidth: 0,
		globalAlpha: 0,
	} as unknown as CanvasRenderingContext2D;

	return { width, height, getContext: () => ctx } as unknown as HTMLCanvasElement;
};

const makeCandles = (count: number, timeframeMs: number, startTime: number): Candle[] =>
	Array.from({ length: count }, (_, index) => ({
		time: startTime + index * timeframeMs,
		open: 1.08 + index * 0.0001,
		high: 1.08 + index * 0.0002,
		low: 1.08 + index * 0.00005,
		close: 1.08 + index * 0.00015,
		volume: 100 + index,
		ask: 1.08 + index * 0.00015,
		isClosed: true,
	}));

const layer = (candles: Candle[], width = WIDTH, height = HEIGHT) =>
	new ExistingCandlesLayer({ canvas: makeCanvas(width, height), candles });

const BASE = Date.UTC(2026, 0, 5, 0, 0, 0);
/** Fewer candles than fit on screen, so the rightmost visible candle is NOT the last one. */
const PARTIAL = makeCandles(30, 15 * MINUTE, BASE);
/** Enough candles to overflow the plot so panning is not immediately clamped. */
const FULL = makeCandles(400, 15 * MINUTE, BASE);
const H1_PARTIAL = makeCandles(40, HOUR, BASE);

console.log("1. Reported view state is self-consistent");
{
	const m15 = layer(PARTIAL);
	const view = m15.getViewState();
	check("view exists", !!view);
	if (view) {
		check(
			"rightmostVisibleTime maps to a real candle",
			anchorIsReal(m15, view.rightmostVisibleTime),
			`t=${view.rightmostVisibleTime}`,
		);
		check(
			"rightmostVisibleX within [0,1]",
			view.rightmostVisibleX >= 0 && view.rightmostVisibleX <= 1,
			`x=${view.rightmostVisibleX}`,
		);
		check("visibleDurationMs positive", view.visibleDurationMs > 0, `d=${view.visibleDurationMs}`);
		check(
			"visibleDurationMs equals width * timeframe / spacing",
			near(view.visibleDurationMs, (WIDTH * 15 * MINUTE) / m15.candleSpacing, 0.001),
			`d=${view.visibleDurationMs}`,
		);
		check(
			"visibleDurationMs is a real time span (not pixels)",
			view.visibleDurationMs > 15 * MINUTE,
			`d=${view.visibleDurationMs}`,
		);
		const expectedEdge = view.rightmostVisibleTime + view.visibleDurationMs * (1 - view.rightmostVisibleX);
		check(
			"rightEdgeTime tracks the anchor proportionally",
			near(view.rightEdgeTime, expectedEdge, 15 * MINUTE),
			`edge=${view.rightEdgeTime} expected~${expectedEdge}`,
		);
	}
}

console.log("2. Cross-timeframe sync aligns the same time window");
{
	const m15 = layer(makeCandles(800, 15 * MINUTE, BASE));
	const h1 = layer(makeCandles(800, HOUR, BASE));
	const source = m15.getViewState();
	check("source view exists", !!source);
	if (source) {
		h1.setViewState(source);
		const target = h1.getViewState();
		check("target view exists", !!target);
		if (target) {
			/**
			 * The synced contract is the visible *window*, not the identity of the
			 * candle sitting at the right edge. The two series cover different
			 * absolute spans (200h vs 800h here), so the last candle in view is a
			 * different point in each dataset even when the window matches.
			 */
			check(
				"visible duration preserved",
				near(target.visibleDurationMs, source.visibleDurationMs, source.visibleDurationMs * 0.001),
				`src=${source.visibleDurationMs} tgt=${target.visibleDurationMs}`,
			);
			check(
				"right edge time preserved within one candle",
				near(target.rightEdgeTime, source.rightEdgeTime, HOUR),
				`src=${source.rightEdgeTime} tgt=${target.rightEdgeTime}`,
			);

			const sourceWindowStart = source.rightEdgeTime - source.visibleDurationMs;
			const targetWindowStart = target.rightEdgeTime - target.visibleDurationMs;
			check(
				"window start time preserved",
				near(targetWindowStart, sourceWindowStart, HOUR),
				`src=${sourceWindowStart} tgt=${targetWindowStart}`,
			);

			check(
				"anchor time maps to a real candle on target",
				anchorIsReal(h1, target.rightmostVisibleTime),
				`t=${target.rightmostVisibleTime}`,
			);
			check(
				"anchor X is reported from the target's own grid",
				near(
					target.rightmostVisibleX * WIDTH,
					h1.getCandleCenterX(h1.candles.findIndex((c) => c.time === target.rightmostVisibleTime)),
					0.001,
				),
				`reported=${target.rightmostVisibleX * WIDTH} computed=${h1.getCandleCenterX(h1.candles.findIndex((c) => c.time === target.rightmostVisibleTime))}`,
			);
			check(
				"anchor X stays within the plot",
				target.rightmostVisibleX >= 0 && target.rightmostVisibleX <= 1,
				`x=${target.rightmostVisibleX}`,
			);
		}
	}
}

console.log("3. Sync round-trips: apply, re-report, re-apply stays stable");
{
	const m15 = layer(FULL);
	const h1 = layer(H1_PARTIAL);
	const source = m15.getViewState();
	if (source) {
		h1.setViewState(source);
		const first = h1.getViewState();
		if (first) {
			h1.setViewState(first);
			const second = h1.getViewState();
			check(
				"re-applying reported view does not drift",
				!!second &&
					near(first.visibleDurationMs, second.visibleDurationMs, 0.001) &&
					near(first.rightmostVisibleX, second.rightmostVisibleX, 0.0001) &&
					near(first.rightmostVisibleTime, second.rightmostVisibleTime, 0.5),
				`first=${JSON.stringify(first)} second=${JSON.stringify(second)}`,
			);
		}
	}
}

console.log("4. Same-timeframe sync (identical data) is exact");
{
	const source = layer(PARTIAL);
	const target = layer(PARTIAL);
	const view = source.getViewState();
	if (view) {
		target.setViewState(view);
		const applied = target.getViewState();
		check(
			"identical data yields identical view",
			!!applied &&
				near(applied.rightmostVisibleX, view.rightmostVisibleX, 1e-9) &&
				near(applied.rightmostVisibleTime, view.rightmostVisibleTime, 0.5) &&
				near(applied.visibleDurationMs, view.visibleDurationMs, 0.001),
			`src=${JSON.stringify(view)} tgt=${JSON.stringify(applied)}`,
		);
	}
}

console.log("5. Guards: empty, degenerate, and out-of-range input");
{
	check("empty layer reports null view", layer([]).getViewState() === null);
	check("single-candle layer still reports a view", layer(makeCandles(1, 15 * MINUTE, BASE)).getViewState() !== null);
	check("zero-width canvas reports null view", layer(FULL, 0).getViewState() === null);

	const good = layer(PARTIAL).getViewState();
	if (good) {
		const zero = layer(PARTIAL);
		const before = zero.getViewState();
		zero.setViewState({ ...good, visibleDurationMs: 0 });
		const after = zero.getViewState();
		check(
			"zero duration rejected without mutation",
			!!before &&
				!!after &&
				near(before.rightmostVisibleX, after.rightmostVisibleX, 1e-12) &&
				before.visibleDurationMs === after.visibleDurationMs,
		);

		const nan = layer(PARTIAL);
		nan.setViewState({
			...good,
			rightmostVisibleTime: Number.NaN,
			rightEdgeTime: Number.NaN,
			visibleDurationMs: Number.NaN,
		});
		check("NaN view rejected without corrupting geometry", Number.isFinite(nan.zoomX) && Number.isFinite(nan.offsetX));
		check(
			"NaN view leaves view state finite",
			(() => {
				const v = nan.getViewState();
				return !!v && Number.isFinite(v.rightEdgeTime) && Number.isFinite(v.rightmostVisibleX);
			})(),
		);

		const far = layer(PARTIAL);
		far.setViewState({ ...good, rightmostVisibleTime: BASE + 5_000 * HOUR });
		const farView = far.getViewState();
		check(
			"far-future anchor is handled",
			!!farView && Number.isFinite(farView.rightEdgeTime) && Number.isFinite(farView.rightmostVisibleX),
			JSON.stringify(farView),
		);

		const negative = layer(PARTIAL);
		negative.setViewState({ ...good, rightmostVisibleTime: BASE - 5_000 * HOUR });
		const negView = negative.getViewState();
		check(
			"far-past anchor is handled",
			!!negView && Number.isFinite(negView.rightEdgeTime) && Number.isFinite(negView.rightmostVisibleX),
			JSON.stringify(negView),
		);
	}
}

console.log("6. Cursor snapping across timeframes");
{
	const m15 = layer(makeCandles(800, 15 * MINUTE, BASE));
	const h1 = layer(makeCandles(800, HOUR, BASE));
	const view = m15.getViewState();
	if (view) {
		/** Sync the target view first so the anchor candle is actually on screen. */
		h1.setViewState(view);
		const anchor = h1.getViewState();
		check("target has a synced view", !!anchor);
		if (anchor) {
			const point = h1.setCursorState({ time: anchor.rightmostVisibleTime, price: 1.085 });
			check("cursor snaps to a candle on the target chart", !!point);
			check("snapped candle is within the plot", !!point && point.x >= 0 && point.x <= WIDTH, `x=${point?.x}`);
			check(
				"snapped candle time is a real target candle",
				!!point && anchorIsReal(h1, point.candle.time),
				`t=${point?.candle.time}`,
			);
			check(
				"snapped candle matches the requested anchor",
				!!point && point.candle.time === anchor.rightmostVisibleTime,
				`got=${point?.candle.time} want=${anchor.rightmostVisibleTime}`,
			);
			check("cursor y is finite", !!point && Number.isFinite(point.y));
		}

		check("out-of-range cursor time is handled", !!h1.setCursorState({ time: BASE - 10 * HOUR, price: 1.085 }));
		check("NaN cursor time returns null", h1.setCursorState({ time: Number.NaN, price: 1.085 }) === null);
		check(
			"NaN cursor price returns null",
			h1.setCursorState({ time: view.rightmostVisibleTime, price: Number.NaN }) === null,
		);
	}
}

console.log("7. Pan and zoom move the reported anchor");
{
	const target = layer(FULL);
	const before = target.getViewState();
	/**
	 * At the default view the right edge sits past the last candle, so the
	 * reported anchor is pinned to it. Panning right brings the right edge back
	 * inside the data and the anchor starts tracking real candles again.
	 */
	target.panHorizontally(2000);
	const panned = target.getViewState();
	check(
		"pan past the right offset changes the anchor time",
		!!before && !!panned && before.rightmostVisibleTime !== panned.rightmostVisibleTime,
		`before=${before?.rightmostVisibleTime} after=${panned?.rightmostVisibleTime}`,
	);
	check(
		"pan moves the normalized anchor X",
		!!before && !!panned && Math.abs(before.rightmostVisibleX - panned.rightmostVisibleX) > 0.001,
		`before=${before?.rightmostVisibleX} after=${panned.rightmostVisibleX}`,
	);
	check(
		"pan keeps the visible duration",
		!!before && !!panned && near(before.visibleDurationMs, panned.visibleDurationMs, 0.001),
	);
	check("pan keeps the anchor mapped to a real candle", !!panned && anchorIsReal(target, panned.rightmostVisibleTime));

	/** Panning the viewport past the data clamps the reported anchor to an edge candle. */
	const pastEnd = layer(FULL);
	for (let i = 0; i < 60; i++) {
		pastEnd.panHorizontally(-10_000);
	}
	const clampedEnd = pastEnd.getViewState();
	check(
		"panning past the data end clamps to the last candle",
		!!clampedEnd && clampedEnd.rightmostVisibleTime === pastEnd.candles.at(-1)?.time,
		`t=${clampedEnd?.rightmostVisibleTime} last=${pastEnd.candles.at(-1)?.time}`,
	);

	const pastStart = layer(FULL);
	for (let i = 0; i < 60; i++) {
		pastStart.panHorizontally(10_000);
	}
	const clampedStart = pastStart.getViewState();
	check(
		"panning past the data start clamps to the first candle",
		!!clampedStart && clampedStart.rightmostVisibleTime === pastStart.candles[0]?.time,
		`t=${clampedStart?.rightmostVisibleTime} first=${pastStart.candles[0]?.time}`,
	);
	check(
		"clamped X is still finite",
		!!clampedStart && Number.isFinite(clampedStart.rightmostVisibleX) && Number.isFinite(clampedStart.rightEdgeTime),
		JSON.stringify(clampedStart),
	);

	const zoomTarget = layer(FULL);
	const preZoom = zoomTarget.getViewState();
	zoomTarget.zoomHorizontally(1);
	const zoomed = zoomTarget.getViewState();
	check(
		"zoom changes the visible duration",
		!!preZoom && !!zoomed && Math.abs(preZoom.visibleDurationMs - zoomed.visibleDurationMs) > 0.001,
		`pre=${preZoom?.visibleDurationMs} post=${zoomed?.visibleDurationMs}`,
	);
	check(
		"zoom in reduces the visible duration",
		!!preZoom && !!zoomed && zoomed.visibleDurationMs < preZoom.visibleDurationMs,
		`pre=${preZoom?.visibleDurationMs} post=${zoomed?.visibleDurationMs}`,
	);
	check(
		"zoom stays inside configured bounds",
		zoomTarget.zoomX >= CHART_CONFIG.zoom.x.min && zoomTarget.zoomX <= CHART_CONFIG.zoom.x.max,
		`zoom=${zoomTarget.zoomX}`,
	);
	check("zoom keeps the anchor on a real candle", !!zoomed && anchorIsReal(zoomTarget, zoomed.rightmostVisibleTime));
}

console.log("8. Zoom clamping does not break the reported view");
{
	const target = layer(FULL);
	for (let i = 0; i < 60; i++) {
		target.zoomHorizontally(1);
	}
	const maxed = target.getViewState();
	check(
		"max zoom still reports a finite view",
		!!maxed &&
			Number.isFinite(maxed.rightEdgeTime) &&
			Number.isFinite(maxed.rightmostVisibleX) &&
			maxed.visibleDurationMs > 0,
		JSON.stringify(maxed),
	);

	for (let i = 0; i < 120; i++) {
		target.zoomHorizontally(-1);
	}
	const mined = target.getViewState();
	check(
		"min zoom still reports a finite view",
		!!mined &&
			Number.isFinite(mined.rightEdgeTime) &&
			Number.isFinite(mined.rightmostVisibleX) &&
			mined.visibleDurationMs > 0,
		JSON.stringify(mined),
	);
}

console.log("9. Cursor time resolves on a differently-timed chart");
{
	/**
	 * Regression: a 15m timestamp arriving at an 1h chart used to be divided by
	 * the 1h timeframe and clamped, pinning the crosshair to the last candle.
	 * Every intermediate timestamp must now land on the 1h candle covering it.
	 */
	const h1 = layer(makeCandles(400, HOUR, BASE));
	const m15Times = makeCandles(400, 15 * MINUTE, BASE);

	const midTimes = [
		m15Times[100]?.time ?? 0,
		m15Times[250]?.time ?? 0,
		m15Times[399]?.time ?? 0,
		/** Exact 1h open, so a timestamp on the boundary must not slip a candle. */
		m15Times[4 * 60]?.time ?? 0,
	];

	midTimes.forEach((time, position) => {
		const point = h1.setCursorState({ time, price: 1.085 });
		const candle = point?.candle;
		const expectedIndex = Math.floor((time - BASE) / HOUR);
		const label = `synced cursor ${position + 1}/${midTimes.length}`;

		check(
			`${label} snaps to the covering 1h candle`,
			!!point && candle?.time === BASE + expectedIndex * HOUR,
			`sent=${time} got=${candle?.time} want=${BASE + expectedIndex * HOUR}`,
		);
		check(
			`${label} is not pinned to the last candle`,
			!!point && point.candleIndex < h1.candles.length - 1,
			`index=${point?.candleIndex} last=${h1.candles.length - 1}`,
		);
	});

	/** A second 15m chart receiving its own timeframe must be unchanged. */
	const m15 = layer(makeCandles(400, 15 * MINUTE, BASE));
	const exact = m15.setCursorState({ time: m15Times[200]?.time ?? 0, price: 1.085 });
	check(
		"same-timeframe cursor still snaps to the exact candle",
		!!exact && exact.candleIndex === 200,
		`index=${exact?.candleIndex}`,
	);

	/** The returned time must round-trip, which the crosshair axis label relies on. */
	check(
		"snapped time round-trips to the same candle",
		!!exact && m15.setCursorState({ time: exact.candle.time, price: 1.085 })?.candleIndex === 200,
	);
}

console.log(
	`\n${failures.length === 0 ? "ALL CHECKS PASSED" : `${failures.length} CHECK(S) FAILED: ${failures.join(", ")}`}`,
);
