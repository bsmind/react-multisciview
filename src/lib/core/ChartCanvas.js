import React from "react";
import PropTypes, { shape } from "prop-types";

import uniqueId from 'lodash.uniqueid';

import CanvasContainer from './CanvasContainer';
import EventHandler from './EventHandler';
import {XAxis, YAxis} from '../axes';

import {
	dimension as getCanvasDimension,
	clearCanvas
} from './utils';

import {
	getScale
} from './scatterUtils';

import {
	cursorStyle
} from '../utils';

class ChartCanvas extends React.Component {
	constructor(props) {
		super(props);
		const initialState = this.resetChart();
		this.state = {
			id: uniqueId('chartcanvas-'),
			...initialState
		}
		this.subscriptions = [];
		this.panInProgress = false;
	}

    getCanvasContexts = () => {
    	if (this.canvasContainerNode)
    		return this.canvasContainerNode.getCanvas();
    }

    subscribe = (id, rest) => {
    	this.subscriptions = this.subscriptions.concat({
    		id,
    		...rest
    	});
    }

    unsubscribe = (id) => {
    	this.subscriptions = this.subscriptions.filter(each => each.id !== id);
	}
	
	clearAxisAndChartOnCanvas = () => {
		const canvases = this.getCanvasContexts();
		if (canvases && canvases.axes && canvases.chartOn) {
			clearCanvas([
				canvases.axes,
				canvases.chartOn
			], this.props.ratio);
		}
	}

	componentDidMount() {
		const state = this.resetChart();
		//console.log('compoenetDidMount', state)
		this.setState({
			...this.state,
			...state
		});
	}

	componentWillReceiveProps(nextProps) {
		const state = this.updateChart(nextProps);
		this.clearAxisAndChartOnCanvas();
		this.setState({
			...this.state,
			...state
		});
	}

	resetChart = (props = this.props) => {
		const {
			data,
			dataExtents,
			dataAccessor,
			xAttr: xAttrProp,
			yAttr: yAttrProp,
		} = props;
		const canvasDim = getCanvasDimension(props);

		// xScale
		const xAttr = getScale({dataExtents, attribute: xAttrProp}, [0, canvasDim.width]);

		// yScale
		const yAttr = getScale({dataExtents, attribute: yAttrProp}, [canvasDim.height, 0]);
		
		// flatten data to plot
		const dimName = Object.keys(dataExtents);
		const plotData = data.map(d => {
			const flattened = {};
			dimName.forEach(name => {
				flattened[name] = dataAccessor(d, name);
			});
			flattened['_id'] = d._id;
			flattened['markerID']=d.markerID;
			return flattened;
		});

		return {
			plotData,
			dataExtents: {...dataExtents},
			xAttr,
			yAttr,
			xAccessor: d => d[xAttr],
			yAccessor: d => d[yAttr]
		}
	}

	updateChart = (props = this.props) => {
		const {
			data,
			dataExtents,
			dataAccessor,
			xAttr: xAttrProp,
			yAttr: yAttrProp,
		} = props;
		const canvasDim = getCanvasDimension(props);

		// xScale
		const xAttr = getScale({dataExtents, attribute: xAttrProp}, [0, canvasDim.width]);

		// yScale
		const yAttr = getScale({dataExtents, attribute: yAttrProp}, [canvasDim.height, 0]);
		
		// flatten data to plot
		const dimName = Object.keys(dataExtents);
		const plotData = data.map(d => {
			const flattened = {};
			dimName.forEach(name => {
				flattened[name] = dataAccessor(d, name);
			});
			flattened['_id'] = d._id;
			flattened['markerID']=d.markerID;
			return flattened;
		});

		return {
			plotData,
			dataExtents: {...dataExtents},
			xAttr,
			yAttr,
			xAccessor: d => d[xAttr],
			yAccessor: d => d[yAttr]
		}		
	}

