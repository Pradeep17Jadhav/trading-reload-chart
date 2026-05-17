export type CanvasPoint = {
	x: number;
	y: number;
};

export const getCanvasPoint = (canvas: HTMLCanvasElement, event: PointerEvent | MouseEvent): CanvasPoint => {
	const rect = canvas.getBoundingClientRect();
	const scaleX = canvas.width / rect.width;
	const scaleY = canvas.height / rect.height;

	return {
		x: (event.clientX - rect.left) * scaleX,
		y: (event.clientY - rect.top) * scaleY,
	};
};
