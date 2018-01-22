import React from "react";
import PropTypes from "prop-types";

class CanvasContainer extends React.Component {
	constructor() {
		super();
		this.canvas = {};
	}

    setCanvas = (node) => {
    	if (node) this.canvas[node.id] = node.getContext("2d");
    	else this.canvas = {};
    }

    getCanvas = () => {
    	if (this.canvas.axes) return this.canvas;
    }

    render() {
    	const { width, height, zIndex, ratio } = this.props;

    	const divStyle = {
    		position: "absolute",
    		zIndex: zIndex
    	};

    	const canvasStyle = {
    		position: "absolute",
    		width: width + 'px',
    		height: height + 'px'
    	};
    	const canvasWidth = width * ratio;
    	const canvasHeight = height * ratio;

    	return (
    		<div style={divStyle}>
    			<canvas id="chartOn" ref={this.setCanvas} width={canvasWidth} height={canvasHeight} style={canvasStyle} />
    			<canvas id="axes" ref={this.setCanvas} width={canvasWidth} height={canvasHeight} style={canvasStyle} />
    			<canvas id="mouseCoord" ref={this.setCanvas} width={canvasWidth} height={canvasHeight} style={canvasStyle} />
    		</div>
    	);
    }
}

CanvasContainer.propTypes = {
	width: PropTypes.number,
	height: PropTypes.number,
	zIndex: PropTypes.number,
	ratio: PropTypes.number
};

export default CanvasContainer;
