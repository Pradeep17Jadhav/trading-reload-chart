export const TRADE_LAYER_EVENT_TYPES_TO_HANDLE = ["pointerdown", "pointermove", "pointerup"] as const;

export type SupportedPointerEventType = (typeof TRADE_LAYER_EVENT_TYPES_TO_HANDLE)[number];

export type CanvasMousePoint = {
	x: number;
	y: number;
};

export type HitboxArea = {
	x: number;
	y: number;
	width: number;
	height: number;
};
