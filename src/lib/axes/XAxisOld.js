import React from "react";
import PropTypes from "prop-types";

import AxisEventHandler from "./AxisEventHandler";
import {
	drawAxisLine,
	drawTicks
} from "./draw";
import { SubscriberExt } from "../core";

class XAxis extends React.Component {

    getTicks = (xScale) => {
    	const { ticks, tickFormat, innerTickSize, orient } = this.props;
    	const { fontSize } = this.props.labelStyle;
    	//const { xScale } = this.props.shared;

    	const baseFormat = xScale.tickFormat
    		? xScale.tickFormat(ticks)
    		: d => d;

    	const format = tickFormat
    		? d => tickFormat(d) || ""
    		: baseFormat;

    	const tickValues = xScale.ticks(ticks);

    	const sign = orient === "top" || orient === "left" ? -1 : 1;
    	const dy = fontSize * 0.71;

    	return tickValues.map(d => {
    		const x = xScale(d); // Math.round(xScale(d));
    		return {
    			value: d,
    			label: format(d),
    			x1: x,
    			y1: 0,
    			x2: x,
    			y2: sign * innerTickSize,
    			labelX: x,
    			labelY: sign * 2 * innerTickSize + dy
    		};
    	});
	}
	
	getTicksOrdinary = (xScale) => {
    	const { ticks, tickFormat, innerTickSize, orient } = this.props;
    	const { fontSize } = this.props.labelStyle;
		const { xExtents, xStep } = this.props.shared;
		
    	const sign = orient === "top" || orient === "left" ? -1 : 1;
    	const dy = fontSize * 0.71;

		const xLabels = xExtents.slice();
		const minval = Math.max(Math.floor(xScale.invert(xScale.range()[0])), 0);
		const maxval = Math.min(Math.ceil(xScale.invert(xScale.range()[1])), xLabels.length);

		//console.log(minval, maxval, xStep)
		const maxLabelLength = Math.floor(xStep / 5);

		const tickArray = [];
		for (let i=minval; i<maxval; ++i) {
			const x = xScale(i);

			if (x < 0) continue;

			tickArray.push({
				value: i,
				label: xLabels[i].length < maxLabelLength ? xLabels[i] : xLabels[i].substring(0, maxLabelLength) + '...',
    			x1: x + xStep/2,
    			y1: 0,
    			x2: x + xStep/2,
    			y2: sign * innerTickSize,
    			labelX: x + xStep/2,
    			labelY: sign * 2 * innerTickSize + dy				
			});
		}
		return tickArray;

    	const baseFormat = xScale.tickFormat
    		? xScale.tickFormat(ticks)
    		: d => d;

    	const format = tickFormat
    		? d => tickFormat(d) || ""
    		: baseFormat;

    	const tickValues = xScale.ticks(ticks);


    	return tickValues.map(d => {
    		const x = xScale(d); // Math.round(xScale(d));
    		return {
    			value: d,
    			label: format(d),
    			x1: x,
    			y1: 0,
    			x2: x,
    			y2: sign * innerTickSize,
    			labelX: x,
    			labelY: sign * 2 * innerTickSize + dy
    		};
    	});		
	}

    draw = (ctx, moreProps) => {
    	const { showDomain, showTicks, showTickLabel, ordinary } = this.props;
    	//const { xScale } = this.props.shared;
        const { xScale } = moreProps;

    	const axisLocation = this.getAxisLocation();

    	ctx.save();
    	ctx.translate(0, axisLocation);

    	if (showDomain) {
			//console.log('xaxis range: ', xScale.range());
    		drawAxisLine(ctx, this.props, xScale.range());
    	}

    	if (showTicks) {
			drawTicks(ctx, 
				ordinary ? this.getTicksOrdinary(xScale) : this.getTicks(xScale),
    			this.props.tickStyle,
    			showTickLabel ? this.props.labelStyle : null
    		);
    	}

    	ctx.restore();
    }

    getAxisLocation = () => {
        const { axisAt } = this.props;
        const { height } = this.props.chartConfig;

    	let axisLocation;
    	switch (axisAt) {
    	case "top": axisLocation = 0; break;
    	case "middle": axisLocation = height / 2; break;
    	case "bottom": default: axisLocation = height;
    	}

    	return axisLocation;
    }

    getDrawRegion = () => {
        const { axisHeight, orient } = this.props;
        const { width } = this.props.chartConfig;

    	const
    		x = 0,
    		y = orient === "top" ? -axisHeight : 0,
    		w = width,
    		h = axisHeight;

    	return {
    		x,
    		y,
    		width: w,
    		height: h,
    	};
    }

    onDomainChange = (newDomain) => {
    	const { handleXAxisZoom } = this.props.shared;
    	if (handleXAxisZoom)
    		handleXAxisZoom(newDomain);
    }

    render() {
    	const
    		rect = this.getDrawRegion(),
            axisLocation = this.getAxisLocation(),
            { xScale } = this.props.shared;

    	const handler = this.props.zoomEnabled
    		? <AxisEventHandler
    			{...rect}
    			scale={xScale}
    			getMouseDelta={this.props.getMouseDelta}
    			getInverted={this.props.getInverted}
                onDomainChange={this.onDomainChange}
                zoomCursorClassName={'react-multiview-ew-resize-cursor'}
    		/>
    		: null;

    	return (
    		<g transform={`translate(${0},${axisLocation})`}>
    			{handler}
    			{/* <SubscriberExt
    				ref={node => this.node = node}
    				canvas={contexts => contexts.axes}
    				clip={false}
    				edgeClip={false}
    				draw={this.draw}
                    drawOn={["pan"]}
                    shared={this.props.shared}
    				chartConfig={this.props.chartConfig}
    			/> */}
    		</g>
    	);
    }
}

XAxis.propTypes = {
	width: PropTypes.number,
	height: PropTypes.number,
	axisHeight: PropTypes.number,

	axisAt: PropTypes.oneOfType([
		PropTypes.oneOf(["top", "bottom", "middle"]),
		PropTypes.number
	]).isRequired,
	orient: PropTypes.oneOf(["top", "bottom"]).isRequired,

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
	showDomain: PropTypes.bool,

	className: PropTypes.string,
	domainClassName: PropTypes.string,

	zoomEnabled: PropTypes.bool,
	getMouseDelta: PropTypes.func,
	// onContextMenu: PropTypes.func,
	// onDoubleBlick: PropTypes.func,
};

XAxis.defaultProps = {
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
		textAnchor: "middle",
		tickLabelFill: "#000000"
	},

	showTicks: true,
	showTickLabel: true,
	showDomain: true,

	className: "",
	domainClassName: "",

	// tickPadding: 6,
	// tickStroke: '#000000',
	// tickStrokeOpacity: 1,

	// fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
	// fontSize: 12,

	// xZoomHeight: 25,
	zoomEnabled: true,
	getMouseDelta: (startXY, mouseXY) => startXY[0] - mouseXY[0],
	getInverted: (scale, XY) => scale.invert(XY[0]),

	// getStart: (scale, startXY) => scale.invert(startXY[0]),
	// fill: 'none',
};

export default XAxis;
