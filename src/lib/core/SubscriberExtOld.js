import React from 'react';
import PropTypes from 'prop-types';

import uniqueId from 'lodash.uniqueid';

const aliases = {
	mouseleave: "mousemove", // to draw interactive after mouse exit
	panend: "pan",
	pinchzoom: "pan",
	mousedown: "mousemove",
	click: "mousemove",
	contextmenu: "mousemove",
	dblclick: "mousemove",
	dragstart: "drag",
	dragend: "drag",
	dragcancel: "drag",
};

const ALWAYS_TRUE_TYPES = [
	"drag",
	"dragend"
];

class SubscriberExt extends React.Component {
    constructor() {
        super();

        this.state = {
            id: uniqueId('subscriber-')
        }
        this.moreProps = {
            hovering: false
        };
    }

    getPanConditions = () => {
        const draggable = this.props.selected && this.moreProps.hovering;

        return {
            draggable,
            panEnabled: !this.props.disablePan
        };
    }

    componentWillMount() {
        const { subscribe } = this.props.shared;
        const { id } = this.props.chartConfig;
        const { clip, edgeClip } = this.props;

        subscribe(this.state.id, {
            chartId: id,
            clip,
            edgeClip,
            listener: this.listener,
            draw: this.draw,
            getPanConditions: this.getPanConditions
        });
    }

    componentWillUnmount() {
        const { unsubscribe } = this.props.shared;
        unsubscribe(this.state.id);
    }

    componentDidMount() {
        this.handleDraw();
    }

    componentDidUpdate(prevProps) {
        this.handleDraw();
    }

    componentWillReceiveProps(nextProps) {
        const { xScale, plotData } = nextProps.shared;
        const { chartConfig } = nextProps;

        //console.log('SubscriberExt:newProps ', plotData, xScale.domain())

        this.moreProps = {
            ...this.moreProps,
            // ...getMutableState(),
            xScale,
            plotData,
            chartConfig
        }
    }

    updateMoreProps = (moreProps) => {
        Object.keys(moreProps).forEach(key => {
            this.moreProps[key] = moreProps[key];
        });

        const { chartConfig: chartConfigList } = moreProps;
        if (chartConfigList) {
            const {id: chartId} = this.props.chartConfig;
            const chartConfig = chartConfigList.find(each => each.id === chartId);
            this.moreProps.chartConfig = chartConfig;
        }
    }

    // when an event is triggered (from ChartCanvas),
    // 1. update moreProps..
    // 2. evaluate event type and do something (other than draw)
    listener = (type, moreProps, state, e) => {
        //console.log(type, moreProps, state)
        if (moreProps) {
            this.updateMoreProps(moreProps);
        }
        this.evalInProgress = true;
        this.evalType(type, e);
        this.evalInProgress = false;
    }

    shouldTypeProceed = (type, moreProps) => {
        if (
            (type === 'mousemove' || type === 'click')
            && this.props.disablePan
        ) {
            return true;
        }

        if (
            ALWAYS_TRUE_TYPES.indexOf(type) === -1
            && moreProps
            && moreProps.currentCharts
        ) {
            return (moreProps.currentCharts.indexOf(this.props.chartConfig.id) > -1);
        }

        return true;
    }

    evalType = (type, e) => {
        const newType = aliases[type] || type;
        //console.log(newType, this.props)
        const proceed = this.props.drawOn.indexOf(newType) > -1;

        if (!proceed) return;

        //this.preEval(type, this.moreProps, e);
        if (!this.shouldTypeProceed(type, this.moreProps)) return;

        switch (type) {
            case 'pan': {
                this.moreProps.hovering = false;
                if (this.props.onPan)
                    this.props.onPan(/*this.getMoreProps(), e*/);
                break;
            }

            case 'panend': {
                if (this.props.onPanEnd)
                    this.props.onPanEnd(/*this.getMoreProps(), e*/)
                break;
            }

            case 'drag': break;
            case 'dragend': break;
            case 'dragcancel': break;

            case 'contextmenu': break;
            case 'mousedown': break;
            case 'click': break;
            case 'mousemove': break;
            case 'dblclick': break;

            case 'zoom':
            case 'mouseenter':
            default: break;
        }
    }

    draw = ({trigger, force} = {force: false}) => {
        const type = aliases[trigger] || trigger;
        const proceed = this.props.drawOn.indexOf(type) > -1;

        if (proceed || this.props.selected || force) {
            this.handleDraw();
        }
    }

    getMoreProps = () => {
        const {shared, chartConfig} = this.props;

        const {
            xScale,
            xAccessor,
            plotData
        } = shared;

        return {
            xScale,
            xAccessor,
            plotData,
            chartConfig,
            ...this.moreProps
        }
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
        const { margin, ratio } = this.props.shared;
        const { origin, width, height } = this.props.chartConfig;

        const canvasOriginX = origin.x + margin.left;
        const canvasOriginY = origin.y + margin.top;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(ratio, ratio);
        if (edgeClip) {
            console.log('SubscriberExt::preDraw::edgeClip');
        }
        ctx.translate(canvasOriginX, canvasOriginY);
        if (clip) {
            ctx.beginPath();
            ctx.rect(origin.x - 1, origin.y - 1, width + 1, height + 1);
            ctx.clip();
        }
    }

    postDraw = (ctx) => {
        ctx.restore();
    }

    render () {
        //console.log(this.state, this.props);
        return null;
    }
}

SubscriberExt.propTypes = {
    clip: PropTypes.bool,
    edgeClip: PropTypes.bool,
    selected: PropTypes.bool,
    disablePan: PropTypes.bool
}

SubscriberExt.defaultProps = {
    clip: false,
    edgeClip: false,
    selected: false,
    disablePan: false
}

export default SubscriberExt;
