import React from "react";
import PropTypes from "prop-types";

import AxisEventHandler from "./AxisEventHandler";

import {
	SubscriberExtend
} from "../core";

import {
	drawAxisLine
} from "./draw";

class Axis extends React.Component {
    draw = (ctx, moreProps) => {
    	const { showDomain, showTicks, transform, range, getScale } = this.props;

    	console.log("Axis::draw");
    	console.log(this.props);

    	ctx.save();
    	ctx.translate(transform[0], transform[1]);

    	if (showDomain) {
    		drawAxisLine(ctx, this.props, range);
    	}

    	// if (showTicks) {
    	//     const tickProps = tickHelper(this.props, getScale(moreProps));
    	//     drawTicks(ctx, tickProps);
    	// }

    	ctx.restore();
    }

    render() {
    	const { rect, transform } = this.props;

    	const zoomEnabled = true;
    	const handler = zoomEnabled
    		? <AxisEventHandler
    			{...rect}
    		/>
    		: null;

    	return (
    		<g transform={`translate(${transform[0]},${transform[1]})`}>
    			{handler}
    			<SubscriberExtend
    				ref={node => this.node = node}
    				canvas={contexts => contexts.axes}
    				clip={false}
    				edgeClip={false}
    				draw={this.draw}
    				drawOn={["pan"]}
    				contextProps={this.props.contextProps}
    			/>
    			{/* <GenericChartComponent
                    ref={node => this.node = node}
                    canvas={contexts => contexts.axes}
                    //clip={false}
                    //edgeClip={this.props.edgeClip}
                    draw={this.draw}
                    //drawOn={['pan']}
                /> */}
    		</g>
    	);
    }
}

Axis.propTypes = {};
Axis.defaultProps = {};

export default Axis;