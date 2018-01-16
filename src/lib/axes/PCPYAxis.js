import React from 'react';
import PropTypes from 'prop-types';

import PCPAxisEventHandler from './PCPAxisEventHandler';
import {
	drawAxisLine,
    drawTicks,
    drawAxisTitle
} from "./draw";
import {
	hexToRGBA
} from '../utils';
import { PCPSubscriberExt } from '../core';

import { scaleLinear } from 'd3-scale';
import { format as d3Format } from 'd3-format';

class PCPYAxis extends React.Component {
    getTicks = (yScale) => {
    	const { ticks, tickFormat, innerTickSize, orient } = this.props;
    	const { fontSize } = this.props.labelStyle;

    	const baseFormat = yScale.tickFormat
    		? yScale.tickFormat(ticks)
    		: d => d;

    	const format = tickFormat
    		? d => tickFormat(d) || ""
    		: baseFormat;

    	const tickValues = yScale.ticks(ticks);

    	const sign = orient === "left" || orient === "top" ? -1 : 1;
    	const dx = fontSize * 0.35;

    	return tickValues.map(d => {
    		const y = yScale(d); // Math.round(xScale(d));
    		return {
    			value: d,
    			label: format(d),
    			x1: 0,
    			y1: y,
    			x2: sign * innerTickSize,
    			y2: y,
    			labelX: sign * ( 1.2 * innerTickSize + dx ),
    			labelY: y + dx
    		};
    	});
	}
	
    getTicksOrdinary = (yScale, moreProps) => {
		const { ticks, tickFormat, innerTickSize, orient, height } = this.props;
    	const { fontSize } = this.props.labelStyle;
        const { step: yStep, extents: yExtents, flip} = moreProps.dimConfig; 

        const sign = orient === "left" || orient === "top" ? -1 : 1;
    	const dx = fontSize * 0.35;

		const yLabels = yExtents.slice();
        if (!flip) yLabels.reverse();
        
		const minval = Math.max(Math.floor(yScale.invert(yScale.range()[0])), 0);
		const maxval = Math.min(Math.ceil(yScale.invert(yScale.range()[1])), yLabels.length);

		const tickArray = [];
		for (let i=minval; i<maxval; ++i) {
			const y = yScale(i);

			if (y < 0 || y > height) {
				continue;
			}

			tickArray.push({
				value: i,
				label: yLabels[i].length > 13 ? yLabels[i].substring(0, 13) + '...': yLabels[i],
				x1: 0,
				y1: y - yStep/2,
				x2: sign * innerTickSize,
				y2: y - yStep/2,
				labelX: sign * ( 1.2 * innerTickSize + dx),
				labelY: y + dx - yStep/2
			});
		}
		return tickArray;
	}	
	
	drawNullMarker = (ctx, moreProps) => {
		const { dimConfig: {position, nullPositionY, title} } = moreProps;
		//console.log(title, position, nullPositionY);
		//ctx.fillRect(position-2, nullPositionY, 4, 4);
		ctx.beginPath();
		ctx.rect(-2, nullPositionY-2, 4, 4);
		ctx.fill();
	}

	drawSelect = (ctx, start, end) => {
		const { axisWidth } = this.props;
		const halfWidth = axisWidth / 2;
		const halfhalfWidth = axisWidth / 4;
		ctx.fillStyle = hexToRGBA('#000000', 0.3);
		ctx.rect(-halfhalfWidth, start, halfWidth, end - start);
		ctx.fill();
	}

    draw = (ctx, moreProps) => {
        //console.log('moreProps: ', moreProps);
        //console.log('props: ', this.props)
    	const {
            height, 
            showDomain, showTicks, showTitle, showTickLabel, 
            titleFormat,
            labelStyle } = this.props;
        // const { scale: yScale, title } = this.props.config;
        const { fontSize } = labelStyle;
        const { margin } = this.props.shared;
        const { 
            scale: yScale, 
            position: axisLocation,
            title,
			ordinary,
			select,
        } = moreProps.dimConfig;

    	ctx.save();
    	ctx.translate(axisLocation, 0);

        if (showTitle) {
            //drawAxisTitle(ctx)
            drawAxisTitle(ctx,{
                label: titleFormat(title),
                x: 0,
                y: -fontSize
            }, {
                ...labelStyle,
                textAnchor: 'middle'
            });
        }

    	if (showDomain) {
			drawAxisLine(ctx, this.props, [0, height]);
			// drawNullMarker
			this.drawNullMarker(ctx, moreProps);
			// end drawNullMarker
    	}

    	if (showTicks) {
    		const { orient } = this.props;
			const textAnchor = orient === "left" ? "end" : "start";
			drawTicks(ctx, 
				ordinary ? this.getTicksOrdinary(yScale, moreProps): this.getTicks(yScale),
    			this.props.tickStyle,
    			showTickLabel ? { ...labelStyle, textAnchor } : null
    		);
		}
		
		if (select) {
			let [start, end] = select;
			if (start > end) {
				start = select[1];
				end = select[0];
			}
			this.drawSelect(ctx, start, end);
		}		

    	ctx.restore();        
    }

