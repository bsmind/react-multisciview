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
            shared: {origDataExtents, ratio}
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

        const dataKeys = Object.keys(dataExtents);
        let updateHitTest = false;
        nest.forEach(group => {
            const {key: markerKey, values} = group;
            values.forEach(d => {
                const x = xAccessor(d);
                const y = yAccessor(d);

                if (x == null || y == null)
                    return;

                let inDomain = dataKeys.map(key => {
                    const extents = dataExtents[key];

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
                if (this.__pixelData && d.colorID) {
                    updateHitTest = true;
                    const colorID = d.colorID;
                    const rgbDigits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(colorID);
                    const R = parseInt(rgbDigits[2]);
                    const G = parseInt(rgbDigits[3]);
                    const B = parseInt(rgbDigits[4]);
                    const px = Math.floor( (x) * ratio );
                    const py = Math.floor( (y) * ratio );
    
                    for (let ppx=px-2; ppx<=px+2; ++ppx) {
                        for (let ppy=py-2; ppy<=py+2; ++ppy) {
                            const pIndex = 4*(this.__canvasWidth*ppy + ppx);
                            this.__pixelData[pIndex] = R;
                            this.__pixelData[pIndex+1] = G;
                            this.__pixelData[pIndex+2] = B;
                            this.__pixelData[pIndex+3] = 255;        
                        }
                    }                        
                }
            });
        });
        return updateHitTest;
    }

    draw = (ctx, moreProps) => {
        const { hitTest } = moreProps;
        const { width, height, ratio, margin } = this.props.shared;
        const hitCanvas = (hitTest.canvas) ? hitTest.canvas : null;
        const hitCtx = (hitTest.ctx) ? hitTest.ctx : null;

        this.__pixelData = null; 
        this.__pixel = null;
        this.__canvasWidth = 0;
        if (hitCanvas && hitCtx) {
            const canvasWidth = Math.floor( width*ratio );
            const canvasHeight = Math.floor( height*ratio );

            hitCtx.save();
            hitCtx.setTransform(1, 0, 0, 1, 0, 0);
            hitCtx.scale(ratio, ratio);
            hitCtx.translate(margin.left, margin.top);
            this.__pixel = hitCtx.getImageData(0, 0, canvasWidth, canvasHeight);
            this.__pixelData = this.__pixel.data;            
            this.__canvasWidth = canvasWidth;
        }

        const update = this.drawMarkersWithProvider(ctx, moreProps);

        if (hitCanvas && hitCtx && this.__pixelData && this.__pixel && update) {
            hitCtx.putImageData(this.__pixel, margin.left * ratio, margin.top * ratio);            
            this.__pixelData = null;  
            this.__pixel = null;          
            this.__canvasWidth = 0;
            hitCtx.restore();

            // ctx.save();
            // ctx.setTransform(1,0,0,1,0,0);
            //hitCtx.drawImage(hitCanvas, 0, 0);
            // ctx.drawImage(hitCanvas, 0, 0);
            // ctx.restore();
        }
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
