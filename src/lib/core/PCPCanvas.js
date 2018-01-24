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

import {
    getNewDimComfig,
    getPlotData,
    getXScale,
    getNewDimOrder
} from './pcpUtils';

import forEach from 'lodash.foreach';


import { scalePoint, scaleLinear } from 'd3-scale';
import uniqueId from 'lodash.uniqueid';

function isSameDomain(domainA, domainB) {
    const sameStart = Math.abs(domainA[0] - domainB[0]) < 1e-6;
    const sameEnd = Math.abs(domainA[1] - domainB[1]) < 1e-6;
    const sameWidth = Math.abs((domainA[1] - domainA[0]) - (domainB[1] - domainB[0])) < 1e-6;
    return sameStart && sameEnd && sameWidth;
}

class PCPCanvas extends React.Component {
    constructor() {
        super();

        this.mutableState = {};
        this.subscriptions = [];
        this.state = {
            id: uniqueId('pcp_'),
            xScale: null,
            dimConfig: {},
            plotData: []
        };
        this.axisMoveInProgress = false;
        this.axisSelectInProgress = false;
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
    }

    unsubscribe = (id) => {
    	this.subscriptions = this.subscriptions.filter(each => each.id !== id);
    }

    resetChart = (props = this.props) => {
        const { margin, pcpAttrSelect } = props;
        const canvasDim = getCanvasDimension(props);
        const xScale = getXScale(props, canvasDim.width);
        const dimConfig = getNewDimComfig(props,
            xScale,
            canvasDim.height,
            canvasDim.height + margin.bottom / 2
        );
        Object.keys(pcpAttrSelect).forEach(key => {
            const prevSelect = pcpAttrSelect[key];
            const currConfig = dimConfig[key];
            if (prevSelect && currConfig) {
                const currExtents = currConfig.extents;
                const currScale = currConfig.scale;
                if (prevSelect.auxiliary) { // ordinary, need to adjust select region
                    console.log('ordinary, need to adjust')
                } else {
                    const selectDomain = prevSelect.domain;
                    if (!isSameDomain(currExtents, selectDomain)) {
                        currConfig.select = [currScale(selectDomain[0]), currScale(selectDomain[1])];
                    }
                }
            }
        });
        const plotData = getPlotData(props);

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
            margin,
        } = props;

        const { 
            xScale: initialXScale,
            dimConfig: initialDimConfig 
        } = this.state;

        const canvasDim = getCanvasDimension(props);

        const newDimOrder = getNewDimOrder(
            dimName,
            initialXScale.domain()
        );

        const newXScale = getXScale({
            dimName: newDimOrder
        }, canvasDim.width);

        const newDimConfig = getNewDimComfig(
            {
                dimName: newDimOrder,
                dimExtents,
                dimAccessor,
                axisWidth
            }, 
            newXScale, 
            canvasDim.height,
            canvasDim.height + margin.bottom / 2,
            initialDimConfig
        );

       const plotData = getPlotData({
            data,
            dimName: newDimOrder,
            dimAccessor,
            colorAccessor
       });
  
