import React from 'react';
import PropTypes from 'prop-types';

import PCPCanvasContainer from './PCPCanvasContainer';
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

    clearAxesAndPCPOnCanvas = () => {
    	const canvases = this.getCanvasContexts();
    	if (canvases && canvases.axes && canvases.pcpOn) {
    		clearCanvas([
                canvases.axes,
                canvases.pcpOn,
    			//canvases.mouseCoord,
    			//canvases.bg
    		], this.props.ratio);
    	}
    }

    clearAxesAndPCPOnOffCanvas = () => {
    	const canvases = this.getCanvasContexts();
    	if (canvases && canvases.axes && canvases.pcpOn && canvases.pcpOff) {
    		clearCanvas([
                canvases.axes,
                canvases.pcpOn,
                canvases.pcpOff,
    			//canvases.mouseCoord,
    			//canvases.bg
    		], this.props.ratio);
    	}        
    }    

    copyChartInColor = () => {
        const canvases = this.getCanvasContexts();
        if (canvases && canvases.pcpOn && canvases.pcpOff) {
            const dstCtx = canvases.pcpOff;
            //const srcCtx = canvases.pcpOn;
            dstCtx.drawImage(document.getElementById('pcpOn'), 0, 0);
        }
    }

    copyChartInGrey = () => {
        const canvases = this.getCanvasContexts();
        if (canvases && canvases.pcpOn && canvases.pcpOff) {
            const { ratio, width, height } = this.props;
            //const canvasDim = getCanvasDimension(this.props);
            const canvasWidth = width * ratio, 
                 canvasHeight = height * ratio;
            const idataSrc = canvases.pcpOn.getImageData(0, 0, canvasWidth, canvasHeight),
                  idataDst = canvases.pcpOff.getImageData(0, 0, canvasWidth, canvasHeight),
                  dataSrc = idataSrc.data,
                  dataDst = idataDst.data,
                  len = dataSrc.length;

            let i=0, luma;
            for (; i < len; i += 4) {
                luma = dataSrc[i] * 0.2126 + dataSrc[i+1] * 0.7152 + dataSrc[i+2] * 0.0722;
                dataDst[i] = dataDst[i+1] = dataDst[i+2] = luma;
                dataDst[i+3] = dataSrc[i+3] * 0.5;
            }

            canvases.pcpOff.putImageData(idataDst, 0, 0);


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
            const domain = ordinary ? [0, axisExtents.length] : axisExtents.slice();
            if (domain[1] === domain[0]) {
                const domainValue = Math.abs(domain[0]);
                //const sign = domain[0] < 0 ? -1: 1;
                domain[0] = domainValue === 0 ? -1: -2*domainValue;
                domain[1] = domainValue === 0 ? 1: 2*domainValue;
            }
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
                nullPositionY: canvasDim.height + margin.bottom/2,
                select: null
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
            const domain = ordinary ? [0, axisExtents.length] : axisExtents.slice();
            if (domain[1] === domain[0]) {
                const domainValue = Math.abs(domain[0]);
                //const sign = domain[0] < 0 ? -1: 1;
                domain[0] = domainValue === 0 ? -1: -2*domainValue;
                domain[1] = domainValue === 0 ? 1: 2*domainValue;
            }
            yScale.domain(domain)
                    .range([canvasDim.height, 0]);
            
            const yStep = ordinary ? Math.abs(yScale(0) - yScale(1)) : 0;

            const prevConfig = initialDimConfig[name] ? initialDimConfig[name]: {};

            newDimConfig[name] = {
                select: null,
                ...prevConfig,
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
                nullPositionY: canvasDim.height + margin.bottom/2,
                //select: null
            }
        });

       // console.log(newDimOrder)
       const plotData = data.map(d => {
            const flattened = {};
            newDimOrder.forEach(name => {
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

        this.clearAxesAndPCPOnCanvas();
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
        if (!this.waitingForAxisMoveAnimationFrame && !this.axisSelectInProgress) {
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
                this.clearAxesAndPCPOnCanvas();
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
            this.clearAxesAndPCPOnCanvas();
            this.setState({
                dimConfig,
                xScale
            });
        });
    }

    rangeSelectHelper = (axisTitle, start, end, initDimConfig) => {
        const { xScale } = this.state;
        const dimOrder = xScale.domain();
        const activeAxisIndex = dimOrder.indexOf(axisTitle);
        let startIndex, numActiveAxis;
        if (activeAxisIndex === 0) {
            startIndex = 0;
            numActiveAxis = 2;
        } else if (activeAxisIndex === dimOrder.length-1) {
            startIndex = activeAxisIndex - 1;
            numActiveAxis = 2;
        } else {
            startIndex = activeAxisIndex - 1;
            numActiveAxis = 3;
        }

        const activeAxis = dimOrder.slice(startIndex, startIndex + numActiveAxis);
        //console.log(activeAxis, activeAxisIndex, dimOrder)

        const newDimConfig = {};
        forEach(initDimConfig, (config, key) => {
            let select = config.select;
            if (key === axisTitle)
                select = [start, end];

            newDimConfig[key] = {
                ...config,
                select,
                active: activeAxis.indexOf(key) > -1
            };
        });
        return {
            dimConfig: newDimConfig
        };
    }

    handleRangeSelect = (axisTitle, start, end, e) => {
        if (!this.axisMoveInProgress && 
            !this.waitingForRangeSelectAnimationFrame) {

            if (!this.currChartCopied) {
                this.copyChartInGrey();
                this.currChartCopied = true;
            }
            
            this.waitingForRangeSelectAnimationFrame = true;
            this.__dimConfig = this.__dimConfig || this.state.dimConfig;
            
            const state = this.rangeSelectHelper(axisTitle, start, end, this.__dimConfig);

            this.__dimConfig = state.dimConfig;

            this.axisSelectInProgress = true;

            this.triggerEvent('selectrange', state, e);
            requestAnimationFrame(() => {
                this.waitingForRangeSelectAnimationFrame = false;
                this.clearAxesAndPCPOnCanvas();
                this.draw({trigger: 'selectrange'});
            });
        }
    }

    handleRangeSelectEnd = (axisTitle, start, end, e) => {
        const state = this.rangeSelectHelper(axisTitle, start, end, this.__dimConfig);
        this.axisSelectInProgress = false;
        const {
            dimConfig
        } = state;

        this.currChartCopied = false;
        this.__dimConfig = null;
        //console.log(dimConfig)

        this.triggerEvent('selectrange', state, e);
        requestAnimationFrame(() => {
            this.clearAxesAndPCPOnOffCanvas();
            this.setState({
                dimConfig
            });
        });
    }

    handleRangeSelectCancel = (axisTitle, e) => {
        const {dimConfig: initDimConfig} = this.state;
        const newDimConfig = {};
        forEach(initDimConfig, (config, key) => {
            let select = config.select ? config.select.slice(): null;
            if (key === axisTitle)
                select = null;

            newDimConfig[key] = {
                ...config,
                select
            };
        });

        //this.clearAxesAndPCPOnOffCanvas();
        this.clearAxesAndPCPOnCanvas();
        this.setState({
            dimConfig: newDimConfig
        });
    }

    render() {
        //console.log(this.state.dimConfig)
        //const test = this.state.plotData.filter(d => d.sample === 'L74_speed45');
        //console.log(test)

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
            //if (!config.active) return;
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
                    onRangeSelect={this.handleRangeSelect}
                    onRangeSelectEnd={this.handleRangeSelectEnd}
                    onRangeSelectCancel={this.handleRangeSelectCancel}
                    titleFormat={this.props.titleFormat}
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
                <PCPCanvasContainer
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