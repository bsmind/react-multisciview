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
    getCurrentItem
} from "./utils";

import {
    functor,
    cursorStyle
} from '../utils';

import {
    extent as d3Extent
} from 'd3-array';

function calculateData(props) {
	const {
		xScale,
		clamp,
		pointsPerPxThreshold,
		minPointsPerPxThreshold,
	} = props;

	const { dataFilter } = evaluator({
		xScale,
		useWholeData: false,
		clamp,
		pointsPerPxThreshold,
		minPointsPerPxThreshold
	});

	return {
		xScale: xScale.copy(),
		dataFilter
	};
}

function calculateState(props) {
	const dir = xDirection(props.xFlip);
    const dim = dimension(props);

    const { xExtents: xExtentsProps } = props;
	const xExtents = xExtentsProps === "function"
		? props.xExtents(props.data)
		: d3Extent(xExtentsProps.map(d => functor(d)).map(each => {
            return each(props.data, props.xAccessor);
        }));

	const { xScale, dataFilter } = calculateData(props);
	const updatedXScale = setXRange(xScale, dim.width, props.xPadding, dir);
	const { plotData, domain } = dataFilter(
		props.data,
		xExtents,
		props.xAccessor,
		updatedXScale
	);

	return {
		plotData,
		xScale: updatedXScale.domain(domain),
		dataFilter
	};
}

function resetChart(props, first = false) {
	const state = calculateState(props);

	const {
		plotData,
		xScale
	} = state;

	const dim = dimension(props);
	const chartConfig = getChartConfigWithUpdatedYScale(
		getChartConfig(dim, props.children),
		{
            plotData,
            xAccessor: props.xAccessor,
            xDispAccessor: props.xDispAccessor,
            fullData: props.data
        },
        xScale.domain(),
        true
	);

	return {
		...state,
		chartConfig
	};
}

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

    // partial
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

    componentWillMount() {
    	const state = resetChart(this.props, true);
    	this.setState(state);
    }

    componentWillReceiveProps(nextProps) {
    	console.log("ChartCanvas::componentWillReceiveProps");
    	console.log("use this feature to handle dynamic changes on data, compoenets, etc.");
    	let newState;
    	newState = resetChart(this.props);

    	//const { fullData, ...state } = newState;
    	if (this.panInProgress) {
    		console.log("ChartCanvas::componentWillReceiveProps:Pan is in progress");
    	} else {
    		this.clearThreeCanvas();
    		this.setState(newState);
    	}
    	//this.fullData = fullData;
    }

    shouldComponentUpdate() {
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
    		dataFilter
    	} = this.state;
    	const { postCalculator, data, xAccessor, xDispAccessor } = this.props;

    	const { plotData: beforePlotData, domain } = dataFilter(
    		data,
    		newDomain,
    		xAccessor,
    		initialXScale,
    		{
    			currentPlotData: initialPlotData,
    			currentDomain: initialXScale.domain()
    		}
    	);

    	const plotData = postCalculator(beforePlotData);
    	const updatedXScale = initialXScale.copy().domain(domain);
    	const chartConfig = getChartConfigWithUpdatedYScale(
    		initialChartConfig,
    		{
                plotData,
                xAccessor,
                xDispAccessor,
                fullData: data,
            },
            updatedXScale.domain(),
            false
    	);

    	return {
    		xScale: updatedXScale,
    		plotData,
    		chartConfig
    	};
    }

    handleXAxisZoom = (newDomain) => {
    	const { xScale, plotData, chartConfig } = this.calculateStateForDomain(newDomain);
    	this.clearThreeCanvas();

    	// const { xAccessor, data } = this.props;
    	// const firstItem = data[0];
    	// const start = xScale.domain()[0];
    	// const end = xAccessor(firstItem);
    	// const { onLoadMore } = this.props;

    	this.setState({
    		xScale,
    		plotData,
    		//chartConfig
    	}, () => {
    		// if (start < end) onLoadMore(start, end);
    	});
    }

    handleYAxisZoom = (chartId, newDomain) => {
    	this.clearThreeCanvas();
    	const { chartConfig: initialChartConfig } = this.state;

    	const chartConfig = initialChartConfig.map(each => {
    		if (each.id === chartId) {
    			const { yScale } = each;
    			return {
    				...each,
    				yScale: yScale.copy().domain(newDomain),
    				yPanEnabled: true
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

    	const { xScale, plotData, chartConfig } = this.calculateStateForDomain(newDomain);

    	this.clearThreeCanvas();
    	// const firstItem = head(fullData);
    	// const start = head(xScale.domain());
    	// const end = xAccessor(firstItem);
    	// const {onLoadMore} = this.props;
    	// this.mutableState = {mouseXY, currentItem, currentCharts};

    	// this.triggerEvent("zoom", {
    	// 	xScale,
    	// 	plotData,
    	// 	chartConfig,
    	// 	mouseXY,
    	// 	// currentCharts: null,
    	// 	// currentItem: null
    	// }, e);

    	this.setState({
    		xScale,
    		plotData,
    		//chartConfig
    	}, () => {

    	});
    }

    panHelper = (mouseXY, initialXScale, {dx, dy}, chartsToPan) => {
        const newDomain = initialXScale.range()
                            .map(x => x - dx)
                            .map(initialXScale.invert);

        const { plotData: beforePlotData, domain } = this.state.dataFilter(
            this.props.data,
            newDomain,
            this.props.xAccessor,
            initialXScale,
            {
                currentPlotData: this.__plotData,
                currentDomain: this.__domain
            }
        );

        const updatedScale = initialXScale.copy().domain(domain);
        const plotData = this.props.postCalculator(beforePlotData);
        const chartConfig = getChartConfigWithUpdatedYScale(
            this.state.chartConfig,
            {
                plotData,
                xAccessor: this.props.xAccessor,
                xDispAccessor: this.props.xDispAccessor,
                fullData: this.props.data
            },
            updatedScale.domain(),
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

            //console.log(state)
            //const yScale = state.chartConfig.yScale;
            const { yScale } = state.chartConfig[0];
            //console.log(yScale.domain())

            this.triggerEvent('pan', state, e);
            this.mutableState = {
                mouseXY: state.mouseXY,
                currentItem: state.currentItem,
                currentCharts: state.currentCharts
            };

            //console.log(this.__domain, dxdy)

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
            // onLoadMore
            this.setState({
                xScale,
                plotData,
                chartConfig
            }, () => {});
        })
    }


    render() {
    	//console.log(this.state)
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

    	const contextProps = {
    		// fullData: this.fullData,
    		width: dim.width,
    		height: dim.height,
    		margin: margin,
    		ratio: this.props.ratio,

    		xScale: this.state.xScale,
    		xAccessor: this.state.xAccessor,
    		xDispAccessor: this.state.xDispAccessor,

    		// chartConfig: this.state.chartConfig,
    		plotData: this.state.plotData,
    		//fullData: this.fullData,

    		redraw: this.redraw,
    		subscribe: this.subscribe,
    		unsubscribe: this.unsubscribe,
    		generateSubscriptionId: this.generateSubscriptionId,
    		getMutableState: this.getMutableState,
    		getCanvasContexts: this.getCanvasContexts,

    		handleXAxisZoom: this.handleXAxisZoom,
            handleYAxisZoom: this.handleYAxisZoom,

    	};

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
