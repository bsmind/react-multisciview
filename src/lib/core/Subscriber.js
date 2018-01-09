import React from "react";
import PropTypes from "prop-types";

const aliases = {
	mouseleave: "mousemove", // to draw interactive after mouse exit
	panend: "pan",
	pinchzoom: "pan",
	mousedown: "mousemove",
	click: "mousemove",
	contextmenu: "mousemove",
	doubleclick: "mousemove",
	dragstart: "drag",
	dragend: "drag",
	dragcancel: "drag"
};

class Subscriber extends React.Component {
	constructor(props) {
		super(props);

		// this.suscriberId = props.generateSubscriptionId();
		const contextProps = props.contextProps;
		const { generateSubscriptionId } = contextProps;

		// maybe.. state and generate unique id using lodash
		this.suscriberId = generateSubscriptionId();
		this.moreProps = {}; // maybe not needed...
	}

	//
	// component...
	//
	componentWillMount() {
		const { subscribe, chartId } = this.props.contextProps;
		const { clip, edgeClip } = this.props;

		subscribe(this.suscriberId, {
			chartId,
			clip,
			edgeClip,
			listener: this.listener,
			draw: this.draw,
			// getPanConditions: this.getPanConditions
		});
		this.updateMoreProps();
	}

	componentWillUnmount() {
		const { unsubscribe } = this.props.contextProps;
		unsubscribe(this.suscriberId);
	}

	componentDidMount() {
		// this.componentDidUpdate(this.props);
		this.handleDraw();
	}

	componentDidUpdate(prevProps) {
		// this.handleDrawOnCanvas
		const { draw } = this.props;
		if (draw) {
			this.handleDraw();
		}
	}

	componentWillReceiveProps(nextProps) {
		// update moreProps..
		this.updateMoreProps(nextProps);
	}

    updateMoreProps = (props = this.props) => {
    	const { getMutableState } = props.contextProps;
    	this.moreProps = {
    		...this.moreProps,
    		...getMutableState(),
    		// xScale, plotData, chartConfig
    	};
    }

    preEvaluate = () => {

    }

    shouldTypeProceed = () => {
    	return true;
    }

    handleDraw = (props = this.props) => {
    	const { draw, canvas } = props;
    	const { getCanvasContexts } = props.contextProps;
    	const moreProps = this.moreProps; // this.getMoreProps();

    	const ctx = canvas(getCanvasContexts());

    	this.preDraw(ctx, moreProps);
    	draw(ctx, moreProps);
    	this.postDraw(ctx, moreProps);
    }

    //
    // listener
    //
    listener = (type, moreProps, state, e) => {
    	// console.log(type, moreProps, state, e);
    	if (moreProps) {
    		this.updateMoreProps(moreProps);
    	}
    	this.evalInProcess = true;
    	this.evalType(type, e);
    	this.evalInProcess = false;
    }

    evalType = (type, e) => {
    	const t = aliases[type] || type;
    	const proceed = this.props.drawOn.indexOf(t) > -1;

    	console.log(type, proceed);
    	if (!proceed) return;

    	switch (t) {
    	case "zoom": break;
    	case "mouseenter": break;
    	case "mouseleave": break;
    	case "pan": {
    		this.moreProps.hovering = false;
    		if (this.props.onPan)
    			this.props.onPan(this.moreProps, e);
    	}
    	}
    }

    //
    // draw
    //
    draw = ({ trigger, force } = { force: false }) => {
    	console.log("subscriber::draw -> ", trigger, force);

    	const t = aliases[trigger] || trigger;
    	const proceed = this.props.drawOn.indexOf(t) > -1;

    	if (proceed || force) {
    		if (this.props.draw)
    			this.draw();
    	}
    }

    preDraw = (ctx, moreProps) => {
    	// do nothing, see SubscriberExtend
    }

    postDraw = (ctx, moreProps) => {
    	// do nothing, see SubscriberExtend
    }


    render() {
    	// console.log(this.props)
    	return null;
    }
}

export default Subscriber;