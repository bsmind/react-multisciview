import React from 'react';
import PropTypes from 'prop-types';

import CanvasContainer from './CanvasContainer';
import { PCPYAxis } from '../axes';
import { PCPPolyLineSeries } from '../series';

import {
    dimension as getCanvasDimension,
    clearCanvas
} from './utils';

import {
    functor,
    isArrayOfString,
    hexToRGBA
} from '../utils';

import forEach from 'lodash.foreach';



import { scalePoint, scaleLinear } from 'd3-scale';

class PCPCanvas extends React.Component {
    constructor() {
        super();

        this.mutableState = {};
        this.subscriptions = [];
        this.state = {
            xScale: null,
            dimConfig: {}
        };
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
        const {
            dimName,
            dimExtents,
            dimAccessor,
            data,
            colorAccessor,
            opacity
        } = props;

        const canvasDim = getCanvasDimension(props);
        const xScale = scalePoint()
                        .domain(dimName)
                        .range([0, canvasDim.width])
                        .padding(0);
        
        // getDimConfig
        const dimConfig = {}; 
        dimName.forEach(name => {
            const axisExtents = dimAccessor(dimExtents, name);
            const ordinary = isArrayOfString(axisExtents);

            const yScale = scaleLinear();
            const domain = ordinary ? [0, axisExtents.length] : axisExtents;
            yScale.domain(domain)
                  .range([canvasDim.height, 0]);

            const yStep = ordinary ? Math.abs(yScale(0) - yScale(1)) : 0;
            dimConfig[name] = {
                title: name,
                extents: axisExtents,
                ordinary,
                scale: yScale,
                step: yStep,
                active: true,
                flip: false,
                position: xScale(name)
            }
        });
        // end of getDimConfig

        // calculateDataFromNewDimConfig
        //console.log(data)
        const plotData = data.map(d => {
            const points = dimName.map(name => {
                const {
                    position: x, 
                    scale,
                    ordinary,
                    extents,
                    step
                } = dimConfig[name];

                const yValue = dimAccessor(d, name);
                const y = ordinary
                    ? scale(extents.findIndex(v => v === yValue)) - step/2
                    : scale(yValue);

                return [x, y];
            });
            points.stroke = hexToRGBA(colorAccessor(d), opacity);
            points.strokeWidth = 1;
            return points;
        });
        //console.log(plotData)
        // end

        return {
            xScale,
            dimConfig,
            plotData
        }
    }

    componentWillMount() {
        const state = this.resetChart();
        this.setState(state);
    }

    componentWillReceiveProps(nextProps) {
        const newState = this.resetChart(nextProps);

        this.clearThreeCanvas();
        this.setState(newState);
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
            margin,
            ratio,
            width,
            height,
            zIndex,
        } = this.props;
        const canvasDim = getCanvasDimension({width, height, margin});

        const shared = {
            margin,
            ratio,

            chartWidth: canvasDim.width,
            chartHeight: canvasDim.height,

            subscribe: this.subscribe,
            unsubscribe: this.unsubscribe,
            getCanvasContexts: this.getCanvasContexts,

            xScale: this.state.xScale
        }

        const pcpYAxisList = [];
        forEach(this.state.dimConfig, (config, title) => {
            if (!config.active) return;
            pcpYAxisList.push( <PCPYAxis key={`pcp-yaxis-${title}`}
                title={title}
                axisLocation={config.position}
                axisWidth={25}
                height={canvasDim.height}
                orient={'left'}
                shared={shared}
                ordinary={config.ordinary}
                config={config}
            />);
        });

        return (
            <div
                style={divStyle}
                className={""}
            >
                <CanvasContainer
                    ref={node => this.canvasContainerNode = node}
                    ratio={ratio}
                    width={width}
                    height={height}
                    zIndex={zIndex}
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
                            <PCPPolyLineSeries 
                                data={this.state.plotData}
                                //dimName={this.props.dimName}
                                //dimConfig={this.state.dimConfig}
                                //dimAccessor={this.props.dimAccessor}                                
                                shared={shared}
                            />
                        </g>
                    </g>
                </svg>
            </div>
        );
    }
}

export default PCPCanvas;