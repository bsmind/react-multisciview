import React from "react";
import PropTypes from "prop-types";

import {
	select,
	event as d3Event,
	mouse,
	touch
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
	TOUCHMOVE,
    TOUCHEND
} from "../utils";

import {
    getCurrentCharts
} from '../core/utils';

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

    // handleMouseDown = (e) => {
    //     if (e.button !== 0) return;
    //     e.preventDefault();

    //     this.panHappened = false;
    //     this.dragHappeded = false;
    //     this.focus = true;
    //     if (!this.state.panInProgress && this.mouseInteraction) {
    //         const mouseXY = mousePosition(e);
    //         const currentCharts = getCurrentCharts(this.props.chartConfig, mouseXY);

    //         //console.log(currentCharts, this.props.chartConfig, mouseXY)
    //         const {panEnabled, somethingSelected} = this.canPan();
    //         const pan = panEnabled && !somethingSelected;

    //         if (pan) {
    //             this.setState({
    //                 panInProgress: pan,
    //                 panStart: {
    //                     panStartXScale: this.props.xScale,
    //                     panOrigin: mouseXY,
    //                     chartsToPan: currentCharts
    //                 }
    //             });

    //             select(d3Window(this.node))
    //                 .on(MOUSEMOVE, this.handlePan)
    //                 .on(MOUSEUP, this.handlePanEnd);

    //         } else if (somethingSelected) {
    //             // something selected.. dragging
    //             console.log('EventHandler::handleMouseDown::Drag')
    //         }

    //         if (this.props.onMouseDown)
    //             this.props.onMouseDown(mouseXY, currentCharts, e);
    //     }
    // }

    // shouldPan = () => {
    //     return this.props.pan && this.props.onPan && this.state.panStart;
    // }

    // handlePan = () =>{
    //     const e = d3Event;

    //     if (this.shouldPan()) {
    //         this.panHappened = true;
    //         const { panStartXScale, panOrigin, chartsToPan } = this.state.panStart;
    //         const mouseXY = this.mouseInteraction
    //             ? mouse(this.node)
    //             : touch(this.node)[0];

    //         this.lastNewPos = mouseXY;
    //         const dx = mouseXY[0] - panOrigin[0];
    //         const dy = mouseXY[1] - panOrigin[1];

    //         this.dx = dx;
    //         this.dy = dy;

    //         this.props.onPan(
    //             mouseXY,
    //             panStartXScale,
    //             { dx, dy },
    //             chartsToPan,
    //             e
    //         );
    //     }
    // }

    // handlePanEnd = () => {
    //     const e = d3Event;

    //     if (this.state.panStart) {
    //         select(d3Window(this.node))
    //             .on(MOUSEMOVE, this.mouseInside ? this.handleMouseMove: null)
    //             .on(MOUSEUP, null);
    //             //.on(TOUCHMOVE, null)
    //             //.on(TOUCHEND, null);

    //         if (this.panHappened && this.props.pan) {
    //             const { dx, dy } = this;
    //             delete this.dx;
    //             delete this.dy;
    //             if (this.props.onPanEnd)
    //                 this.props.onPanEnd(
    //                     this.lastNewPos,
    //                     this.state.panStart.panStartXScale,
    //                     {dx, dy},
    //                     this.state.panStart.chartsToPan,
    //                     e
    //                 );
    //         }

    //         this.setState({
    //             panInProgress: false,
    //             panStart: null
    //         });
    //     }
    // }

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
            //onMouseDown={this.handleMouseDown}
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