    getDrawRegion = () => {
        const { axisWidth, orient, height } = this.props;
        const { margin } = this.props.shared;

        const 
            x = 0,
            y = margin.top/2,
            w = axisWidth,
            h = height;

    
        //const halfAxisWidth = newAxisWidth/2;
        //const tx = (orient === 'left') ? -halfAxisWidth: halfAxisWidth;
        //const ty = 0;
        //const transform = `translate(${tx},${ty})`;
        
        return { 
            x, y, width: w, height: h,
            //tx 
        }
    }
	
	handleRangeSelect = (start, end, e) => {
		if (this.props.onRangeSelect) {
			this.props.onRangeSelect(this.props.title, start, end, e);
		}
	}

	handleRangeSelectEnd = (start, end, e) => {
		if (this.props.onRangeSelectEnd) {
			this.props.onRangeSelectEnd(this.props.title, start, end, e);
		}
	}

	handleRangeSelectCancel = (e) => {
		if (this.props.onRangeSelectCancel) {
			this.props.onRangeSelectCancel(this.props.title, e);
		}
	}

    render () {
        const {
            axisLocation,
            shared: {margin},
            height,
            title
        } = this.props;

        const rect = this.getDrawRegion();

        //console.log(this.props)

        return (
            <g transform={`translate(${axisLocation},${0})`}>
                <PCPAxisEventHandler
					{...rect}
					onRangeSelect={this.handleRangeSelect}
					onRangeSelectEnd={this.handleRangeSelectEnd}
					onRangeSelectCancle={this.handleRangeSelectCancel}
                    //topHeight={height}
                    //tx={0}
                    //onAxisMove={this.handleAxisMove}
                    //onAxisMoveEnd={this.handleAxisMoveEnd}
                    moveCursorClassName={"react-multiview-grabbing-cursor"}
                    zoomCursorClassName={"react-multiview-ns-resize-cursor"}
                />
                <PCPSubscriberExt 
                    ref={node => this.node = node}
                    canvas={contexts => contexts.axes}
                    clip={false}
                    edgeClip={false}
                    draw={this.draw}
                    drawOn={['moveaxis','selectrange']}
                    shared={this.props.shared}
                    dimConfig={this.props.dimConfig}
                />
            </g>
        );
    }
}

PCPYAxis.propTypes = {
	width: PropTypes.number,
	height: PropTypes.number,
	axisWidth: PropTypes.number,

	axisAt: PropTypes.oneOfType([
		PropTypes.oneOf(["left", "right", "middle"]),
		PropTypes.number
	]).isRequired,
	orient: PropTypes.oneOf(["left", "right"]).isRequired,

	ticks: PropTypes.number,
	tickFormat: PropTypes.func,

	// for axis line
	outerTickSize: PropTypes.number,
	stroke: PropTypes.string,
	strokeWidth: PropTypes.number,
	opacity: PropTypes.number,

	// for ticks
	innerTickSize: PropTypes.number,
	tickStyle: PropTypes.shape({
		tickStroke: PropTypes.string,
		tickStrokeOpacity: PropTypes.number,
		tickStrokeWidth: PropTypes.number
	}),

	labelStyle: PropTypes.shape({
		fontSize: PropTypes.number,
		fontFamily: PropTypes.string,
		textAnchor: PropTypes.string,
		tickLabelFill: PropTypes.string,
	}),

	showTicks: PropTypes.bool,
    showTickLabel: PropTypes.bool,
    showTitle: PropTypes.bool,
    showDomain: PropTypes.bool,
    
    titleFormat: PropTypes.func,

	className: PropTypes.string,
	domainClassName: PropTypes.string,

	zoomEnabled: PropTypes.bool,
	getMouseDelta: PropTypes.func,
	// onContextMenu: PropTypes.func,
	// onDoubleBlick: PropTypes.func,
};

PCPYAxis.defaultProps = {
	ticks: 10,

	outerTickSize: 0,
	stroke: "#000000",
	strokeWidth: 1,
	opacity: 1,

	innerTickSize: 5,
	tickStyle: {
		tickStroke: "#000000",
		tickStrokeOpacity: 1,
		tickStrokeWidth: 1
	},

	labelStyle: {
		fontSize: 6,
		fontFamily: "Roboto, sans-serif",
		textAnchor: "start",
		tickLabelFill: "#000000"
	},

	showTicks: true,
    showTickLabel: true,
    showTitle: true,
    showDomain: true,
    
	titleFormat: d => d,
	tickFormat: x => d3Format(".3s")(x),

	className: "",
	domainClassName: "",

	// tickPadding: 6,
	// tickStroke: '#000000',
	// tickStrokeOpacity: 1,

	// fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
	// fontSize: 12,

	// xZoomHeight: 25,
	zoomEnabled: true,
	getMouseDelta: (startXY, mouseXY) => startXY[1] - mouseXY[1],
	getInverted: (scale, XY) => scale.invert(XY[1])

	// fill: 'none',
};

export default PCPYAxis;