        return {
            xScale: newXScale,
            dimConfig: newDimConfig,
            plotData
        }
    }

    componentWillMount() {
        const state = this.resetChart();
        this.setState(state);
    }

    componentWillUnmount() {
        // store current state...
        // dimOrder
        // select range  <-- coupled with scatter plot
        const {xScale, dimConfig} = this.state;
        const dimOrder = xScale.domain().slice();
        // const dimSelect = {};
        // Object.keys(dimConfig).forEach(key => {
        //     const config = dimConfig[key];
        //     const { select, scale, ordinary, title } = config;
        //     if (select) {
        //         if (ordinary) {

        //         } else {

        //         }
        //     }
        // });
        // console.log(dimConfig)

        if (this.props.onUnmount)
            this.props.onUnmount(dimOrder);
    }

    componentWillReceiveProps(nextProps) {
        const newState = this.updateChart(nextProps);

        this.clearAxesAndPCPOnCanvas();
        this.setState(newState);
    }

    shouldComponentUpdate() {
        return !this.axisMoveInProgress && 
               !this.axisSelectInProgress;
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
        const xScale = getXScale({
            dimName: newDimOrder.map(d => d.id)
        }, canvasDim.width);        

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
        let axisScale;
        const newDimConfig = {};
        forEach(initDimConfig, (config, key) => {
            let select = config.select;
            if (key === axisTitle) {
                select = [start, end];
                axisScale = config.scale.copy();
            }

            newDimConfig[key] = {
                ...config,
                select,
            };
        });

        return {
            dimConfig: newDimConfig,
            axisScale
        };
    }

    onPCPAxisSelect = (axisTitle, start, end, inProgress, dimConfig) => {
        if (!this.props.onPCPAxisSelect) return;
        
        const config = dimConfig[axisTitle];
        const { ordinary, scale, extents, step } = config;
        if (ordinary) {
            if (start == null || end == null) {
                this.props.onPCPAxisSelect(
                    axisTitle, 
                    [0, extents.length], 
                    inProgress,
                    extents.slice()
                );
            } else {
                let startDomain = scale.invert(start);
                let endDomain = scale.invert(end);
                if (startDomain > endDomain) {
                    const temp = startDomain;
                    startDomain = endDomain;
                    endDomain = temp;
                }
                this.props.onPCPAxisSelect(
                    axisTitle, 
                    [startDomain, endDomain], 
                    inProgress,
                    extents.slice()
                );                    
            }
            // if (start == null || end == null) {
            //    this.props.onPCPAxisSelect(axisTitle, [0, extents.length], inProgress);
            // } else {
            //     let startDomain = scale.invert(start);
            //     let endDomain = scale.invert(end);
            //     if (startDomain > endDomain) {
            //         const temp = startDomain;
            //         startDomain = endDomain;
            //         endDomain = temp;
            //     }
            //     this.props.onPCPAxisSelect(
            //         axisTitle, 
            //         [startDomain, endDomain], 
            //         inProgress);    
            // }
        } else {
            if (start == null || end == null) {
                this.props.onPCPAxisSelect(axisTitle, extents, inProgress);
            } else {
                let startDomain = scale.invert(start);
                let endDomain = scale.invert(end);
                if (startDomain > endDomain) {
                    const temp = startDomain;
                    startDomain = endDomain;
                    endDomain = temp;
                }
                this.props.onPCPAxisSelect(axisTitle, [startDomain, endDomain], inProgress);    
            }
        }
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
            
            const {axisScale, ...state} = this.rangeSelectHelper(axisTitle, start, end, this.__dimConfig);

            this.__dimConfig = state.dimConfig;

            this.axisSelectInProgress = true;

            this.triggerEvent('selectrange', state, e);
            requestAnimationFrame(() => {
                this.waitingForRangeSelectAnimationFrame = false;
                this.clearAxesAndPCPOnCanvas();
                this.draw({trigger: 'selectrange'});
                this.onPCPAxisSelect(axisTitle, start, end, true, this.__dimConfig);
            });
        }
    }

    handleRangeSelectEnd = (axisTitle, start, end, e) => {
        const state = this.rangeSelectHelper(axisTitle, start, end, this.__dimConfig);
        this.axisSelectInProgress = false;
        const {
            axisScale,
            dimConfig
        } = state;

        this.currChartCopied = false;
        this.__dimConfig = null;

        this.triggerEvent('selectrange', state, e);
        requestAnimationFrame(() => {
            this.clearAxesAndPCPOnOffCanvas();
            this.setState({
                dimConfig
            });
            this.onPCPAxisSelect(axisTitle, start, end, false, state.dimConfig);
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

        this.clearAxesAndPCPOnCanvas();
        this.setState({
            dimConfig: newDimConfig
        });
        this.onPCPAxisSelect(axisTitle, null, null, false, newDimConfig);
    }

    rangeSelectHelperByOther = (dimSelects, initDimConfig) => {
        const newDimConfig = {};
        forEach(initDimConfig, (config, key) => {
            if (dimSelects[key] == null || dimSelects[key].length === 0) {
                newDimConfig[key] = {...config};
            } else {
                const [minv, maxv] = dimSelects[key];
                const { scale } = config;
                const newSelect = [scale(minv), scale(maxv)];
                newDimConfig[key] = {
                    ...config,
                    select: newSelect
                }
            }
        });
        return {
            dimConfig: newDimConfig
        };
    }
    
    handleByOther = ({what, data, inProgress}) => {
        // must what: extents
        if (what !== 'extents') return;
        if (this.axisMoveInProgress || this.axisSelectInProgress) return;

        if (inProgress) {
            if (!this.waitingForAnimationFrame) {
                this.waitingForAxisMoveAnimationFrame = true;

                if (!this.currChartCopied) {
                    this.copyChartInGrey();
                    this.currChartCopied = true;
                }
                    
                this.__dimConfig = this.__dimConfig || this.state.dimConfig;
                
                const state = this.rangeSelectHelperByOther(data, this.__dimConfig);
    
                this.__dimConfig = state.dimConfig;

                this.triggerEvent('selectrange', state, null);
                requestAnimationFrame(() => {
                    this.waitingForAnimationFrame = false;
                    this.clearAxesAndPCPOnCanvas();
                    this.draw({trigger: 'selectrange'})
                });
            }
        } else {
            this.__dimConfig = this.__dimConfig || this.state.dimConfig;
            
            const state = this.rangeSelectHelperByOther(data, this.__dimConfig);

            this.__dimConfig = null;//state.dimConfig;
            this.currChartCopied = false;
            
            this.triggerEvent('selectrange', state, null);
            requestAnimationFrame(() => {
                this.clearAxesAndPCPOnOffCanvas();
                this.setState({
                    dimConfig: state.dimConfig
                });                    
            });            
        }
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