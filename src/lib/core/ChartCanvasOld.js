import React from "react";
import PropTypes from "prop-types";

import Chart from "./Chart";
import CanvasContainer from "./CanvasContainer";
import EventHandler from "./EventHandler";

import {
	dimension,
	setXRange,
	xDirection,
	clearCanvas,
	evaluator,
	getChartConfig,
    getChartConfigWithUpdatedYScale,
    getCurrentCharts,
	getCurrentItem,
	getExtents
} from "./utils";

import {
    functor,
	cursorStyle,
	isArrayOfString
} from '../utils';

import {
    extent as d3Extent
} from 'd3-array';



class ChartCanvas extends React.Component {
	constructor() {
		super();

		this.subscriptions = [];
		this.interactiveState = [];
		this.panInProgress = false;

		this.state = {
            chartConfig: [],
            dataFilter: null,
            plotData: [],
            xScale: null
		};
		this.mutableState = {};
		this.lastSubscriptionId = 0;
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

    getAllPanConditions = () => {
        return this.subscriptions
                    .map(each => each.getPanConditions());
    }

    unsubscribe = (id) => {
    	this.subscriptions = this.subscriptions.filter(each => each.id !== id);
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
    	});
    }

    redraw = () => {
    	this.clearThreeCanvas();
    	this.draw({ force: true });
    }
	// end of canvas draw methods
	
	resetChart = (props = this.props) => {
		const dir = xDirection(props.xFlip);
		const dim = dimension(props);
	
		const {
			extents: xExtents, 
			stepEnabled: xStepEnabled
		} = getExtents(props.data, props.xAccessor, props.xExtents);
		
		const { dataFilter } = evaluator(props.clamp, xStepEnabled);
		const { plotData, domain } = dataFilter(
			props.data,
			xExtents,
			props.xAccessor,
		);

		const xScale = setXRange(props.xScale.copy(), dim.width, props.xPadding, dir);
		xScale.domain(domain);
	
		const xStep = xStepEnabled ? Math.abs(xScale(0) - xScale(1)): 0;
		
		const chartConfig = getChartConfigWithUpdatedYScale(
			getChartConfig(dim, props.children),
			plotData,
			true
		);

		return {
			plotData,
			xScale,
			xExtents,
			xStep,
			xStepEnabled,
			chartConfig,
			dataFilter
		};		
	}

    componentWillMount() {
    	const state = this.resetChart(this.props);
    	this.setState(state);
    }

    componentWillReceiveProps(nextProps) {
		let newState;

		if (false) {
			newState = resetChart(this.props);
		} else {
			// update
			//console.log(this.props.width, nextProps.width);
			//console.log('updateChart')
			newState = this.updateChart(this.props, nextProps);
		}
    	
    	if (this.panInProgress) {
    		console.log("ChartCanvas::componentWillReceiveProps:Pan is in progress");
    	} else {
    		this.clearThreeCanvas();
    		this.setState(newState);
    	}
	}
	
	updateChart = (props, nextProps) => {
		const {
			xScale: initialXScale,
			chartConfig: initialChartConfig
		} = this.state;

		const {
			width,
			xPadding,
			xFlip,
			data,
			xAccessor,
			xExtents: xExtentsProps,
			clamp
		} = nextProps;

		//console.log('new props: ', xExtentsProps, data)
		const dim = dimension(nextProps);
		const dir = xDirection(xFlip);
		const {
			extents: xExtents,
			stepEnabled: xStepEnabled
		} = getExtents(data, xAccessor, xExtentsProps);
		const { dataFilter } = evaluator(clamp, xStepEnabled);
		const { plotData, domain: fullDomain } = dataFilter(
			data,
			xExtents,
			nextProps.xAccessor
		);

		const xScale = setXRange(nextProps.xScale.copy(), dim.width, xPadding, dir);


		let domain;
		if (props.data.length === 0) {
			domain = fullDomain;
		}
		else if (props.xAttr === nextProps.xAttr) {
			if (xStepEnabled) {
				domain = [
					Math.min(initialXScale.domain()[0], fullDomain[0]),
					Math.max(initialXScale.domain()[1], fullDomain[1])
				];
			} else
				domain = initialXScale.domain().slice();
		} else {
			domain = fullDomain;
		}
		xScale.domain(domain);

		const xStep = xStepEnabled ? Math.abs(xScale(0) - xScale(1)) : 0;
		const chartConfig = getChartConfigWithUpdatedYScale(
			getChartConfig(dim, nextProps.children, initialChartConfig),
			plotData,
			true 
		);

		return {
			plotData,
			xScale,
			xExtents,
			xStep,
			xStepEnabled,
			chartConfig,
			dataFilter
		}
	}

    shouldComponentUpdate() {
		//console.log('panInProgress: ' ,this.panInProgress)
    	return !this.panInProgress;
    }

    //
    // handlers
    //
    calculateStateForDomain = (newDomain) => {
    	const {
    		xScale: initialXScale,
    		chartConfig: initialChartConfig,
    		plotData: initialPlotData,
			dataFilter,
			xStepEnabled
		} = this.state;

    	const { plotData, domain } = dataFilter(
    		this.props.data,
    		newDomain,
    		this.props.xAccessor,
    	);

    	const updatedXScale = initialXScale.copy().domain(domain);
    	const chartConfig = getChartConfigWithUpdatedYScale(
    		initialChartConfig,
			plotData,
            false
		);

		const xStep = xStepEnabled 
			? Math.abs(updatedXScale(0) - updatedXScale(1))
			: 0;

		return {
    		xScale: updatedXScale,
    		plotData,
			chartConfig,
			xStep
    	};
    }

    handleXAxisZoom = (newDomain) => {
    	const { 
			xScale, 
			plotData, 
			chartConfig, 
			xStep 
		} = this.calculateStateForDomain(newDomain);
		
		this.clearThreeCanvas();
    	this.setState({ xScale, plotData, xStep, chartConfig});
    }

    handleYAxisZoom = (chartId, newDomain) => {
    	this.clearThreeCanvas();
    	const { chartConfig: initialChartConfig } = this.state;

    	const chartConfig = initialChartConfig.map(each => {
    		if (each.id === chartId) {
				const { yScale, yStepEnabled, yExtents } = each;
				if (yStepEnabled) {
					newDomain[0] = Math.max(newDomain[0], 0);
					newDomain[1] = Math.min(newDomain[1], yExtents.length);
				}
    			return {
    				...each,
    				yScale: yScale.copy().domain(newDomain),
    			};
    		} else { return each; }
    	});

    	this.setState({ chartConfig });
    }

    //
    // event handles
    //
    handleMouseEnter = (e) => {
    	// console.log('mouseenter')
    	this.triggerEvent("mouseenter", {
    		show: true
    	}, e);
    }

    handleMouseLeave = (e) => {
    	// console.log('mouseleave')
    }

    handleMouseMove = (mouseXY, inputType, e) => {
    	// console.log('mousemove')
    }

    handleZoom = (mouseXY, e) => {
    	if (this.panInProgress)
            return;

    	const {
    		xAccessor,
    		xScale: initialXScale,
    		plotData: initialPlotData
        } = this.state;

        const SCALE_FACTOR = 0.001;
        const zoomFactor = Math.max(Math.min(1 + e.deltaY * SCALE_FACTOR, 3), 0.1);
        let center = initialXScale.invert(mouseXY[0]),
            begin = initialXScale.domain()[0],
            end = initialXScale.domain()[1];

        const newDomain = [
            center - (center - begin)*zoomFactor,
            center + (end - center)*zoomFactor
        ];

    	const { xScale, plotData, chartConfig, xStep } = this.calculateStateForDomain(newDomain);

    	this.clearThreeCanvas();
    	this.setState({xScale, plotData, xStep, chartConfig});
    }

    panHelper = (mouseXY, initialXScale, {dx, dy}, chartsToPan) => {
        const newDomain = initialXScale.range()
                            .map(x => x - dx)
                            .map(initialXScale.invert);

        const { plotData, domain } = this.state.dataFilter(
            this.props.data,
            newDomain,
            this.props.xAccessor
        );

        const updatedScale = initialXScale.copy().domain(domain);
        const chartConfig = getChartConfigWithUpdatedYScale(
            this.state.chartConfig,
			plotData,
            false,
            dy,
            chartsToPan
		);

        const currentCharts = getCurrentCharts(chartConfig, mouseXY);
        const currentItem = getCurrentItem(updatedScale, this.props.xAccessor, mouseXY, plotData);

        return {
            xScale: updatedScale,
            plotData,
            chartConfig,
            mouseXY,
            currentCharts,
            currentItem
        }
    }

    handlePan = (mouseXY, panStartXScale, dxdy, chartsToPan, e) => {
        if (!this.waitingForPanAnimationFrame) {
            this.waitingForPanAnimationFrame = true;

            this.__plotData = this.__plotData || this.state.plotData;
            this.__domain = this.__domain || this.state.xScale.domain();

            const state = this.panHelper(mouseXY, panStartXScale, dxdy, chartsToPan);

            this.__plotData = state.plotData;
            this.__domain = state.xScale.domain();
            this.panInProgress = true;

            this.triggerEvent('pan', state, e);
            this.mutableState = {
                mouseXY: state.mouseXY,
                currentItem: state.currentItem,
                currentCharts: state.currentCharts
            };

            requestAnimationFrame(() => {
                this.waitingForPanAnimationFrame = false;
                this.clearBothCanvas();
                this.draw({trigger: 'pan'});
            });
        }
    }

    handlePanEnd = (mouseXY, panStartXScale, dxdy, chartsToPan, e) => {
        const state = this.panHelper(mouseXY, panStartXScale, dxdy, chartsToPan);
        this.__plotData = null;
        this.__domain = null;
        this.panInProgress = false;

        const {
            xScale,
            plotData,
            chartConfig
        } = state;

        this.triggerEvent('panend', state, e);

        requestAnimationFrame(() => {
			this.clearThreeCanvas();
            this.setState({
                xScale,
                plotData,
                chartConfig
            });
        })
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

    	const dim = dimension(this.props);
    	const { margin } = this.props;

    	const chartList = [];
    	let keyCount = 0;
    	React.Children.forEach(this.props.children, child => {
    		if (!React.isValidElement(child)) return;
    		if (child.type === Chart) {
    			const chartProps = {
    				key: `chart-${keyCount}`,
    				shared: {
                        margin: margin,
                        ratio: this.props.ratio,

                        xScale: this.state.xScale,
						xAccessor: this.props.xAccessor,
						xExtents: this.props.xExtents,
						xStep: this.state.xStep,

                        plotData: this.state.plotData,

                        subscribe: this.subscribe,
                        unsubscribe: this.unsubscribe,
                        getCanvasContexts: this.getCanvasContexts,

                        handleXAxisZoom: this.handleXAxisZoom,
                        handleYAxisZoom: this.handleYAxisZoom,
    				},
    				chartConfig: this.state.chartConfig.find(d => d.id === child.props.id)
    			};
    			chartList.push(React.cloneElement(child, chartProps));
    			keyCount += 1;
    		}
    	});

    	//
    	// clipPath
    	//
    	const clipPathList = this.state.chartConfig.map((each, idx) => {
    		const { origin, width, height, id } = each;
    		return (
    			<clipPath key={`chart-clippath-${idx}`}
    				id={`chart-area-clip-${id}`}>
    				<rect x={origin.x} y={origin.y} width={width} height={height} />
    			</clipPath>
    		);
    	});

        const interaction = true;
        const cursor = cursorStyle(interaction);

    	return (
    		<div
    			style={divStyle}
    			className={this.props.className}
    			onClick={this.props.onSelect}
    		>
    			<CanvasContainer
    				ref={node => this.canvasContainerNode = node}
    				ratio={this.props.ratio}
    				width={this.props.width}
    				height={this.props.height}
    				zIndex={this.props.zIndex}
    			/>
    			<svg
    				className={this.props.className}
    				width={this.props.width}
    				height={this.props.height}
    				style={svgStyle}
    			>
    				{cursor}
    				<defs>
    					<clipPath id="chart-area-clip">
    						<rect x="0" y="0" width={dim.width} height={dim.height} />
    					</clipPath>
    					{clipPathList}
    				</defs>
    				<g transform={`translate(${margin.left},${margin.top})`}>
    					<EventHandler
    						ref={node => this.eventHandlerNode = node}
    						width={dim.width}
                            height={dim.height}

                            chartConfig={this.state.chartConfig}
                            xScale={this.state.xScale}

    						mouseMove={this.props.mouseMoveEvent && interaction}
    						zoom={this.props.zoomEvent && interaction}
                            pan={this.props.panEvent && interaction}
                            getAllPanConditions={this.getAllPanConditions}

    						onMouseEnter={this.handleMouseEnter}
    						onMouseLeave={this.handleMouseLeave}
                            onMouseMove={this.handleMouseMove}

                            onPan={this.handlePan}
                            onPanEnd={this.handlePanEnd}

    						onZoom={this.handleZoom}
    					/>
    					<g>
    						{chartList}
    					</g>
    				</g>
    			</svg>
    		</div>
    	);
    }
}

