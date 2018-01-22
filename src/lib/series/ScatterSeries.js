import React from "react";
import PropTypes from "prop-types";

import { SubscriberExt } from '../core';
import { functor, hexToRGBA, isArrayOfString } from "../utils";

import { nest as d3Nest } from "d3-collection";

import { clearCanvas } from '../core/utils';
import { mousePosition } from '../utils';
import ImgViewer from './ImgViewer';

class ScatterSeries extends React.Component {
    constructor() {
        super();
        this.minDist = {x: null, y: null};
    }

    drawMarkersWithProvider = (ctx, moreProps) => {
    	const { markerProvider, shared: {origDataExtents, ratio} } = this.props;
        const { plotData, dataExtents } = moreProps;
        const { name: xName, scale: xScale, step: xStep, ordinary: xOrdinary, origExtents: xExtents} = moreProps.xAttr;
        const { name: yName, scale: yScale, step: yStep, ordinary: yOrdinary, origExtents: yExtents } = moreProps.yAttr;
        const { name: zName, selectDomain: zSelectDomain, extents: zExtents } = moreProps.zAttr;
        
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

        const xRange = xScale.range();
        const yRange = yScale.range();
        const inRange = (v, minv, maxv) => minv < v && v < maxv;

        const dataKeys = Object.keys(dataExtents);
        let minDistX, minDistY, pointSet = [];
        nest.forEach(group => {
            const {key: markerKey, values} = group;
            values.forEach(d => {
                let x = xAccessor(d);
                let y = yAccessor(d);

                // filter null values
                if (x == null || y == null)
                    return;

                // callback for data filter
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

                // callback for drawing
                markerProvider.drawAt(ctx, x, y, markerKey);

                // callback for hit test
                if (this.__pixelData && d.colorID) {
                    const colorID = d.colorID;
                    const rgbDigits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(colorID);
                    const R = parseInt(rgbDigits[2]);
                    const G = parseInt(rgbDigits[3]);
                    const B = parseInt(rgbDigits[4]);
                    const px = Math.floor( (x) * ratio );
                    const py = Math.floor( (y) * ratio );
    
                    for (let ppy=py-4; ppy<=py+4; ++ppy) {
                        for (let ppx=px-4; ppx<=px+4; ++ppx) {
                            const pIndex = 4*(this.__canvasWidth*ppy + ppx);
                            this.__pixelData[pIndex] = R;
                            this.__pixelData[pIndex+1] = G;
                            this.__pixelData[pIndex+2] = B;
                            this.__pixelData[pIndex+3] = 255;        
                        }
                    }                        
                }

                // callback for distance compute
                if (!inRange(x, xRange[0], xRange[1]) || !inRange(y, yRange[1], yRange[0]))
                    return;
                

                if (pointSet.length === 0) {
                    pointSet.push({x, y});                    
                    return;
                } 

                pointSet.forEach(p => {
                    const distX = Math.abs(p.x - x);
                    const distY = Math.abs(p.y - y);
                    minDistX = Math.min(minDistX || distX, distX);
                    minDistY = Math.min(minDistY || distY, distY);
                });
                pointSet.push({x, y});
            });
        });
    }

    drawOnCanvas = (ctx, plotData, xAccessor, yAccessor, dataFilter, hitTestor, distComputor) => {
    	const { markerProvider } = this.props;
        
        const nest = d3Nest()
            .key(d => d.markerID)
            .entries(plotData);

        const pointSet = [], minDist = {x: null, y: null};
        nest.forEach(group => {
            const {key: markerKey, values} = group;
            values.forEach(d => {
                let x = xAccessor(d);
                let y = yAccessor(d);

                if (x == null || y == null) return;
                if(!dataFilter(d)) return;

                // callback for drawing
                if (ctx) {
                    markerProvider.drawAt(ctx, x, y, markerKey);
                    //console.log(d.sample)
                    //console.log(x)
                }

                // callback for hit test
                if (hitTestor) hitTestor(x, y, d.colorID);

                // callback for distance compute
                if (distComputor) distComputor(x, y, minDist, pointSet);
            });
        });
    }

    drawOnCanvasForce = (ctx, pointSet, hitTestor) => {
    	const { markerProvider } = this.props;
        
        const nest = d3Nest()
            .key(d => d.markerID)
            .entries(pointSet);

        nest.forEach(group => {
            const {key: markerKey, values} = group;
            values.forEach(d => {
                let x = d.x;
                let y = d.y;

                // callback for drawing
                if (ctx) {
                    markerProvider.drawAt(ctx, x, y, markerKey);
                }

                // callback for hit test
                if (hitTestor) hitTestor(x, y, d.colorID);
            });
        });
    }

