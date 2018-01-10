import React from "react";
import PropTypes from "prop-types";

//import { SubscriberExtend } from "../core";
import { SubscriberExt } from '../core';
import { functor, hexToRGBA } from "../utils";

import { nest as d3Nest } from "d3-collection";

import { clearCanvas } from '../core/utils';

class ScatterSeries extends React.Component {
    constructor(props) {
        super(props);
        this.markers = null;

        this.calculateMarkers(props);
    }

    componentDidMount() {
        //this.calculateMarkers(); // for, v1
    }

    componentWillReceiveProps(nextProps) {
        // todo: check if it needs to make new set of markers
        //this.calculateMarkers(nextProps); // for, v1
    }

    // fast, v1
    calculateMarkers = (props = this.props) => {
        const { drawOrder, markerProvider, markerProps, marker } = props;
        const { ratio } = props.shared;

    	if (!(markerProvider || marker))
           throw new Error("required prop, either marker or markerProvider missing");

        const nMarkers = drawOrder.length,
              spacing = 2,
              mProps = {
                  ...marker.defaultProps,
                  ...markerProps
              };

        const fill = functor(mProps.fill),
              stroke = functor(mProps.stroke),
              opacity = functor(mProps.opacity),
              radius = functor(mProps.r);

        let xpos = spacing;
        const markers = drawOrder.map( (key, index) => {
            const r = radius(key);
            const point = {
                key,
                x: xpos + r,
                y: spacing + r,
                fill: hexToRGBA(fill(key), mProps.opacity),
                stroke: stroke(key),
                strokeWidth: mProps.strokeWidth,
                opacity: opacity(key),
                radius: r,
                sx: xpos - spacing/2,
                sy: spacing - spacing/2,
                width: 2*r + spacing,
                height: 2*r + spacing,
                handler: marker
            };
            xpos += 2*r + spacing;
            return point;
        });

        this.markers = markers;
    }

    // fast, v1
    drawMarkers = (offCanvas, offctx, ctx, moreProps) => {
    	const { yAccessor, orderAccessor, shared: {ratio} } = this.props;
        const {
            xScale,
            xAccessor,
            plotData,
            chartConfig: { yScale }
        } = moreProps;

        const nest = d3Nest()
            .key(d => orderAccessor(d))
            .entries(plotData);

        this.markers.forEach(marker => {
            marker.handler.draw(offctx, marker);
        });

        this.markers.forEach(marker => {
            const markerKey = marker.key;
            const group = nest.find(d => d.key === markerKey);
            if (group == null) return;

            const { key: groupKey, values: groupValues } = group;
            let {sx, sy, width, height, radius} = marker;

            groupValues.forEach(point => {
                const px = xScale(xAccessor(point)),
                      py = yScale(yAccessor(point));

                ctx.drawImage(offCanvas,
                    sx * ratio,
                    sy * ratio,
                    width * ratio,
                    height * ratio,
                    px-radius,
                    py-radius,
                    width,
                    height
                );
            });
        });
    }

    // deprecated, slow
    makePoint = (moreProps) => {
    	const { yAccessor, markerProvider, markerProps } = this.props;
        let { marker } = this.props;

        //console.log(moreProps)
        const {
            xScale,
            xAccessor,
            plotData,
            chartConfig: { yScale }
        } = moreProps;

    	if (!(markerProvider || marker))
    		throw new Error("required prop, either marker or markerProvider missing");

    	return plotData.map(d => {
    		if (markerProvider) marker = markerProvider(d);
    		const mProps = {
    			...marker.defaultProps,
    			...markerProps
    		};

    		const fill = functor(mProps.fill);
            const stroke = functor(mProps.stroke);
            const opaticy = functor(mProps.opacity);
            const radius = functor(mProps.r);

            //console.log(stroke(d))

    		return {
    			x: xScale(xAccessor(d)),
    			y: yScale(yAccessor(d)),
    			fill: hexToRGBA(fill(d), mProps.opacity),
                stroke: stroke(d),
                strokeWidth: mProps.strokeWidth,
                radius: radius(d),
                opacity: opaticy(d),
    			datum: d,
    			marker: marker,
    			//props: mProps
    		};
    	});
    }

