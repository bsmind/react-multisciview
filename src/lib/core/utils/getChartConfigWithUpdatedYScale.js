import { extent } from "d3-array";
import { set } from "d3-collection";
import flattenDeep from "lodash.flattendeep";
import { isArrayOfString, isArraySize2AndNumber } from '../../utils';

export default function(
	chartConfig,
	plotData,
    update = false,
	dy = null,
	chartsToPan = null
) {
	const yDomains = chartConfig.map(config => {
		const {yExtents, yScale, yStepEnabled} = config;

		const realYDomain = isArrayOfString(yExtents) 
				? [0, yExtents.length]
				: isArraySize2AndNumber(yExtents)
					? yExtents
					: yDomainFromYExtents(yExtents, yScale, plotData);

		const prevYDomain = yScale.domain();

		if (yStepEnabled) {
			realYDomain[0] = Math.floor(realYDomain[0]);
			realYDomain[1] = Math.ceil(realYDomain[1]);
		}
		
        const yDomainPan = dy != null
            ? yScale.range().map(each => each - dy).map(yScale.invert)
            : prevYDomain;

		return { 
			realYDomain, 
			yDomainPan,
			prevYDomain
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
			yStepEnabled,
			yExtents,
			yDomainUpdate
		} = config;

		const { realYDomain, yDomainPan, prevYDomain } = yDomains[index];

		let domain;
		//console.log('update: ', update, 'yDomainUpdate: ', yDomainUpdate)
		if (chartsToPan != null && chartsToPan.indexOf(id) > -1) {
			//console.log('use paned domain')
			domain = yDomainPan;
		} else if (update && yDomainUpdate){
			//console.log('use full domain')
			domain = realYDomain; 
		}
		else {
			//console.log('use prev domain')
			domain = prevYDomain;
		}

		if (yStepEnabled) {
			domain[0] = Math.max(domain[0], 0);
			domain[1] = Math.min(domain[1], yExtents.length);
		}
		//console.log(domain)

		const newYScale = setRange(
			yScale.copy().domain(domain),
			height,
			yPadding,
			yFlip
		);

		const yStep = Math.abs(newYScale(0) - newYScale(1));

		return {
			...config,
			yScale: newYScale,
			yDomain: domain,
			yStep,
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
