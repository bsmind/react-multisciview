import React from "react";
import PropTypes from "prop-types";

import {
	select,
	event as d3Event,
	mouse,
} from "d3-selection";

import { mousePosition, d3Window } from "../utils";

class EventHandler extends React.Component {
	constructor() {
		super();
		this.mouseInside = false;
		this.state = {
			panInProgress: false,
			panStart: {
				panStartXScale: null,
				panOrigin: null,
			},
		};
	}

	componentDidMount() {
		this.onListener();
	}

	componentWillUnmount() {
		this.offListener();
	}

    onListener = () => {
    	if (this.node) {
    		select(this.node)
    			.on("mouseenter", this.handleEnter)
    			.on("mouseleave", this.handleLeave);
    	}
    }

    offListener = () => {
    	if (this.node) {
    		select(this.node)
    			.on("mouseenter", null)
    			.on("mouseleave", null);
    		select(d3Window(this.node))
    			.on("mousemove", null);
    	}
    }

    handleEnter = () => {
    	const e = d3Event;
    	this.mouseInside = true;
    	if (!this.state.panInProgress) {
    		select(d3Window(this.node))
    			.on("mousemove", this.handleMouseMove);
    	}
    	if (this.props.onMouseEnter)
    		this.props.onMouseEnter(e);
    }

    handleLeave = (e) => {
    	this.mouseInside = false;
    	if (!this.state.panInProgress) {
    		select(d3Window(this.node))
    			.on("mousemove", null);
    	}
    	if (this.props.onMouseLeave)
    		this.props.onMouseLeave(e);
    }

    handleWheel = (e) => {
    	e.preventDefault();
    	const mouseXY = mousePosition(e);
    	if (this.props.onZoom && !this.state.panInProgress) {
    	 	this.props.onZoom(mouseXY, e);
    	}
    }

    handleMouseMove = () => {
    	const e = d3Event;
    	if (!this.state.panInProgress && this.props.onMouseMove) {
    		const mouseXY = mouse(this.node);
    		this.props.onMouseMove(mouseXY, e);
    	}
    }

    handleMouseDown = (e) => {
    	if (e.button !== 0) return;
    	e.preventDefault();

    	const mouseXY = mousePosition(e);
    	this.panHappened = false;
    	if (!this.state.panInProgress) {

    		this.setState({
    			panInProgress: true,
    			panStart: {
    				panOrigin: mouseXY,
    			}
    		});

    		select(d3Window(this.node))
    			.on("mousemove", this.handlePan)
    			.on("mouseup", this.handlePanEnd);
    	}
    }

    handleRightClick = (e) => {
    	e.stopPropagation();
    	e.preventDefault();
    	const mouseXY = mousePosition(e);
    	if (!this.state.panInProgress) {
    		this.prev = mouseXY;
    		select(d3Window(this.node))
    			.on("mousemove", this.handleTrackMouse)
    			.on("mouseup", this.handleTrackMouseEnd);
    	}
    }

    handleTrackMouse = () => {
    	const e = d3Event;

    	const mouseXY = mouse(this.node);
    	if (this.props.onMouseTrack) {
    		this.props.onMouseTrack(this.prev.slice(), mouseXY, e);
    	}
    	this.prev = mouseXY;
    }

    handleTrackMouseEnd = () => {
    	const e = d3Event;

    	select(d3Window(this.node))
    		.on("mousemove", this.mouseInside ? this.handleMouseMove : null)
    		.on("mouseup", null);

    	this.prev = null;
    	if (this.props.onMouseTrackEnd)
    		this.props.onMouseTrackEnd(e);
    }

    handlePan = () =>{
    	const e = d3Event;

    	if (this.props.onPan && this.state.panStart) {
    		this.panHappened = true;
    		const { panOrigin } = this.state.panStart;
    		const mouseXY = mouse(this.node);

    		this.lastNewPos = mouseXY;
    		const dx = mouseXY[0] - panOrigin[0];
    		const dy = mouseXY[1] - panOrigin[1];

    		this.dx = dx;
    		this.dy = dy;

    		this.props.onPan(
    			mouseXY,
    			{ dx, dy },
    			e
    		);
    	}
    }

    handlePanEnd = () => {
    	const e = d3Event;

    	if (this.state.panStart) {
    		select(d3Window(this.node))
    			.on("mousemove", this.mouseInside ? this.handleMouseMove : null)
    			.on("mouseup", null);

    		if (this.panHappened && this.props.onPanEnd) {
    			const { dx, dy } = this;
    			delete this.dx;
    			delete this.dy;
    			this.props.onPanEnd(
    				this.lastNewPos,
    				{ dx, dy }, e);
    		}

    		this.setState({
    			panInProgress: false,
    			panStart: null
    		});
    	}
    }

    render() {
    	const className = this.state.panInProgress
    		? "react-multiview-grabbing-cursor"
    		: "react-multiview-crosshair-cursor";

    	return <rect
    		ref={node => this.node = node}
    		className={className}
    		width={this.props.width}
    		height={this.props.height}
    		style={{ fill: "red", opacity: 0. }}
    		onWheel={this.handleWheel}
    		onMouseDown={this.handleMouseDown}
    		onContextMenu={this.handleRightClick}
    	/>;
    }
}

EventHandler.propTypes = {
	width: PropTypes.number,
	height: PropTypes.number,

	mouseMove: PropTypes.bool,
	zoom: PropTypes.bool,
	pan: PropTypes.bool,
	panSpeedMultiplier: PropTypes.number,
	focus: PropTypes.bool,

	onDragComplete: PropTypes.func,
	onMouseEnter: PropTypes.func,
	onMouseLeave: PropTypes.func,
	onZoom: PropTypes.func,
	onMouseMove: PropTypes.func,
	onMouseTrack: PropTypes.func,
	onMouseTrackEnd: PropTypes.func,
	onPan: PropTypes.func,
	onPanEnd: PropTypes.func
};

EventHandler.defaultProps = {
	mouseMove: false,
	zoom: false,
	pan: false,
	panSpeedMultiplier: 1,
	focus: false,
	onDragComplete: () => {}
};

export default EventHandler;
