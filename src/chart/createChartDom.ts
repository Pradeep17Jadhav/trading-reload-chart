export type ChartDomElements = {
	root: HTMLDivElement;
	layout: HTMLDivElement;
	stack: HTMLDivElement;
	volumeCanvas: HTMLCanvasElement;
	candleCanvas: HTMLCanvasElement;
	shapesCanvas: HTMLCanvasElement;
	tradesCanvas: HTMLCanvasElement;
	overlayCanvas: HTMLCanvasElement;
	axisXCanvas: HTMLCanvasElement;
	axisYCanvas: HTMLCanvasElement;
	interactionTarget: HTMLDivElement;
};

const createCanvas = (className: string) => {
	const canvas = document.createElement("canvas");
	canvas.className = className;
	return canvas;
};

export const createChartDom = (container: HTMLElement, backgroundColor: string): ChartDomElements => {
	const root = document.createElement("div");
	root.className = "trading-reload-chart";
	root.style.backgroundColor = backgroundColor;
	root.tabIndex = 0;

	const layout = document.createElement("div");
	layout.className = "trading-reload-chart__layout";

	const stack = document.createElement("div");
	stack.className = "trading-reload-chart__stack";

	const volumeCanvas = createCanvas("trading-reload-chart__volume");
	const candleCanvas = createCanvas("trading-reload-chart__plot");
	const shapesCanvas = createCanvas("trading-reload-chart__shapes");
	const tradesCanvas = createCanvas("trading-reload-chart__trades");
	const overlayCanvas = createCanvas("trading-reload-chart__overlay");
	const axisXCanvas = createCanvas("trading-reload-chart__axis-x");

	stack.append(volumeCanvas, candleCanvas, shapesCanvas, tradesCanvas, overlayCanvas, axisXCanvas);

	const axisYCanvas = createCanvas("trading-reload-chart__axis-y");

	layout.append(stack, axisYCanvas);
	root.append(layout);
	container.append(root);

	return {
		root,
		layout,
		stack,
		volumeCanvas,
		candleCanvas,
		shapesCanvas,
		tradesCanvas,
		overlayCanvas,
		axisXCanvas,
		axisYCanvas,
		interactionTarget: layout,
	};
};
