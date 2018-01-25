import React from "react";
import PropTypes from "prop-types";

import uniqueId from "lodash.uniqueid";

class PCPSubscriberExt extends React.Component {
	constructor() {
		super();
		this.state = {
			id: uniqueId("pcp-subscriber-")
		};
		this.moreProps = {};
	}

	componentWillMount() {
		// console.log(this.props)
		const { subscribe } = this.props.shared;
		const { clip, edgeClip } = this.props;

		subscribe(this.state.id, {
			chartId: "pcp",
			clip,
			edgeClip,
			listener: this.listener,
			draw: this.draw,
			// getPanConditions: this.getPanConditions
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

    getMoreProps = () => {
    	const { shared, dimConfig } = this.props;

    	return {
    		...shared,
    		dimConfig,
    		...this.moreProps
    	};
    }

    handleDraw = (props = this.props) => {
    	const { draw, canvas } = props;
    	const { getCanvasContexts } = props.shared;

    	const moreProps = this.getMoreProps();
    	const ctx = canvas(getCanvasContexts());
    	this.preDraw(ctx, moreProps);
    	draw(ctx, moreProps);
    	this.postDraw(ctx, moreProps);
    }

    preDraw = (ctx) => {
    	ctx.save();

    	const { edgeClip, clip } = this.props;
    	const { margin, ratio, chartWidth, chartHeight } = this.props.shared;
    	// const { origin, width, height } = this.props.chartConfig;

    	const canvasOriginX = 0 + margin.left;
    	const canvasOriginY = 0 + margin.top;

    	ctx.setTransform(1, 0, 0, 1, 0, 0);
    	ctx.scale(ratio, ratio);
    	if (edgeClip) {
    		console.log("SubscriberExt::preDraw::edgeClip");
    	}
    	ctx.translate(canvasOriginX, canvasOriginY);
    	if (clip) {
    		ctx.beginPath();
    		ctx.rect( - 1, - 1, chartWidth + 1, chartHeight + 1);
    		ctx.clip();
    	}
    }

    postDraw = (ctx) => {
    	ctx.restore();
    }

    componentWillReceiveProps(nextProps) {
    	const { shared, dimConfig } = nextProps;

    	this.moreProps = {
    		...this.moreProps,
    		...shared,
    		dimConfig
    	};
    }

    updateMoreProps = (moreProps) => {
    	Object.keys(moreProps).forEach(key => {
    		this.moreProps[key] = moreProps[key];
    	});

    	const { dimConfig: dimConfigList } = moreProps;
    	if (dimConfigList) {
    		if (this.props.useAllDim) {
    			// do nothing
    		} else {
    			const { title: axisTitle } = this.props.dimConfig;
    			const dimConfig = dimConfigList[axisTitle];
    			this.moreProps.dimConfig = dimConfig;
    		}
    	}
    }

    listener = (type, moreProps/* , state, e*/) => {
    	if (moreProps) {
    		this.updateMoreProps(moreProps);
    	}
    	// this.evalInProgress = true;
    	// this.evalType(type, e);
    	// this.evalInProgress = false;
    }

    draw = ({ trigger, force } = { force: false }) => {
    	const type = trigger;// aliases[trigger] || trigger;
    	const proceed = this.props.drawOn.indexOf(type) > -1;

    	if (proceed || force) {
    		this.handleDraw();
    	}
    }

    render() {
    	return <g/>;
    }
}

PCPSubscriberExt.propTypes = {
	shared: PropTypes.shape({
		subscribe: PropTypes.func,
		unsubscribe: PropTypes.func,
		getCanvasContexts: PropTypes.func,
		margin: PropTypes.shape({
			left: PropTypes.number,
			right: PropTypes.number,
			top: PropTypes.number,
			bottom: PropTypes.number,
		}),
		ratio: PropTypes.number,
		chartWidth: PropTypes.number,
		chartHeight: PropTypes.number,
	}),
	useAllDim: PropTypes.bool,
	clip: PropTypes.bool,
	edgeClip: PropTypes.bool,
	dimConfig: PropTypes.object,
	draw: PropTypes.func,
	canvas: PropTypes.func,
	drawOn: PropTypes.arrayOf(PropTypes.string)
};

export default PCPSubscriberExt;