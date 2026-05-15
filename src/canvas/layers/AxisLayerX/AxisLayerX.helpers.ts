export const formatTimeHHMM = (timestamp: number) => {
	const date = new Date(timestamp);
	const hours = date.getHours().toString().padStart(2, "0");
	const minutes = date.getMinutes().toString().padStart(2, "0");

	return `${hours}:${minutes}`;
};

export const getXAxisLabelInterval = ({
	candleSpacing,
	labelWidth,
	minLabelGap,
}: {
	candleSpacing: number;
	labelWidth: number;
	minLabelGap: number;
}) => {
	if (candleSpacing <= 0) {
		return 1;
	}

	return Math.max(1, Math.ceil((labelWidth + minLabelGap) / candleSpacing));
};