    triggerEvent = (type, props, e) => {
    	this.subscriptions.forEach(each => {
    		const state = {
    			...this.state,
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
	

	handleZoom = (mouseXY, e) => {
		if (this.panInProgress) return;
		console.log('handleZoom')
	}

	updateAttr = (attr, initialAttr, dataExtents) => {
		const range = initialAttr.scale.range();
		if (dataExtents[attr]) {
			return getScale({
				dataExtents,
				attribute: attr
			}, range);
		}
		return initialAttr;
	}
	updateExtents = (initialExtents, newExtents) => {
		Object.keys(newExtents).map(key => {
			initialExtents[key] = newExtents[key];
		});
		return initialExtents;
	}

	handleByOther = ({what, data, inProgress}) => {
		// must what: extents
		if (what !== 'extents') return;
		if (this.panInProgress) return;

		if (inProgress) {
			if (!this.waitingForAnimationFrame) {
				this.waitingForAnimationFrame = true;

				// update dataExtents
				this.__dataExtents = this.__dataExtents || this.state.dataExtents;
				this.__xAttr = this.__xAttr || this.state.xAttr;
				this.__yAttr = this.__yAttr || this.state.yAttr;

				const newDataExtents = this.updateExtents(this.__dataExtents, data);				
				const newXAttr = this.updateAttr(this.props.xAttr, this.__xAttr, data);
				const newYAttr = this.updateAttr(this.props.yAttr, this.__yAttr, data);

				this.__dataExtents = newDataExtents;
				this.__xAttr = newXAttr;
				this.__yAttr = newYAttr;

				this.otherInProgress = true;

				this.triggerEvent('pan', {
					xAttr: newXAttr, 
					yAttr: newYAttr, 
					dataExtents: newDataExtents
				});
				requestAnimationFrame(() => {
					this.waitingForAnimationFrame = false;
					this.clearAxisAndChartOnCanvas();
					this.draw({trigger: 'pan'});
				});
			}
		} else {
			this.__dataExtents = this.__dataExtents || this.state.dataExtents;
			this.__xAttr = this.__xAttr || this.state.xAttr;
			this.__yAttr = this.__yAttr || this.state.yAttr;
		
			const newXAttr = this.updateAttr(this.props.xAttr, this.__xAttr, data);
			const newYAttr = this.updateAttr(this.props.yAttr, this.__yAttr, data);
			const newDataExtents = this.updateExtents(this.__dataExtents, data);				
			
			this.__xAttr = null;
			this.__yAttr = null;
			this.__dataExtents = null;
			
			this.otherInProgress = false;
			this.triggerEvent('pan', {
				xAttr: newXAttr, 
				yAttr: newYAttr, 
				dataExtents: newDataExtents
			});
			requestAnimationFrame(() => {
				this.clearAxisAndChartOnCanvas();
				this.setState({...this.state,
					xAttr: newXAttr,
					yAttr: newYAttr,
					dataExtents: newDataExtents
				});
			});		
		}
	}


    render() {
		const { margin } = this.props;
    	const divStyle = {
    		position: "relative",
    		width: this.props.width,
    		height: this.props.height
    	};
    	const svgStyle = {
    		position: "absolute",
    		zIndex: (this.props.zIndex + 5)
		};
		const canvasDim = getCanvasDimension(this.props);
		const shared = {
			canvasDim,
			margin,
			width: this.props.width,
			height: this.props.height,
			ratio: this.props.ratio,
			subscribe: this.subscribe,
			unsubscribe: this.unsubscribe,
			getCanvasContexts: this.getCanvasContexts,
			...this.state
		};

		const cursor = cursorStyle(true);

		const children = [];
		React.Children.forEach(this.props.children, child => {
			if (!React.isValidElement(child)) return;
			children.push(React.cloneElement(child,{shared}));
		});

		return (
			<div
				style={divStyle} 
				className={this.props.className}
			>
				<CanvasContainer
					ref={node => this.canvasContainerNode = node}
					width={this.props.width}
					height={this.props.height}
					ratio={this.props.ratio}
					zIndex={this.props.zIndex}
				/>
				<svg
					style={svgStyle}
					className={this.props.className}
					width={this.props.width}
					height={this.props.height}
				>
					{cursor}
					<g transform={`translate(${margin.left},${margin.top})`}>
						<EventHandler
							ref={node => this.eventHandlerNode = node}
							width={canvasDim.width}
							height={canvasDim.height}
							onZoom={this.handleZoom}
						/>
						<g>
							{children}
						</g>						
					</g>
				</svg>
			</div>
		);
	}
}


export default ChartCanvas;
