import React from "react";
import PropTypes from "prop-types";

import {
	select,
	event as d3Event,
	mouse,
} from "d3-selection";

import {
	mousePosition,
	touchPosition,
	getTouchProps,
	d3Window,
	MOUSEMOVE,
	MOUSEUP,
	MOUSEENTER,
	MOUSELEAVE,
} from "../utils";

class EventHandler extends React.Component {
	constructor() {
		super();
		this.mouseInside = false;
		this.state = {
            panInProgress: false,
            panStart: {
                panStartXScale: null,
                panOrigin: null,
                chartsToPan: null,
            }
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
    			.on(MOUSEENTER, this.handleEnter)
    			.on(MOUSELEAVE, this.handleLeave);
    	}
    }

    offListener = () => {
    	if (this.node) {
    		select(this.node)
    			.on(MOUSEENTER, null)
    			.on(MOUSELEAVE, null);
    	}
    }

    handleEnter = () => {
    	const e = d3Event;
    	this.mouseInside = true;
    	if (this.props.onMouseEnter)
    		this.props.onMouseEnter(e);
    }

    handleLeave = (e) => {
    	this.mouseInside = false;
    	if (this.props.onMouseLeave)
    		this.props.onMouseLeave(e);
    }

    // handleMouseMove = () => {
    // 	const e = d3Event;
    // 	if (this.mouseInteraction
    //         && this.props.mouseMove
    //         && !this.state.panInProgress
    // 	) {
    // 		const newPos = mouse(this.node);
    // 		if (this.props.onMouseMove)
    // 			this.props.onMouseMove(newPos, "mouse", e);
    // 	}
    // }

    handleWheel = (e) => {
        e.preventDefault();
        const mouseXY = mousePosition(e);
    	if (this.props.onZoom && !this.state.panInProgress) {
    	 	this.props.onZoom(mouseXY, e);
    	}
    }

    // canPan = () => {
    //     const { pan: initialPanEnabled } = this.props;

    //     const {
    //         panEnabled,
    //         draggable: somethingSelected
    //     } = this.props.getAllPanConditions()
    //             .reduce((obj, a) => {
    //                 return {
    //                     draggable: obj.draggable || a.draggable,
    //                     panEnabled: obj.panEnabled && a.panEnabled
    //                 };
    //             }, {
    //                 draggable: false,
    //                 panEnabled: initialPanEnabled
    //             });

    //     return {
    //         panEnabled,
    //         somethingSelected
    //     }
    // }

    handleMouseDown = (e) => {
        if (e.button !== 0) return;
        e.preventDefault();

        this.panHappened = false;
        if (!this.state.panInProgress) {
            const mouseXY = mousePosition(e);

            this.setState({
                panInProgress: true,
                panStart: {
                    panOrigin: mouseXY,
                }
            });

            select(d3Window(this.node))
                .on('mousemove.pan', this.handlePan)
                .on('mouseup.pan', this.handlePanEnd);
        }
    }

    // shouldPan = () => {
    //     return this.props.pan && this.props.onPan && this.state.panStart;
    // }

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
                .on('mousemove.pan', null)
                .on('mouseup.pan', null);

            if (this.panHappened && this.props.onPanEnd) {
                const { dx, dy } = this;
                delete this.dx;
                delete this.dy;
                this.props.onPanEnd(
                    this.lastNewPos,
                    {dx, dy}, e);
            }

            this.setState({
                panInProgress: false,
                panStart: null
            });
        }
    }

    render() {
        const className = this.state.panInProgress
            ? 'react-multiview-grabbing-cursor'
            : 'react-multiview-crosshair-cursor';

    	return <rect
            ref={node => this.node = node}
            className={className}
    		width={this.props.width}
    		height={this.props.height}
    		style={{ fill: "red", opacity: 0. }}
            onWheel={this.handleWheel}
            onMouseDown={this.handleMouseDown}
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
