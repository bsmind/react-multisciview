export default ({ width, height, margin }) => {
	return {
		width: width - margin.left - margin.right,
		height: height - margin.top - margin.bottom
	};
};