import React from "react";
import PropTypes from "prop-types";

import { select, event as d3Event, mouse, touches } from "d3-selection";
import { mean } from "d3-array";

const d3Window = node => {
	return (node
        && (node.ownerDocument && node.ownerDocument.defaultView)
            || (node.document && node)
            || node.defaultView
	);
};

const mousePosition = (e, defaultRect) => {
	const container = e.currentTarget;
	const rect = defaultRect || container.getBoundingClientRect(),
		x = e.clientX - rect.left - container.clientLeft,
		y = e.clientY - rect.top - container.clientTop,
		xy = [Math.round(x), Math.round(y)];
	return xy;
};

const sign = (x) => (x > 0) - (x < 0);

const MOUSEMOVE = "mousemove.pan";
const MOUSEUP = "mouseup.pan";

class AxisEventHandler extends React.Component {
	constructor() {
		super();
		this.state = {
			startPos: null
		};
		this.mouseInteraction = false;
	}

    handleDragStartMouse = (e) => {
    	e.preventDefault();

    	this.mouseInteraction = true;
    	const { scale } = this.props;
    	const startScale = scale.copy();
    	this.dragHappened = false;

    	if (startScale.invert) {
    		select(d3Window(this.node))
    			.on(MOUSEMOVE, this.handleDrag, false)
    			.on(MOUSEUP, this.handleDragEnd, false);

    		const startXY = mousePosition(e);
    		// console.log(startScale.invert(startXY[0]))
    		this.setState({
    			startPos: {
    				startXY,
    				startScale
    			}
    		});
    	}
    	// console.log('handleDragStartMouse')
    }

    handleDrag = () => {
    	const { startPos } = this.state;
    	// console.log(e)

    	this.dragHappened = true;
    	if (startPos) {
    		const { startScale, startXY } = startPos;
    		const { getMouseDelta, getInverted, scale } = this.props;
    		const mouseXY = this.mouseInteraction ? mouse(this.node) : null;
    		const diff = getMouseDelta(startXY, mouseXY);

            const SCALE_FACTOR = 0.005;
            const zoomFactor = Math.max(Math.min(1 + diff * SCALE_FACTOR, 3), 0.1);
            const center = getInverted(startScale, startXY),
                  begin = startScale.domain()[0],
                  end = startScale.domain()[1];

            const newDomain = [
                center - (center - begin)*zoomFactor,
                center + (end - center)*zoomFactor
            ];

            //console.log(zoomFactor, diff)

    		if (this.props.onDomainChange) {
    			this.props.onDomainChange(newDomain);
    		}
    	}
    }

    handleDragEnd = () => {
    	if (!this.dragHappened) {
    		if (this.clicked) {

    		} else {
    			this.clicked = true;
    			setTimeout(() => {
    				this.clicked = false;
    			}, 300);
    		}
    	}

    	// console.log('handleDragEnd');
    	select(d3Window(this.node))
    		.on(MOUSEMOVE, null)
    		.on(MOUSEUP, null);

    	this.setState({
    		startPos: null
    	});
    }

    render() {

        const cursor = this.state.startPos
            ? this.props.zoomCursorClassName
            : 'react-multiview-default-cursor';

    	return <rect
    		ref={node => this.node = node}
    		className={`react-multiview-enable-interaction ${cursor}`}
    		x={this.props.x}
    		y={this.props.y}
    		width={this.props.width}
    		height={this.props.height}
    		style={{ fill: "green", opacity: 0. }}
    		onMouseDown={this.handleDragStartMouse}
    	/>;
    }
}

AxisEventHandler.propTypes = {};
AxisEventHandler.defaultProps = {};

export default AxisEventHandler;
