import { CHART_CONFIG } from "../../config/chartConfig";
import type { ChartConfig } from "../../config/chartConfig.types";
import type { DeepPartial } from "./deepPartial";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const mergeDeep = <T extends Record<string, unknown>>(target: T, source: DeepPartial<T>): T => {
	const result = { ...target };

	for (const key of Object.keys(source) as (keyof T)[]) {
		const sourceValue = source[key];
		const targetValue = target[key];

		if (sourceValue === undefined) {
			continue;
		}

		if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
			result[key] = mergeDeep(
				targetValue as Record<string, unknown>,
				sourceValue as DeepPartial<Record<string, unknown>>,
			) as T[keyof T];
			continue;
		}

		result[key] = sourceValue as T[keyof T];
	}

	return result;
};

export const mergeChartConfig = (partial?: DeepPartial<ChartConfig>): ChartConfig =>
	mergeDeep(CHART_CONFIG, partial ?? {});
