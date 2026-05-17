import type { ShapeBoundingBox, ShapePoint } from "./ShapesLayer.types";

export type PositionGeometry = {
	entryPoint: ShapePoint;
	endX: number;
	entryY: number;
	box: ShapeBoundingBox;
	profitBox: ShapeBoundingBox;
	lossBox: ShapeBoundingBox;
	upperPrice: number;
	lowerPrice: number;
};
