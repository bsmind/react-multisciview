import { extent } from "d3-array";
import { set } from "d3-collection";
import flattenDeep from "lodash.flattendeep";

export default function(
	chartConfig,
	{
		plotData,
		xAccessor,
		xDispAccessor,
		fullData
	},
    xDomain,
    update = false,
	dy = null,
	chartsToPan = null
) {
	const yDomains = chartConfig.map(config => {
		const { yExtentsCalculator, yExtents, yScale } = config;

		const realYDomain = yExtentsCalculator
			? yExtentsCalculator({ plotData, xDomain, xAccessor, xDispAccessor, fullData })
			: update ? yDomainFromYExtents(yExtents, yScale, plotData) : yScale.domain();

        const yDomainPan = dy != null
            ? yScale.range().map(each => each - dy).map(yScale.invert)
            : realYDomain;

        //console.log('update', update, realYDomain, yDomainPan)

		return {
            realYDomain,
            yDomainPan,
			prevYDomain: yScale.domain()
		};
	});

	return chartConfig.map( (config, index) => {
		const {
			id,
			yPadding,
			height,
			yScale,
			yPan,
			yFlip,
			yPanEnabled = false
		} = config;

		const { realYDomain, yDomainPan, prevYDomain } = yDomains[index];

		// chartsToPan ??
		const another = chartsToPan != null
			? chartsToPan.indexOf(id) > -1
			: true;

		const domain = yPan && yPanEnabled
			? another ? yDomainPan: prevYDomain
            : realYDomain;

        //console.log(yPan, yPanEnabled)
        //console.log(another, chartsToPan, domain)

		const newYScale = setRange(
			yScale.copy().domain(domain),
			height,
			yPadding,
			yFlip
		);

		return {
			...config,
			yScale: newYScale,
			yDomain: domain
		};
	});
}

function setRange(
	scale,
	height,
	padding,
	flip
) {
	const { top, bottom } = isNaN(padding)
		? padding
		: { top: padding, bottom: padding };

	const range = flip
		? [top, height - bottom]
		: [height - bottom, top];

	scale.range(range);
	return scale;
}

function yDomainFromYExtents(yExtents, yScale, plotData) {
	const yValues = yExtents.map(eachExtent => {
		return plotData.map(d => {
			const value = eachExtent(d);
			return value;
		});
	});

	const allYValues = flattenDeep(yValues);
	return yScale.invert ? extent(allYValues) : set(allYValues).values();
}

// function values(func) {
//     return (d) => {
//         const obj = func(d);
//         if (isObject(obj)) {
//             return mapObject(obj);
//         }
//         return obj;
//     };
// }