ChartCanvas.propTypes = {
    // Canvas config
    width: PropTypes.number,
    height: PropTypes.number,
	ratio: PropTypes.number,
	margin: PropTypes.shape({
		left: PropTypes.number,
		right: PropTypes.number,
		top: PropTypes.number,
		bottom: PropTypes.number
    }),
    // End of Canvas config

	pointsPerPxThreshold: PropTypes.number,
	minPointsPerPxThreshold: PropTypes.number,

    // Data & x-axis config
	data: PropTypes.array,
	xAccessor: PropTypes.func,
	xDispAccessor: PropTypes.func,
	xExtents: PropTypes.oneOfType([
		PropTypes.array,
		PropTypes.func
	]),
	xScale: PropTypes.func,
	xFlip: PropTypes.bool,
	xPadding: PropTypes.oneOfType([
		PropTypes.number,
		PropTypes.shape({
			left: PropTypes.number,
			right: PropTypes.number
		})
    ]),
	clamp: PropTypes.oneOfType([
		PropTypes.bool,
		PropTypes.string
    ]),
    // End of Data & x-axis config

    // Events options
	zoomEvent: PropTypes.bool,
	mouseMoveEvent: PropTypes.bool,
	panEvent: PropTypes.bool,
    defaultFocus: PropTypes.bool,
    // End of Events options

	className: PropTypes.string,

	postCalculator: PropTypes.func,

	onSelect: PropTypes.func,
	onLoadMore: PropTypes.func,

	zIndex: PropTypes.number,
};

ChartCanvas.defaultProps = {
	margin: { top: 20, right: 30, bottom: 30, left: 80 },

	pointsPerPxThreshold: 2,
	minPointsPerPxThreshold: 1 / 100,

	xFlip: false,
	xPadding: 0,

	postCalculator: d => d,


	className: "",
	onSelect: () => {
		//console.log("onSelect in ChartCanvas div");
		return {};
	},
	onLoadMore: () => {},
	zIndex: 1,

	zoomEvent: true,
	mouseMoveEvent: true,
	panEvent: true,
	defaultFocus: true,

};

export default ChartCanvas;
