import React from "react";
import PropTypes from "prop-types";

import { PCPSubscriberExt } from "../core";
import { hexToRGBA } from "../utils";

import { nest as d3Nest } from "d3-collection";

class PCPPolyLineSeries extends React.Component {
    draw = (ctx, moreProps) => {
    	const {
    		plotData,
    		xScale,
    		dimConfig
    	} = moreProps;
    	const { opacity, strokeWidth } = this.props;

    	const nest = d3Nest()
    		.key(d => d.stroke)
    		.entries(plotData);

    	const dimOrder = xScale.domain().map(name => {
			if (dimConfig[name]) return name;
		}).filter(d => d != null);

    	const yAccessor = (d, config) => {
    		const { ordinary, scale, accessor, extents, step, nullPositionY } = config;
    		const yValue = accessor(d);
    		if (yValue == null) {
    			return nullPositionY;
    		}
    		return ordinary
    			? scale(extents.indexOf(yValue)) - step / 2
    			: scale(yValue);
    	};

    	const xAccessor = (config) => {
    		return config.position;
    	};

    	ctx.save();
    	nest.forEach(groupByStroke => {
    		const { key: stroke, values: group } = groupByStroke;

    		group.forEach(d => {
    			d.__in = true;
    			for (let i = 0; i < dimOrder.length; ++i) {
					const config = dimConfig[dimOrder[i]];
					//console.log(config)
    				if (config == null || config.select == null) continue;

    				const py = yAccessor(d, config);
    				let [start, end] = config.select.slice();
    				if (start > end) {
    					const temp = start;
    					start = end;
    					end = temp;
    				}
    				if (start <= py && py <= end) continue;

    				d.__in = false;
    				break;
    			}
    		});

    		ctx.strokeStyle = hexToRGBA(stroke, opacity);
    		ctx.lineWidth = strokeWidth;
    		ctx.beginPath();
    		group.forEach(d => {
    			if (!d.__in) return;

    			const p1Config = dimConfig[dimOrder[0]];
    			const p1 = [xAccessor(p1Config), yAccessor(d, p1Config)];

    			ctx.moveTo(p1[0], p1[1]);
    			for (let i = 1; i < dimOrder.length; ++i) {
    				const p2Config = dimConfig[dimOrder[i]];
    				const p2 = [xAccessor(p2Config), yAccessor(d, p2Config)];
    				ctx.lineTo(p2[0], p2[1]);
    			}
    		});
    		ctx.stroke();
    	});
    	ctx.restore();
    }

    render() {
    	return <PCPSubscriberExt
    		canvas={contexts => contexts.pcpOn}
    		clip={false}
    		edgeClip={false}
    		draw={this.draw}
    		drawOn={["moveaxis", "selectrange"]}
    		shared={this.props.shared}
    		dimConfig={this.props.dimConfig}
    		useAllDim={true}
    	/>;
    }
}

PCPPolyLineSeries.propTypes = {
	opacity: PropTypes.number,
	strokeWidth: PropTypes.number,
	shared: PropTypes.object,
	dimConfig: PropTypes.object
};

export default PCPPolyLineSeries;