    // deprecated, slow
    drawMarkersOrig = (ctx, moreProps) => {
        const { drawOrder, orderAccessor } = this.props;
        const points = this.makePoint(moreProps);

        let nest;
        if (drawOrder && orderAccessor) {
            nest = d3Nest()
                .key(d => orderAccessor(d.datum))
                .key(d => d.fill)
                .key(d => d.stroke)
                .entries(points);

            drawOrder.forEach(key => {
                const group = nest.find(d => d.key === key);
                if (group == null) return;
                const {key: groupKey, values: groupValues} = group;
                //console.log(groupKey, groupValues)
                groupValues.forEach(fillGroup => {
                    const { key: fillKey, values: fillValues } = fillGroup;
                    if (fillKey !== 'none')
                        ctx.fillStyle = fillKey;
                    fillValues.forEach(strokeGroup => {
                        const { values: strokeValues } = strokeGroup;
                        strokeValues.forEach(point => {
                            const { marker } = point;
                            marker.draw(ctx, point);
                        });
                    });
                });
            });
        } else  {
            nest = d3Nest()
                .key(d => d.fill)
                .key(d => d.stroke)
                .entries(points);

            nest.forEach(fillGroup => {
                const { key: fillKey, values: fillValues } = fillGroup;
                if (fillKey !== "none")
                    ctx.fillStyle = fillKey;
                fillValues.forEach(strokeGroup => {
                    const { values: strokeValues } = strokeGroup;
                    strokeValues.forEach(point => {
                        const { marker } = point;
                        marker.draw(ctx, point);
                    });
                });
            });
        }
    }

    drawMarkersWithProvider = (ctx, moreProps) => {
    	const { 
            yAccessor, 
            drawOrder,
            orderAccessor, 
            shared: {ratio, xStep},
            markerProvider 
        } = this.props;

        const {
            xScale,
            xAccessor,
            plotData,
            chartConfig: { yScale, yStep, yStepEnabled }
        } = moreProps;

        const nest = d3Nest()
            .key(d => orderAccessor(d))
            .entries(plotData);

        const yOffset = yStepEnabled ? yStep/2: 0;
        const xOffset = xStep / 2;
        //console.log(nest);
        //console.log(yScale.domain(), yScale.range(), xOffset, yOffset)

        drawOrder.forEach(key => {
            const group = nest.find(d => d.key === key);
            if (group == null) return;

            const {key: groupKey, values: groupValues} = group;
            groupValues.forEach(d => {
                const x = xScale(xAccessor(d)) + xOffset;
                const y = yScale(yAccessor(d)) - yOffset;
                //console.log(x, y)
                markerProvider.drawAt(ctx, x, y, d.markerID);
            });
        });
    }

    draw = (ctx, moreProps) => {

        if (false) {
            // fast, v1
            const { ratio } = this.props.shared;
            const offCanvas = document.getElementById('off');
            const offctx = offCanvas.getContext('2d');

            clearCanvas([offctx], ratio);
            this.drawMarkers(offCanvas, offctx, ctx, moreProps);
            clearCanvas([offctx], ratio);
        } else if (true) {
            // fast, v2, using markerProvider
            this.drawMarkersWithProvider(ctx, moreProps);
        } else {
            // slow, unused
            this.drawMarkersOrig(ctx, moreProps);
        }
    }

    render() {
    	return <SubscriberExt
    		canvas={contexts => contexts.axes}
    		clip={true}
    		edgeClip={false}
    		draw={this.draw}
    		drawOn={["pan"]}
    		shared={this.props.shared}
    		chartConfig={this.props.chartConfig}
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
