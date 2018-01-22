import React from 'react';
import PropTypes from 'prop-types';

import AxisEventHandlerSVG from './AxisEventHandlerSVG';

class XAxisSVG extends React.Component {

    getAxisLocation = () => {
        const { axisAt } = this.props;
        const { chartDim: {height} } = this.props.shared;

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
        const { chartDim: {width} } = this.props.shared;

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

	getTicksOrdinary = (xScale, xExtents, xStep) => {
		const { ticks, tickFormat, innerTickSize, orient } = this.props;
		const { chartDim: {width}} = this.props.shared;
    	const { fontSize } = this.props.labelStyle;
		
    	const sign = orient === "top" || orient === "left" ? -1 : 1;
    	const dy = fontSize * 0.71;

		const xLabels = xExtents.slice();
		xLabels.reverse();
		const minval = Math.max(Math.floor(xScale.invert(xScale.range()[0])), 0);
		const maxval = Math.min(Math.ceil(xScale.invert(xScale.range()[1])), xLabels.length);

		const maxLabelLength = Math.floor(xStep / 5);

		const tickArray = [];
		for (let i=minval; i<maxval; ++i) {
			const x = xScale(i) + xStep/2;

			if (x < 0 || x > width) continue;

			tickArray.push({
				value: i,
				label: xLabels[i].length < maxLabelLength ? xLabels[i] : xLabels[i].substring(0, maxLabelLength) + '...',
    			x1: x,
    			y1: 0,
    			x2: x,
    			y2: sign * innerTickSize,
    			labelX: x,
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

    renderTicks = (ticks) => {
        const { tickStyle, labelStyle } = this.props;
        const { tickStroke, tickStrokeOpacity, tickStrokeWidth } = tickStyle;
        
        const style = {
            stroke: tickStroke,
            strokeWidth: tickStrokeWidth,
            opacity: tickStrokeOpacity,
            fill: 'none'
        };
        
        const tickLines = [];
        ticks.forEach((tick,index) => {
            tickLines.push(
                <line key={`xaxis-tick-${index}`}
                    x1={tick.x1} y1={tick.y1} 
                    x2={tick.x2} y2={tick.y2} 
                    style={style} 
                />
            );
        });

        if (labelStyle) {
            ticks.forEach((tick,index) => {
                tickLines.push(
                    <text key={`xaxis-label-${index}`}
                        x={tick.labelX} y={tick.labelY} style={labelStyle}
                    >
                        {tick.label}
                    </text>
                );
            });
        }

        return tickLines;
    }

    renderAxisLine = (range) => {
        const {
            orient,
            outerTickSize,
            stroke,
            strokeWidth,
            opacity
        } = this.props;
    
        const sign = orient === "top" || orient === "left" ? -1 : 1;
        const xAxis = orient === "bottom" || orient === "top";

        const style = {
            stroke,
            strokeWidth,
            fill: 'none'
        };
        return <g>
            <line x1={range[0]} y1={0} x2={range[1]} y2={0} style={style} />
            <line x1={range[0]} y1={0} x2={range[0]} y2={sign * outerTickSize} style={style} />
            <line x1={range[1]} y1={0} x2={range[1]} y2={sign * outerTickSize} style={style} />
        </g>;
    }

    renderAxis = () => {
        const { showDomain, showTicks, showTickLabel } = this.props;
        const { xAttr } = this.props.shared;
        const axisLocation = this.getAxisLocation();

        const {
            scale,
            step,
            ordinary,
            origExtents: extents
        } = xAttr;

        const axis = [];

        if ( showDomain ) {
            axis.push(this.renderAxisLine(scale.range()));
        }

        if ( showTicks ) {
            const ticks = ordinary 
                ? this.getTicksOrdinary(scale, extents, step)
                : this.getTicks(scale);
            axis.push(this.renderTicks(ticks));
        }

        return axis;
    }
	
	onDomainChange = (newDomain) => {
    	const { handleXAxisZoom } = this.props.shared;
    	if (handleXAxisZoom)
    		handleXAxisZoom(newDomain);
	}

    render() {
        const rect = this.getDrawRegion(),
			  axisLocation = this.getAxisLocation(),
			  { xAttr: {scale: xScale} } = this.props.shared;

        return (
            <g transform={`translate(${0},${axisLocation})`}>
                <AxisEventHandlerSVG
					{...rect}
					scale={xScale}
					getMouseDelta={this.props.getMouseDelta}
					getInverted={this.props.getInverted}
					onDomainChange={this.onDomainChange}
					zoomCursorClassName={'react-multiview-ew-resize-cursor'}											
                />
                {this.renderAxis()}
            </g>
        );
    }
}

XAxisSVG.propTypes = {
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

XAxisSVG.defaultProps = {
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

export default XAxisSVG;
