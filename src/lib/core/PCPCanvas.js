import React from 'react';
import PropTypes from 'prop-types';

import CanvasContainer from './CanvasContainer';
import { PCPYAxis } from '../axes'

import {
    dimension as getCanvasDimension,
} from './utils';

import {
    functor,
    isArrayOfString
} from '../utils';



import { scalePoint } from 'd3-scale';

class PCPCanvas extends React.Component {
    constructor() {
        super();

        this.mutableState = {};
        this.subscriptions = [];
    }
    getCanvasContexts = () => {
    	if (this.canvasContainerNode)
    		return this.canvasContainerNode.getCanvas();
    }

    getMutableState = () => {
    	return this.mutableState;
    }

    clearThreeCanvas = () => {
    	const canvases = this.getCanvasContexts();
    	if (canvases && canvases.axes) {
    		clearCanvas([
    			canvases.axes,
    			canvases.mouseCoord,
    			canvases.bg
    		], this.props.ratio);
    	}
    }

    clearBothCanvas = () => {
        const canvases = this.getCanvasContexts();
        if (canvases && canvases.axes) {
            clearCanvas([
                canvases.axes,
                canvases.mouseCoord
            ], this.props.ratio);
        }
    }

    generateSubscriptionId = () => {
    	this.lastSubscriptionId++;
    	return this.lastSubscriptionId;
    }

    subscribe = (id, rest) => {
        // getPanConditions
		const { getPanConditions = functor({
			draggable: false,
			panEnabled: true,
		}) } = rest;

    	this.subscriptions = this.subscriptions.concat({
    		id,
    		...rest,
    		getPanConditions
    	});
        //console.log('subscribe: ', this.subscriptions)
        //console.log(getPanConditions())
    }

    unsubscribe = (id) => {
    	this.subscriptions = this.subscriptions.filter(each => each.id !== id);
    }


    resetChart = (props = this.props) => {

    }

    componentWillMount() {

    }

    componentWillReceiveProps(nextProps) {

    }

    shouldComponentUpdate() {
        return true;
    }



    render() {
    	const divStyle = {
    		position: "relative",
    		width: this.props.width,
    		height: this.props.height
    	};

    	const svgStyle = {
    		position: "absolute",
    		zIndex: (this.props.zIndex + 5)
    	};

        const {
            dimName, 
            dimExtents,
            dimAccessor,
            margin, width, height, ratio} = this.props;
        const canvasDim = getCanvasDimension(this.props);

        const xScale = scalePoint()
                        .domain(dimName)
                        .range([0, canvasDim.width])
                        .padding(0);

        const shared = {
            margin,
            ratio,

            chartWidth: canvasDim.width,
            chartHeight: canvasDim.height,


            subscribe: this.subscribe,
            unsubscribe: this.unsubscribe,
            getCanvasContexts: this.getCanvasContexts
        }

        //console.log(this.props.dimension)

        const pcpYAxisList = dimName.map(name => {
            const axisExtents = dimAccessor(dimExtents, name);
            return (
                <PCPYAxis key={`pcp-yaxis-${name}`}
                    title={name}
                    axisLocation={xScale(name)}
                    extents={dimAccessor(dimExtents, name)}
                    axisWidth={25}
                    height={canvasDim.height}
                    orient={'left'}
                    ordinary={isArrayOfString(axisExtents)}
                    shared={shared}
                />
            );
        });


        return (
            <div
                style={divStyle}
                className={""}
            >
                <CanvasContainer
                    ref={node => this.canvasContainerNode = node}
                    ratio={this.props.ratio}
                    width={width}
                    height={height}
                    zIndex={1}
                />
                <svg
                    className={""}
                    width={width}
                    height={height}
                    style={svgStyle}
                >
                    <g transform={`translate(${margin.left},${margin.top})`}>
                        {/* <EventHandler /> */}
                        <g>
                            {pcpYAxisList}
                        </g>
                    </g>
                </svg>
            </div>
        );
    }
}

export default PCPCanvas;