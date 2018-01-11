import React from 'react';
import PropTypes from 'prop-types';

import uniqueId from 'lodash.uniqueid';

class PCPSubscriberExt extends React.Component {
    constructor() {
        super();
        this.state = {
            id: uniqueId('pcp-subscriber-')
        }
        this.moreProps = {}
    }

    componentWillMount() {
        //console.log(this.props)
        const { subscribe } = this.props.shared;
        const { clip, edgeClip } = this.props;

        subscribe(this.state.id, {
            chartId: 'pcp',
            clip,
            edgeClip,
            listener: this.listener,
            draw: this.draw,
            //getPanConditions: this.getPanConditions
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
        return {
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
        const { margin, ratio, chartWidth, chartHeight } = this.props.shared;
        //const { origin, width, height } = this.props.chartConfig;

        const canvasOriginX = 0 + margin.left;
        const canvasOriginY = 0 + margin.top;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(ratio, ratio);
        if (edgeClip) {
            console.log('SubscriberExt::preDraw::edgeClip');
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

    }

    listener = () => {

    }

    draw = () => {

    }

    render () {
        return <g/>
    }
}

export default PCPSubscriberExt;