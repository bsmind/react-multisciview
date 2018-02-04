import React from "react";
import PropTypes from "prop-types";

import uniqueId from "lodash.uniqueid";


class SubscriberExt extends React.Component {
	constructor() {
		super();

		this.state = {
			id: uniqueId("subscriber-")
		};
		this.moreProps = {};
	}

	componentWillMount() {
		const { subscribe } = this.props.shared;
		const { clip, edgeClip } = this.props;

		subscribe(this.state.id, {
			clip,
			edgeClip,
			listener: this.listener,
			draw: this.draw,
		});
	}

	componentWillUnmount() {
		const { unsubscribe } = this.props.shared;
		unsubscribe(this.state.id);
	}

	componentDidMount() {
		this.handleDraw();
	}

	componentDidUpdate() {
		this.handleDraw();
	}

	componentWillReceiveProps(nextProps) {
		const {
			plotData,
			xAttr, yAttr, zAttr,
			dataExtents, hitTest, enableHitTest,
			zoomFactor
		} = nextProps.shared;

		this.moreProps = {
			...this.moreProps,
			xAttr,
			yAttr,
			zAttr,
			plotData,
			dataExtents,
			hitTest, enableHitTest,
			zoomFactor
		};
	}

    updateMoreProps = (moreProps) => {
    	Object.keys(moreProps).forEach(key => {
    		this.moreProps[key] = moreProps[key];
    	});
    }

    listener = (type, moreProps/* , state , e*/) => {
    	if (moreProps) {
    		this.updateMoreProps(moreProps);
    	}
    }

    draw = ({ trigger, force } = { force: false }) => {
    	const type = trigger;
    	const proceed = this.props.drawOn.indexOf(type) > -1;

    	if (proceed || force) {
    		this.handleDraw();
    	}
    }

    getMoreProps = () => {
    	const { shared } = this.props;

    	const {
    		xAttr,
    		yAttr,
    		zAttr,
    		plotData,
    		dataExtents,
    		hitTest,
			zoomFactor,
			enableHitTest
    	} = shared;

    	return {
    		xAttr,
    		yAttr,
    		zAttr,
    		plotData,
    		dataExtents,
    		hitTest,
			zoomFactor,
			enableHitTest,
    		...this.moreProps
    	};
    }

    handleDraw = (props = this.props) => {
    	const { draw, canvas } = props;
    	const { getCanvasContexts } = props.shared;

    	const moreProps = this.getMoreProps();
    	const ctx = canvas(getCanvasContexts());
    	this.preDraw(ctx, moreProps);
    	if (draw) draw(ctx, moreProps);
    	this.postDraw(ctx, moreProps);
    }

    preDraw = (ctx) => {
    	ctx.save();

    	const { edgeClip, clip } = this.props;
    	const { margin, ratio, canvasDim: { width, height } } = this.props.shared;

    	const canvasOriginX = margin.left;
    	const canvasOriginY = margin.top;

    	ctx.setTransform(1, 0, 0, 1, 0, 0);
    	ctx.scale(ratio, ratio);
    	if (edgeClip) {
    		console.log("SubscriberExt::preDraw::edgeClip");
    	}
    	ctx.translate(canvasOriginX, canvasOriginY);
    	if (clip) {
    		ctx.beginPath();
    		ctx.rect(0, 0, width, height);
    		ctx.clip();
    	}
    }

    postDraw = (ctx) => {
    	ctx.restore();
    }

    render() {
    	const { drawSVG, useSVG } = this.props;

    	if (drawSVG && useSVG) {
    		return <g style={{ clipPath: "url(#chart-area-clip)" }}>
    			{drawSVG(this.getMoreProps())}
    		</g>;
    	} else {
    		return null;
    	}
    }
}

SubscriberExt.propTypes = {
	clip: PropTypes.bool,
	edgeClip: PropTypes.bool,
	selected: PropTypes.bool,
	disablePan: PropTypes.bool,

	drawSVG: PropTypes.func,
	shared: PropTypes.shape({
		subscribe: PropTypes.func,
		unsubscribe: PropTypes.func,
		getCanvasContexts: PropTypes.func,
		margin: PropTypes.shape({
			left: PropTypes.number,
			right: PropTypes.number,
			top: PropTypes.number,
			bottom: PropTypes.number
		}),
		ratio: PropTypes.number,
		canvasDim: PropTypes.shape({
			width: PropTypes.number,
			height: PropTypes.number
		})
	}),
	drawOn: PropTypes.arrayOf(PropTypes.string),
	draw: PropTypes.func,
	canvas: PropTypes.func,
	useSVG: PropTypes.bool
};

SubscriberExt.defaultProps = {
	clip: false,
	edgeClip: false,
	selected: false,
	disablePan: false,

	drawSVG: null
};

export default SubscriberExt;
