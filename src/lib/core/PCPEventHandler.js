import React from "react";
import PropTypes from "prop-types";

import {
	mousePosition,
	d3Window
} from "../utils";

import {
	select,
	event as d3Event,
	mouse,
} from "d3-selection";

class PCPEventHandler extends React.Component {
	constructor() {
		super();

		this.state = {
			axisMoveInProgress: false,
			startX: null,
			moveAxis: null
		};
	}

    inAxisHandlerY = (y) => {
    	const { axisMoveHandlerYRange } = this.props;
    	for (let i = 0; i < axisMoveHandlerYRange.length; ++i) {
    		const [miny, maxy] = axisMoveHandlerYRange[i];
    		if (miny <= y && y <= maxy) return true;
    	}
    	return false;
    }

    findSelectedAxis = (x) => {
    	const { axisMoveHandlerXOffset, dimConfig } = this.props;
    	const xAtCanvas = x - axisMoveHandlerXOffset;

    	const dimTitles = Object.keys(dimConfig);
    	for (let i = 0; i < dimTitles.length; ++i) {
    		const { position, axisWidth, title } = dimConfig[dimTitles[i]];
    		const minx = position - axisWidth / 2,
    			maxx = position + axisWidth / 2;

    		if (minx <= xAtCanvas && xAtCanvas <= maxx)
    			return title;
    	}
    	return null;
    }

    handleMouseDown = (e) => {
    	e.preventDefault();

    	const mouseXY = mousePosition(e);

    	if (this.inAxisHandlerY(mouseXY[1])) {
    		// console.log('inside')
    		const axisTitle = this.findSelectedAxis(mouseXY[0]);
    		if (axisTitle) {
    			select(d3Window(this.node))
    				.on("mousemove.axismove", this.handleDrag, false)
    				.on("mouseup.axismove", this.handleDragEnd, false);

    			this.setState({
    				axisMoveInProgress: true,
    				startX: mouseXY[0],
    				moveAxis: axisTitle
    			});
    		}
    	}
    }

    handleDrag = () => {
    	const {
    		axisMoveInProgress,
    		startX,
    		moveAxis
    	} = this.state;

    	const e = d3Event;

    	if (axisMoveInProgress) {
    		const mouseXY = mouse(this.node);
    		const moveDist = mouseXY[0] - startX;
    		if (this.props.onAxisMove) {
    			this.props.onAxisMove(moveAxis, moveDist, e);
    		}
    	}
    }

    handleDragEnd = () => {
    	const {
    		axisMoveInProgress,
    		startX,
    		moveAxis
    	} = this.state;
    	const e = d3Event;

    	if (axisMoveInProgress) {
    		const mouseXY = mouse(this.node);
    		const moveDist = mouseXY[0] - startX;
    		if (this.props.onAxisMoveEnd)
    			this.props.onAxisMoveEnd(moveAxis, moveDist, e);
    	}

    	select(d3Window(this.node))
    		.on("mousemove.axismove", null)
    		.on("mouseup.axismove", null);

    	this.setState({
    		axisMoveInProgress: false,
    		startX: null,
    		moveAxis: null
    	});
    }

    render() {
    	const className = this.state.axisMoveInProgress
    		? "react-multiview-grabbing-cursor"
    		: "react-multiview-default-cursor";

    	return <rect
    		ref={node => this.node = node}
    		className={className}
    		width={this.props.width}
    		height={this.props.height}
    		style={{ fill: "red", opacity: 0. }}
    		onMouseDown={this.handleMouseDown}
    	/>;
    }
}

PCPEventHandler.propTypes = {
	axisMoveHandlerYRange: PropTypes.array,
	axisMoveHandlerXOffset: PropTypes.number,
	dimConfig: PropTypes.object,
	onAxisMove: PropTypes.func,
	onAxisMoveEnd: PropTypes.func,
	width: PropTypes.number,
	height: PropTypes.number
};

export default PCPEventHandler;