import React from "react";
import Chart from "../Chart";

import { functor } from "../../utils";

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
			yAccessor,
			yExtents: yExtentsProp,
			yScale: yScaleProp,
			yFlip,
			yPadding,
			yPan
		} = chartProps;
		let { yPanEnabled } = chartProps;

		const yScale = yScaleProp.copy();

		const {
			width,
			height,
			availableHeight
		} = getDimensions(innerDimension, chartProps);

		// const yExtent = typeof yExtentProp === 'function'
		//     ? undefined
		//     : yExtentProp;

		const yExtents = yExtentsProp
			? (Array.isArray(yExtentsProp) ? yExtentsProp : [yExtentsProp]).map(functor)
			: undefined;

		const prevConfig = existingChartConfig.find(d => d.id === id);

		if (isArraySize2AndNumber(yExtentsProp)) {
			console.log("check1");
			if (prevConfig
                && prevConfig.yPan
                && prevConfig.yPanEnabled
                && yPan
                && yPanEnabled
                // && prevConfig.origYExtent == yExtentProp
                && prevConfig.origYExtents[0] === yExtentsProp[0]
                && prevConfig.origYExtents[1] === yExtentsProp[1]
			) {
				yScale.domain(prevConfig.yScale.domain());
			} else {
				yScale.domain(yExtentsProp);
			}
		} else if (prevConfig && prevConfig.yPanEnabled) {
			console.log("check2");
		}

        yPanEnabled = true;

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
			yPanEnabled,
			yPadding
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

function isArraySize2AndNumber(yExtentsProp) {
	if (Array.isArray(yExtentsProp) && yExtentsProp.length === 2) {
		const [a, b] = yExtentsProp;
		return (typeof a == "number" && typeof b == "number");
	}
	return false;
}
