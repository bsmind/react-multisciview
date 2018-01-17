import React from "react";
import PropTypes from "prop-types";

//import { SubscriberExtend } from "../core";
import { SubscriberExt } from '../core';
import { functor, hexToRGBA } from "../utils";

import { nest as d3Nest } from "d3-collection";

import { clearCanvas } from '../core/utils';

class ScatterSeries extends React.Component {

    drawMarkersWithProvider = (ctx, moreProps) => {
    	const { 
            markerProvider 
        } = this.props;

        const {
            xAttr,
            yAttr,
            plotData,
            dataExtents
        } = moreProps;

        const {
            name: xName,
            scale: xScale,
            step: xStep,
            ordinary: xOrdinary,
            extents: xExtents
        } = xAttr;

        const {
            name: yName,
            scale: yScale,
            step: yStep,
            ordinary: yOrdinary,
            extents: yExtents
        } = yAttr;
        
        const nest = d3Nest()
            .key(d => d.markerID)
            .entries(plotData);

        const xAccessor = d => {
            return !xOrdinary 
                ? xScale(d[xName])
                : xScale(xExtents.indexOf(d[xName])) - xStep/2
        };

        const yAccessor = d => {
            return !yOrdinary 
                ? yScale(d[yName])
                : yScale(yExtents.indexOf(d[yName])) - yStep/2
        };

        const dataKeys = Object.keys(dataExtents);
        
        nest.forEach(group => {
            const {key: markerKey, values} = group;
            values.forEach(d => {
                const x = xAccessor(d);
                const y = yAccessor(d);

                if (x == null || y == null)
                    return;

                const inDomain = dataKeys.map(key => {
                    if (key === xName || key === yName) return true;
                    const extents = dataExtents[key];
                    const value = d[key];

                    if (value == null) return true;
                    if (typeof value === 'string') 
                        return extents.indexOf(value) >= 0;

                    return extents[0] <= value && value <= extents[1];
                }).every(each => each);
                if (!inDomain) return;

                markerProvider.drawAt(ctx, x, y, markerKey);
            });
        });
    }

    draw = (ctx, moreProps) => {
        this.drawMarkersWithProvider(ctx, moreProps);
    }

    render() {
    	return <SubscriberExt
    		canvas={contexts => contexts.chartOn}
    		clip={true}
    		edgeClip={false}
    		draw={this.draw}
    		drawOn={["pan"]}
    		shared={this.props.shared}
    	/>;
    }
}

ScatterSeries.propTypes = {
	className: PropTypes.string,
	yAccessor: PropTypes.func,
	marker: PropTypes.func,
	markerProvider: PropTypes.func,
	markerProps: PropTypes.shape({
        r: PropTypes.oneOfType([
            PropTypes.number,
            PropTypes.func
        ]),
        stroke: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.func
        ]),
        fill: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.func
        ]),
        opacity: PropTypes.oneOfType([
            PropTypes.number,
            PropTypes.func
        ]),
        strokeWidth: PropTypes.oneOfType([
            PropTypes.number,
            PropTypes.func
        ]),
    }),
    drawOrder: PropTypes.array,
    orderAccessor: PropTypes.func,
};

ScatterSeries.defaultProps = {
	className: ""
};


export default ScatterSeries;
