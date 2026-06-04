import { COLORS } from "../../../config/colors";

/**
 * Fixed visual constants for shape drag handles.
 * These are chart-internal rendering properties and are not user-configurable.
 */
export const SHAPE_HANDLE_CONFIG = {
	handleColor: COLORS.background,
	handleBorderColor: COLORS.blue,
	handleBorderThickness: 1.5,
	handleRadius: 5,
} as const;
