export default (
	xScale,
	width,
	pad,
	direction = 1
) => {
	if (direction > 0) {
		xScale.range([pad, width - pad]);
	} else {
		xScale.range([width - pad, pad]);
	}
	return xScale;
};