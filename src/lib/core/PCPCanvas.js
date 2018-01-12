import React from 'react';
import PropTypes from 'prop-types';

import CanvasContainer from './CanvasContainer';
import PCPEventHandler from './PCPEventHandler';
import Series from './Series';
import { PCPYAxis } from '../axes';
import { PCPPolyLineSeries } from '../series';

import {
    dimension as getCanvasDimension,
    clearCanvas
} from './utils';

import {
    functor,
    isArrayOfString,
    hexToRGBA,
    cursorStyle
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
            dimConfig: {},
            plotData: []
        };
        this.axisMoveInProgress = false;
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
            axisWidth,
            margin
        } = props;

        const canvasDim = getCanvasDimension(props);
        const xScale = scalePoint()
                        .domain(dimName)
                        .range([0, canvasDim.width])
                        .padding(0);
        
        //console.log(xScale.domain())
        // getDimConfig
        const dimConfig = {}; 
        dimName.forEach(name => {
            let axisExtents = dimAccessor(dimExtents, name);
            if (axisExtents == null) {
                axisExtents = [0, 1];
            //     accessor = d => null;
            }

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
                position: xScale(name),
                axisWidth,
                accessor: d => d[name],
                nullPositionY: canvasDim.height + margin.bottom/2
            }
        });
        // end of getDimConfig

        // calculateDataFromNewDimConfig
        const plotData = data.map(d => {
            const flattened = {};
            dimName.forEach(name => {
                flattened[name] = dimAccessor(d, name);
            });
            flattened.stroke = colorAccessor(d);
            return flattened;
        });
        // end

        //this.fullData = plotData;
        return {
            xScale,
            dimConfig,
            plotData
        }
    }

    updateChart = (props = this.props) => {
        const {
            dimName,
            dimExtents,
            dimAccessor,
            data,
            colorAccessor,
            axisWidth,
            margin
        } = props;

        const canvasDim = getCanvasDimension(props);

        // updateDimConfig
        const { 
            xScale: initialXScale,
            dimConfig: initialDimConfig 
        } = this.state;
        const initialDimOrder = initialXScale.domain();

        dimName.forEach(name => {
            if ( initialDimOrder.indexOf(name) === -1) 
                initialDimOrder.push(name);                
        });

        const newDimOrder = [];
        initialDimOrder.forEach(name => {
            if ( dimName.indexOf(name) >= 0)
                newDimOrder.push(name);
        });

        const newXScale = scalePoint()
                            .domain(newDimOrder)
                            .range([0, canvasDim.width])
                            .padding(0);

        const newDimConfig = {};
        newDimOrder.forEach(name => {
            let axisExtents = dimAccessor(dimExtents, name);
            if (axisExtents == null)
                axisExtents = [0, 1];

            const ordinary = isArrayOfString(axisExtents);
            
            const yScale = scaleLinear();
            const domain = ordinary ? [0, axisExtents.length] : axisExtents;
            yScale.domain(domain)
                    .range([canvasDim.height, 0]);
            
            const yStep = ordinary ? Math.abs(yScale(0) - yScale(1)) : 0;
            newDimConfig[name] = {
                title: name,
                extents: axisExtents,
                ordinary,
                scale: yScale,
                step: yStep,
                active: true,
                flip: false,
                position: newXScale(name),
                axisWidth,
                accessor: d => d[name],
                nullPositionY: canvasDim.height + margin.bottom/2
            }
        });

       // console.log(newDimOrder)
       const plotData = data.map(d => {
            const flattened = {};
            dimName.forEach(name => {
                flattened[name] = dimAccessor(d, name);
            });
            flattened.stroke = colorAccessor(d);
            return flattened;
        });

        return {
            xScale: newXScale,
            dimConfig: newDimConfig,
            plotData
        }
        // end updateDimConfig
    }

    componentWillMount() {
        const state = this.resetChart();
        this.setState(state);
    }

    componentWillReceiveProps(nextProps) {
        //const newState = this.resetChart(nextProps);
        const newState = this.updateChart(nextProps);

        this.clearThreeCanvas();
        this.setState(newState);
    }

    shouldComponentUpdate() {
        return !this.axisMoveInProgress;
    }

    triggerEvent = (type, props, e) => {
        this.subscriptions.forEach(each => {
            const state = {
                ...this.state,
                fullData: this.props.data,
                subscriptions: this.subscriptions
            };
            each.listener(type, props, state, e);
        });
    }

    draw = (props) => {
        this.subscriptions.forEach(each => {
            if (each.draw)
                each.draw(props);
        })
    }

    axisMoveHelper = (dx, axisToMove, initDimOrder, force = false) => {
        // as axis is moving...
        // 1. x position of axis changes, ok
        // 2. corresponding data changes
        // 3. if needed, swap location..
        const { 
            dimConfig: initDimConfig, 
        } = this.state;

        const newDimOrder = initDimOrder.map(title => {
            const { position } = initDimConfig[title];
            const newPosition = (title === axisToMove)
                ? position + dx
                : position;

            return {
                x: newPosition,
                id: title
            }
        }).sort((a,b) => a.x - b.x);

        const canvasDim = getCanvasDimension(this.props);
        const xScale = scalePoint()
                        .domain(newDimOrder.map(d => d.id))
                        .range([0, canvasDim.width])
                        .padding(0);
        

        const newDimConfig = {};
        newDimOrder.forEach( each => {
            const {x, id} = each;
            const prevConfig = initDimConfig[id];
            const { position } = prevConfig;

            const newPosition = (id === axisToMove && !force)
                ? x
                : xScale(id);

            newDimConfig[id] = {
                ...prevConfig,
                position: newPosition
            }
        });

        return {
            dimConfig: newDimConfig,
            xScale
        }
    }

    handleAxisMove = (axisTitle, moveDist, e) => {
        if (!this.waitingForAxisMoveAnimationFrame) {
            this.waitingForAxisMoveAnimationFrame = true;
            this.__dimConfig = this.__dimConfig || this.state.dimConfig;
            this.__dimOrder = this.__dimOrder || this.state.xScale.domain();
            
            const state = this.axisMoveHelper(moveDist, axisTitle, this.__dimOrder);

            this.__dimConfig = state.dimConfig;
            this.__dimOrder = state.xScale.domain();
            //console.log(__dimOrder)

            this.axisMoveInProgress = true;

            this.triggerEvent('moveaxis', state, e);
            requestAnimationFrame(() => {
                this.waitingForAxisMoveAnimationFrame = false;
                this.clearThreeCanvas();
                this.draw({trigger: 'moveaxis'});
            });
        }
    }

    handleAxisMoveEnd = (axisTitle, moveDist, e) => {
        
        const state = this.axisMoveHelper(moveDist, axisTitle,this.__dimOrder, true);

        this.__dimConfig = null;
        this.__dimOrder = null;
        this.axisMoveInProgress = false;

        const {
            dimConfig,
            xScale
        } = state;
        this.triggerEvent('moveaxis', state, e);

        requestAnimationFrame(() => {
            this.clearThreeCanvas();
            this.setState({
                dimConfig,
                xScale
            });
        });
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
            axisWidth: axisWidthProp
        } = this.props;
        const axisWidth = (axisWidthProp%2 === 0) ? axisWidthProp: axisWidthProp + 1 || 26;
        const canvasDim = getCanvasDimension({width, height, margin});

        const shared = {
            margin,
            ratio,

            chartWidth: canvasDim.width,
            chartHeight: canvasDim.height,

            subscribe: this.subscribe,
            unsubscribe: this.unsubscribe,
            getCanvasContexts: this.getCanvasContexts,

            xScale: this.state.xScale,
            plotData: this.state.plotData,
        }

        const pcpYAxisList = [];
        forEach(this.state.dimConfig, (config, title) => {
            if (!config.active) return;
            pcpYAxisList.push( 
                <PCPYAxis key={`pcp-yaxis-${title}`}
                    title={title}
                    axisLocation={config.position}
                    axisWidth={axisWidth}
                    height={canvasDim.height}
                    orient={'left'}
                    shared={shared}
                    ordinary={config.ordinary}
                    dimConfig={config}
                    //onAxisMove={this.handleAxisMove}
                    //onAxisMoveEnd={this.handleAxisMoveEnd}
                />
            );
        });

        const seriesList = [];
        let keyCount = 0;
        React.Children.forEach(this.props.children, child => {
            if (!React.isValidElement(child)) return;
            if (child.type === Series) {
                seriesList.push(React.cloneElement(child, {
                    key: `pcp-series-${keyCount}`,
                    shared,
                    dimConfig: this.state.dimConfig
                }));
                keyCount += 1;
            }
        });

        const axisMoveHandlerYRange = [
            [0, margin.top/2 - 1],
            [margin.top/2 + canvasDim.height + 1, margin.top + canvasDim.height]
        ];

        const cursor = cursorStyle(true);

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
                    {cursor}
                    <g transform={`translate(${margin.left - axisWidth/2},${margin.top/2})`}>
                        <PCPEventHandler
                            ref={node => this.eventHandlerNode = node}
                            width={canvasDim.width + axisWidth}
                            height={canvasDim.height + margin.top}
                            dimConfig={this.state.dimConfig}
                            axisMoveHandlerYRange={axisMoveHandlerYRange}
                            axisMoveHandlerXOffset={axisWidth/2}
                            onAxisMove={this.handleAxisMove}
                            onAxisMoveEnd={this.handleAxisMoveEnd}
                            onMouseDown={this.handleAxisMove}
                        />
                        <g>
                            {seriesList}
                            {pcpYAxisList}
                        </g>
                    </g>
                </svg>
            </div>
        );
    }
}

export default PCPCanvas;