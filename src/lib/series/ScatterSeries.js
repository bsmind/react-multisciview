import React from "react";
import PropTypes from "prop-types";

//import { SubscriberExtend } from "../core";
import { SubscriberExt } from '../core';
import { functor, hexToRGBA, isArrayOfString } from "../utils";

import { nest as d3Nest } from "d3-collection";

import { clearCanvas } from '../core/utils';

class ScatterSeries extends React.Component {

    drawMarkersWithProvider = (ctx, moreProps) => {
    	const { 
            markerProvider, 
            shared: {origDataExtents}
        } = this.props;

        const {
            xAttr,
            yAttr,
            zAttr,
            plotData,
            dataExtents
        } = moreProps;

        const {
            name: xName,
            scale: xScale,
            step: xStep,
            ordinary: xOrdinary,
            //extents: xExtents
            origExtents: xExtents
        } = xAttr;

        const {
            name: yName,
            scale: yScale,
            step: yStep,
            ordinary: yOrdinary,
            //extents: yExtents,
            origExtents: yExtents
        } = yAttr;

        const {
            name: zName,
            selectDomain: zSelectDomain,
            extents: zExtents
        } = zAttr;
        
        const nest = d3Nest()
            .key(d => d.markerID)
            .entries(plotData);

        const xAccessor = d => {
            return !xOrdinary 
                ? xScale(d[xName])
                : xScale(xExtents.length - xExtents.indexOf(d[xName]) - 1) + xStep/2
        };

        const yAccessor = d => {
            return !yOrdinary 
                ? yScale(d[yName])
                : yScale(yExtents.length - yExtents.indexOf(d[yName]) - 1) - yStep/2
        };

        //const accessor = (d, key)

        const dataKeys = Object.keys(dataExtents);
        //const { dataExtents } = this.props.shared;
        //console.log(origDataExtents)
        
        nest.forEach(group => {
            const {key: markerKey, values} = group;
            values.forEach(d => {
                const x = xAccessor(d);
                const y = yAccessor(d);

                if (x == null || y == null)
                    return;

                let inDomain = dataKeys.map(key => {
                    //if (key === xName || key === yName) return true;
                    const extents = dataExtents[key];
                    //if (extents == null) return true;

                    let value = d[key];
                    if (value == null) return true;
                    if (typeof value === 'string') {
                        const tempExtents = origDataExtents[key];
                        value = tempExtents.length - tempExtents.indexOf(value) - 1 + 0.5;
                    }

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