    getAccessor = (attr) => {
        const {ordinary, name, step, scale, extents, origExtents} = attr;
        return (d) => {
            const value = d[name];
            let scaledValue;
            if (ordinary) {
                let index = origExtents.indexOf(value);
                const range = scale.range();
                const sign = range[0] < range[1] ? 1: -1;
                // if (sign < 0)
                //    index = origExtents.length - index - 1;
                //console.log(value, index, scale(index) + sign*step/2, step)
                scaledValue = scale(index) + sign * step / 2;
            } else {
                scaledValue = scale(value);
            }
            return scaledValue;
        }
    }

    getDataFilter = (dataExtents, origDataExtents) => {
        const dataKeys = Object.keys(dataExtents);        
        return d => {
            return dataKeys.map(key => {
                const extents = dataExtents[key];
                let value = d[key];
                if (value == null) return true;
                if (typeof value === 'string') {
                    const tempExtents = origDataExtents[key];
                    //value = tempExtents.length - tempExtents.indexOf(value) - 1 + 0.5;
                    value = tempExtents.indexOf(value) + 0.5;
                }
                return extents[0] <= value && value <= extents[1];                                
            }).every(each => each);
        };
    }

    getHitTestor = (ratio, pixelData, width) => {
        return (x, y, colorID) => {
            if (pixelData && colorID) {
                const rgbDigits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(colorID);
                const R = parseInt(rgbDigits[2]);
                const G = parseInt(rgbDigits[3]);
                const B = parseInt(rgbDigits[4]);
                const px = Math.floor( (x) * ratio );
                const py = Math.floor( (y) * ratio );
    
                for (let ppy=py-4; ppy<=py+4; ++ppy) {
                    for (let ppx=px-4; ppx<=px+4; ++ppx) {
                        const pIndex = 4*(width*ppy + ppx);
                        pixelData[pIndex] = R;
                        pixelData[pIndex+1] = G;
                        pixelData[pIndex+2] = B;
                        pixelData[pIndex+3] = 255;        
                    }
                }                        
            }    
        };
    }

    getDistanceComputor = (xRange, yRange) => {
        const inRange = (v, minv, maxv) => minv < v && v < maxv;
        return (x, y, minDist, pointSet) => {
            if (!inRange(x, xRange[0], xRange[1]) || !inRange(y, yRange[1], yRange[0])) return;
            if (pointSet.length === 0) {
                //pointSet.push({x, y});                    
                return;
            } 
            pointSet.forEach(p => {
                const distX = Math.abs(p.x - x);
                const distY = Math.abs(p.y - y);
                minDist.x = Math.min(minDist.x || distX, distX);
                minDist.y = Math.min(minDist.x || distY, distY);
            });
            //pointSet.push({x, y});
        }
    }

    preDraw = (hitTest) => {
        const { width, height, ratio, margin } = this.props.shared;
        this.__hitCanvas = (hitTest.canvas) ? hitTest.canvas : null;
        this.__hitCtx = (hitTest.ctx) ? hitTest.ctx : null;
        
        this.__pixelData = null; 
        this.__pixel = null;
        this.__canvasWidth = 0;
        if (this.__hitCanvas && this.__hitCtx) {
            const canvasWidth = Math.floor( width*ratio );
            const canvasHeight = Math.floor( height*ratio );

            this.__hitCtx.save();
            this.__hitCtx.setTransform(1, 0, 0, 1, 0, 0);
            this.__hitCtx.scale(ratio, ratio);
            this.__hitCtx.translate(margin.left, margin.top);
            this.__pixel = this.__hitCtx.getImageData(0, 0, canvasWidth, canvasHeight);
            this.__pixelData = this.__pixel.data;            
            this.__canvasWidth = canvasWidth;
        }        
    }

    draw = (ctx, moreProps) => {
        if (this.props.shared.showImage) {
            //this.drawImage(moreProps, ctx);
            return;
        }
        //console.log('draw canvas: ', this.props.shared.showImage)

        const { hitTest, xAttr, yAttr, zAttr, dataExtents, plotData } = moreProps;
        const { markerProvider, shared: {origDataExtents, ratio} } = this.props;
        
        //console.log('draw: ', yAttr)
        //console.log(plotData)
        //console.log(xAttr.scale.domain(), xAttr.scale.range())

        this.preDraw(hitTest);        
        const dataFilter = this.getDataFilter(dataExtents, origDataExtents);
        const hitTestor = null;// this.getHitTestor(ratio, this.__pixelData, this.__canvasWidth);
        const distComputor = null; //this.getDistanceComputor(xAttr.scale.range(), yAttr.scale.range());
        const xAccessor = this.getAccessor(xAttr);
        const yAccessor = this.getAccessor(yAttr);

        ctx.mozImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        ctx.imageSmoothingEnabled = false;        
        this.drawOnCanvas(ctx, plotData, xAccessor, yAccessor, dataFilter, hitTestor, distComputor);
        this.postDraw();
    }

