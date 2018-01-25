import { scalePoint } from "d3-scale";

export default ({
	dimName
}, innerWidth, padding = 0) => {
	return scalePoint()
		.domain(dimName)
		.range([0, innerWidth])
		.padding(padding);
};