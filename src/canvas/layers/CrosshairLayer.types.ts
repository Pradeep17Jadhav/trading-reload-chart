export type CrosshairStyle = "solid" | "dashed" | "dotted";

export type CrosshairLayerOptions = {
	canvas: HTMLCanvasElement;
	crosshairColor?: string;
	crosshairThickness?: number;
	crosshairStyle?: CrosshairStyle;
};

export type UpdateMousePositionOptions = {
	snapX?: number;
};
