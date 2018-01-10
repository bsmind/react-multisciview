import React from "react";
import Chart from "../Chart";
import { functor, isArrayOfString, isArraySize2AndNumber } from "../../utils";

export default function(
	innerDimension,
	children,
	existingChartConfig = []
) {
	return React.Children.map(children, child => {
		if (!React.isValidElement(child)) return undefined;
		if (child.type !== Chart) return undefined;

		const chartProps = {
			...Chart.defaultProps,
			...child.props
		};

		const {
			id,
			origin,
			yExtents: yExtentsProp,
			yScale: yScaleProp,
			yFlip,
			yPadding,
			yPan,
			yAttr
		} = chartProps;

		const yScale = yScaleProp.copy();

		const {
			width,
			height,
			availableHeight
		} = getDimensions(innerDimension, chartProps);

		let yStepEnabled = false;
		const yExtents = isArrayOfString(yExtentsProp)
			? (yStepEnabled = true, yExtentsProp)
			: (Array.isArray(yExtentsProp) ? yExtentsProp: [yExtentsProp]).map(functor); 

		const prevConfig = existingChartConfig.find(d => d.id === id);
		let yDomainUpdate = true;
		if (prevConfig && prevConfig.yAttr === yAttr) {
			yScale.domain(prevConfig.yScale.domain());
			yDomainUpdate = false;
		}
			
		return {
			id,
			origin,
			width,
			height,
			availableHeight,
			origYExtents: yExtentsProp,
			yExtents,
			yFlip,
			yScale,
			yPan,
			yPadding,
			yStepEnabled,
			yAttr,
			yDomainUpdate
		};
	}).filter(c => c != undefined);
}

function getDimensions( { width, height }, chartProps) {
	const chartHeight = (chartProps.height || height);
	return {
		availableHeight: height,
		width,
		height: chartHeight
	};
}


		// let yStepEnabled = false;
		// if (isArraySize2AndNumber(yExtentsProp)) {
		// 	if (prevConfig
        //         && prevConfig.yPan
        //         && yPan
        //         && prevConfig.origYExtents[0] === yExtentsProp[0]
        //         && prevConfig.origYExtents[1] === yExtentsProp[1]
		// 	) {
		// 		yScale.domain(prevConfig.yScale.domain());
		// 	} else {
		// 		yScale.domain(yExtentsProp);
		// 	}
		// } else if (isArrayOfString(yExtentsProp)) {
		// 	if (prevConfig
        //         && prevConfig.yPan
        //         && prevConfig.yPanEnabled
        //         && yPan
		// 		&& yPanEnabled
		// 		&& prevConfig.origYExtents.length === yExtentsProp.length 
		// 		&& prevConfig.origYExtents.every((d,index) => d === yExtentsProp[index])
		// 	) {
		// 		yScale.domain(prevConfig.yScale.domain());
		// 	} else {
		// 		yScale.domain([0, yExtentsProp.length]);
		// 		//console.log('getChartConfig: ', yScale.domain());
		// 	}
		// 	yStepEnabled = true;
		// } else if (prevConfig && prevConfig.yPanEnabled) {
		// 	if (isArraySize2AndNumber(prevConfig.origYExtents)) {
		// 		// do nothing
		// 	} else {
		// 		yScale.domain(prevConfig.yScale.domain())
		// 		yPanEnabled = true;
		// 	}
		// 	//console.log("check2");
		// }
