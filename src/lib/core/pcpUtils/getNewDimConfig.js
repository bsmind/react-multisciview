import {
	isArrayOfString
} from "../../utils";

import { scaleLinear } from "d3-scale";

export default (
	{
		// dimName: dimNameProp,
		dimExtents,
		dimAccessor,
		axisWidth
	},
	xScale,
	innerHeight,
	nullPositionY,
	initialDimConfig = {}
) => {
	const newDimConfig = {};
	const dimName = Object.keys(dimExtents);
	dimName.forEach(name => {
		const axisExtents = dimAccessor(dimExtents, name) == null
			? [0, 1]
			: dimAccessor(dimExtents, name);

		const ordinary = isArrayOfString(axisExtents);
		const yDomain = ordinary ? [0, axisExtents.length] : axisExtents.slice(); // eslint-disable-line
		if (!ordinary && yDomain[0] === yDomain[1]) {
			const domainValue = Math.abs(yDomain[0]);
			yDomain[0] = domainValue === 0 ? -1 : -2 * domainValue; // eslint-disable-line
			yDomain[1] = domainValue === 0 ?  1 :  2 * domainValue; // eslint-disable-line
		}

		const yScale = scaleLinear()
			.domain(yDomain)
			.range([innerHeight, 0]);

		const yStep = ordinary ? Math.abs(yScale(0) - yScale(1)) : 0;

		const prevConfig = initialDimConfig[name] ? initialDimConfig[name] : {};

		newDimConfig[name] = { // eslint-disable-line
			// user selected (sub-) extents
			select: null,

			...prevConfig,

			// title of this axis
			title: name,

			// extents of this axis
			// - ordinary: array of (unique) string
			// - number: [min, max]
			extents: axisExtents,

			// indicator for ordinary axis
			ordinary,

			// linear scale
			scale: yScale,

			// step size between ticks for ordinary
			step: yStep,

			// axis x-position
			position: xScale(name),

			// axis width
			axisWidth,

			// data accessor
			accessor: d => d[name],

			// y-position for null (or undefined) data value
			nullPositionY,

			// (unused), is active axis?
			active: true,

			// (unused), flip the axis
			flip: false,
		};
	});
	return newDimConfig;
};