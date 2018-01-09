import Subscriber from "./Subscriber";
import PropTypes from "prop-types";

class SubscriberExtend extends Subscriber {
	constructor(props) {
		super(props);
	}

    preDraw = (ctx, moreProps) => {
    	// super.preDraw(ctx, moreProps);
    	// console.log('SubscriberExtend::preDraw')
    	ctx.save();

    	const contextProps = this.props.contextProps;
    	const { margin, ratio, origin } = contextProps;

    	const canvasOriginX = origin.x + margin.left;
    	const canvasOriginY = origin.y + margin.top;

    	ctx.setTransform(1, 0, 0, 1, 0, 0);
    	ctx.scale(ratio, ratio);
    	if (this.props.edgeClip) {
    		console.log("SubscriberExtend::preDraw::edgeClip");
    	}

    	ctx.translate(canvasOriginX, canvasOriginY);

    	if (this.props.clip && this.props.chartConfig) {
    		// console.log('SubscriberExtend::preDraw::clip');
    		// console.log(this.props.chartConfig)
    		const { origin, width, height } = this.props.chartConfig;
    		const { x, y } = origin;
    		ctx.beginPath();
    		ctx.rect(x - 1, y - 1, width + 1, height + 1);
    		ctx.clip();
    	}

    	// console.log(this.props)
    }

    postDraw = (ctx, moreProps) => {
    	// super.postDraw(ctx, moreProps);
    	ctx.restore();

    	// console.log('SubscriberExtend::postDraw')
    }

    updateMoreProps = (moreProps) => {

    }

    preEvaluate = () => {

    }

    shouldTypeProceed = (type, moreProps) => {

    }
}

// SubscriberExtend.propTypes = Subscriber.propTypes;
// SubscriberExtend.defaultProps = Subscriber.defaultProps;

export default SubscriberExtend;