    postDraw = () => {
        const { ratio, margin } = this.props.shared;
        
        if (this.__pixelData && this.__pixel) {
            this.__hitCtx.putImageData(this.__pixel, margin.left * ratio, margin.top * ratio);            
            this.__pixelData = null;  
            this.__pixel = null;          
            this.__canvasWidth = 0;
            this.__hitCtx.restore();
        }        
    }

    // svg version of the draw function using MarkerProvider
    drawSVG = (moreProps) => {
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
            origExtents: xExtents
        } = xAttr;

        const {
            name: yName,
            scale: yScale,
            step: yStep,
            ordinary: yOrdinary,
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

        const points = [];
        const dataKeys = Object.keys(dataExtents);
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

                points.push(
                    markerProvider.getSVG(x, y, markerKey, d._id)
                );
            });
        });

        console.log(points)

        return points;
    }

    drawImage = (moreProps, ctx) => {

        const { plotData, xAttr, yAttr, dataExtents } = moreProps;
    	const { shared: {origDataExtents, zoomFactor} } = this.props;
        
        const xAccessor = this.getAccessor(xAttr);
        const yAccessor = this.getAccessor(yAttr);
        const dataFilter = this.getDataFilter(dataExtents, origDataExtents);
        const distComputor = this.getDistanceComputor(
            xAttr.scale.range(), 
            yAttr.scale.range()
        );
        
        const pointSet = [], minDist = {x: null, y: null};
        plotData.forEach(d => {
            let x = xAccessor(d);
            let y = yAccessor(d);

            if (x == null || y == null) return;
            if(!dataFilter(d)) return;
            if (distComputor) {
                distComputor(x, y, minDist, pointSet);
            }
            pointSet.push({x, y, ...d}); 
        });
    
        if (pointSet.length === 1) {
            const point = pointSet[0];
            this.__cache = {};
            Object.keys(point).forEach(key => {
                this.__cache[key] = point[key];
            });
        }

        const MIN_IMAGE_SIDE = 16;
        let imgRefWidth, imgRefHeight; 
        
        if (minDist.x == null || minDist.y == null) {
            imgRefWidth = this.__imgRefWidth * (1/zoomFactor);
            imgRefHeight = this.__imgRefHeight * (1/zoomFactor);
        } else if (minDist.x < MIN_IMAGE_SIDE && minDist.y < MIN_IMAGE_SIDE) {
            if (this.SubscriberExtNode == null) {
                return;
            }
            const { getCanvasContexts } = this.props.shared;
            ctx = ctx ? ctx: getCanvasContexts().chartOn;
            this.SubscriberExtNode.preDraw(ctx);
            this.drawOnCanvasForce(ctx, pointSet);
            this.SubscriberExtNode.postDraw(ctx);
            return;                
        } else if (minDist.x >= MIN_IMAGE_SIDE && minDist.y < MIN_IMAGE_SIDE) {
            imgRefWidth = Math.floor(minDist.x);
        } else if (minDist.y >= MIN_IMAGE_SIDE && minDist.x < MIN_IMAGE_SIDE) {
            imgRefHeight = Math.floor(minDist.y);
        } else {
            imgRefWidth = Math.floor(minDist.x);
            imgRefHeight = Math.floor(minDist.y);
        }

        this.__imgRefWidth = imgRefWidth;
        this.__imgRefHeight = imgRefHeight;

        const imageSet = [];
        const { imgPool, handleImageRequest, handleImageZoom, canvasDim } = this.props.shared;
        const pointSetToUse = pointSet.length ? pointSet: [this.__cache];

        const imageRatio = Math.max(
            imgRefWidth / canvasDim.width || 0.1, 
            imgRefHeight / canvasDim.height || 0.1);
        //console.log(canvasDim, imgRefWidth, imgRefHeight)
            
        let showGrid = pointSetToUse.length === 1 && imageRatio > 30;

        pointSetToUse.forEach(d => {
            imageSet.push(<ImgViewer
                key={`imgViewer-${d._id}`}
                x={xAccessor(d)}
                y={yAccessor(d)}
                imgRefWidth={this.__imgRefWidth}
                imgRefHeight={this.__imgRefHeight}
                id={d._id}
                imgPool={imgPool}
                onImageRequest={handleImageRequest}
                onImageZoom={handleImageZoom}
                showGrid={showGrid}
                svgDim={canvasDim}
            />);
        });
        return imageSet;
    }

    render() {
        const { showImage } = this.props.shared;
        const draw = showImage ? null: this.draw;
        const drawSVG = showImage ? this.drawImage: null;

    	return <SubscriberExt
            ref={node => this.SubscriberExtNode = node}
            canvas={contexts => contexts.chartOn}
    		clip={true}
    		edgeClip={false}
            draw={draw}
            drawSVG={drawSVG}
            useSVG={showImage}
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
