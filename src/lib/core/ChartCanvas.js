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
	cursorStyle,
	isArrayOfString
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
			dataExtents: dataExtentsProp,
			dataAccessor,
			xAttr: xAttrProp,
			yAttr: yAttrProp,
		} = props;
		const canvasDim = getCanvasDimension(props);

		// xScale
		const xAttr = getScale({
			dataExtents: dataExtentsProp, 
			attribute: xAttrProp
		}, [0, canvasDim.width]);

		// yScale
		const yAttr = getScale({
			dataExtents: dataExtentsProp, 
			attribute: yAttrProp
		}, [canvasDim.height, 0]);
		
		// flatten data to plot
		const dimName = Object.keys(dataExtentsProp);
		const plotData = data.map(d => {
			const flattened = {};
			dimName.forEach(name => {
				flattened[name] = dataAccessor(d, name);
			});
			flattened['_id'] = d._id;
			flattened['markerID']=d.markerID;
			return flattened;
		});

		const dataExtents = {};
		dimName.forEach(name => {
			dataExtents[name] = isArrayOfString(dataExtentsProp[name])
				? [0, dataExtentsProp[name].length]
				: dataExtentsProp[name].slice();
		});

		return {
			plotData,
			dataExtents,
			xAttr,
			yAttr,
			xAccessor: d => d[xAttr],
			yAccessor: d => d[yAttr]
		}
	}

	updateChart = (props = this.props) => {
		const {
			data,
			dataExtents: dataExtentsProp,
			dataAccessor,
			xAttr: xAttrProp,
			yAttr: yAttrProp,
		} = props;
		const canvasDim = getCanvasDimension(props);

		const {
			dataExtents: dataExtentsState,
			xAttr: initialXAttr,
			yAttr: initialYAttr
		} = this.state;

		// const dataExtents = {...dataExtentsProp};
		// Object.keys(initialDataExtents).forEach(key => {
		// 	dataExtents[key] = initialDataExtents[key].slice();
		// });
		const dimName = Object.keys(dataExtentsProp);
		dimName.forEach(name => {
			const extentsProps = dataExtentsProp[name];
			if (dataExtentsState[name] == null) {
				dataExtentsState[name] = isArrayOfString(extentsProps)
					? [0, extentsProps.length]
					: extentsProps.slice();
			}
		});


		// xScale
		const xAttr = (initialXAttr.name === xAttrProp)
			? initialXAttr
			: getScale({
				dataExtents: dataExtentsProp, 
				attribute: xAttrProp,
				dataExtentsPrev: dataExtentsState
			}, [0, canvasDim.width]);


		// yScale
		const yAttr = (initialYAttr.name === yAttrProp)
			? initialYAttr
			: getScale({
				dataExtents: dataExtentsProp, 
				attribute: yAttrProp,
				dataExtentsPrev: dataExtentsState
			}, [canvasDim.height, 0]);
		
		// flatten data to plot
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
			dataExtents: {...dataExtentsState},
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
	
	handleXAxisZoom = (newDomain) => {
    	const { xAttr: initialXAttr } = this.state;
		const { scale, extents, name } = initialXAttr;

		newDomain[0] = Math.max(extents[0], newDomain[0]);
		newDomain[1] = Math.min(extents[1], newDomain[1]);
		
		
		this.clearAxisAndChartOnCanvas();
		this.setState({
			...this.state,
			xAttr: {
				...this.state.xAttr,
				scale: scale.copy().domain(newDomain)
			}
		});
		if (this.props.onScatterPanZoom) {
			this.props.onScatterPanZoom(
				[name],
				[newDomain],
				false
			);
		}		
    }

    handleYAxisZoom = (newDomain) => {
    	const { yAttr: initialYAttr } = this.state;
		const { scale, extents, name } = initialYAttr;

		newDomain[0] = Math.max(extents[0], newDomain[0]);
		newDomain[1] = Math.min(extents[1], newDomain[1]);

    	this.clearAxisAndChartOnCanvas();		
		this.setState({
			...this.state,
			yAttr: {
				...this.state.yAttr,
				scale: scale.copy().domain(newDomain)
			}
		});
		if (this.props.onScatterPanZoom) {
			this.props.onScatterPanZoom(
				[name],
				[newDomain],
				false
			);
		}		
    }


	handleZoom = (mouseXY, e) => {
		if (this.panInProgress) return;

		const {
			xAttr: {scale: initialXScale, extents: xExtents, name: xName, ordinary: xOrdinary},
			yAttr: {scale: initialYScale, extents: yExtents, name: yName, ordinary: yOrdinary}
		} = this.state;

        const SCALE_FACTOR = 0.001;
        const zoomFactor = Math.max(Math.min(1 + e.deltaY * SCALE_FACTOR, 3), 0.1);
        const centerX = initialXScale.invert(mouseXY[0]),
            beginX = initialXScale.domain()[0],
            endX = initialXScale.domain()[1];
		const centerY = initialYScale.invert(mouseXY[1]),
            beginY = initialYScale.domain()[0],
            endY = initialYScale.domain()[1];

        const newDomainX = [
            Math.max(centerX - (centerX - beginX)*zoomFactor, xExtents[0]),
            Math.min(centerX + (endX - centerX)*zoomFactor, xExtents[1])
		];
		const newScaleX = initialXScale.copy().domain(newDomainX);
		const stepX = !xOrdinary
			? 0
			: Math.abs(newScaleX(0) - newScaleX(1));

        const newDomainY = [
            Math.max(centerY - (centerY - beginY)*zoomFactor, yExtents[0]),
            Math.min(centerY + (endY - centerY)*zoomFactor, yExtents[1])
		];
		const newScaleY = initialYScale.copy().domain(newDomainY);
		const stepY = !yOrdinary
			? 0
			: Math.abs(newScaleY(0) - newScaleY(1));

		
		this.clearAxisAndChartOnCanvas();
		this.setState({
			...this.state,
			xAttr: {
				...this.state.xAttr,
				scale: newScaleX,
				step: stepX
			},
			yAttr: {
				...this.state.yAttr,
				scale: newScaleY,
				step: stepY
			}
		});
		if (this.props.onScatterPanZoom) {
			this.props.onScatterPanZoom(
				[xName, yName],
				[newDomainX, newDomainY],
				false
			);
		}
	}

    panHelper = (mouseXY, initialXAttr, initialYAttr, {dx, dy}) => {
		const {
			scale: initialXScale,
			extents: xExtents,
			ordinary: xOrdinary
		} = initialXAttr;

		const {
			scale: initialYScale,
			extents: yExtents,
			ordinary: yOrdinary
		} = initialYAttr;

        const newDomainX = initialXScale.range()
                            .map(x => x - dx)
							.map(initialXScale.invert);
		newDomainX[0] = Math.max(xExtents[0], newDomainX[0]);
		newDomainX[1] = Math.min(xExtents[1], newDomainX[1]);
							
		const newDomainY = initialYScale.range()
							.map(y => y - dy)
							.map(initialYScale.invert);
		newDomainY[0] = Math.max(yExtents[0], newDomainY[0]);
		newDomainY[1] = Math.min(yExtents[1], newDomainY[1]);
					
		const updatedScaleX = initialXScale.copy().domain(newDomainX);
		const updatedScaleY = initialYScale.copy().domain(newDomainY);

		const stepX = !xOrdinary ? 0: Math.abs(updatedScaleX(0) - updatedScaleX(1));
		const stepY = !yOrdinary ? 0: Math.abs(updatedScaleY(0) - updatedScaleY(1));
		
        return {
			xAttr: {
				...initialXAttr,
				scale: updatedScaleX,
				step: stepX
			},
			yAttr: {
				...initialYAttr,
				scale: updatedScaleY,
				step: stepY
			}
        }
    }

    handlePan = (mouseXY, dxdy, e) => {
        if (!this.waitingForPanAnimationFrame) {
            this.waitingForPanAnimationFrame = true;

			const {xAttr, yAttr} = this.state;
			const state = this.panHelper(mouseXY, xAttr, yAttr, dxdy);
			const {
				xAttr: newXAttr,
				yAttr: newYAttr
			} = state;

            this.panInProgress = true;

            this.triggerEvent('pan', state, e);

            requestAnimationFrame(() => {
                this.waitingForPanAnimationFrame = false;
                this.clearAxisAndChartOnCanvas();
				this.draw({trigger: 'pan'});
				if (this.props.onScatterPanZoom) {
					const xName = newXAttr.name;
					const yName = newYAttr.name;
					const domainX = newXAttr.scale.domain();
					const domainY = newYAttr.scale.domain();
					this.props.onScatterPanZoom(
						[xName, yName],
						[domainX, domainY],
						true
					);
				}						
            });
        }
    }

    handlePanEnd = (mouseXY, dxdy, e) => {
		const {xAttr, yAttr} = this.state;		
        const state = this.panHelper(mouseXY, xAttr, yAttr, dxdy);
        this.panInProgress = false;

        const {
			xAttr: newXAttr,
			yAttr: newYAttr
        } = state;

        this.triggerEvent('panend', state, e);

        requestAnimationFrame(() => {
			this.clearAxisAndChartOnCanvas();
            this.setState({
				...this.state,
				xAttr: newXAttr,
				yAttr: newYAttr
			});
			if (this.props.onScatterPanZoom) {
				const xName = newXAttr.name;
				const yName = newYAttr.name;
				const domainX = newXAttr.scale.domain();
				const domainY = newYAttr.scale.domain();
				this.props.onScatterPanZoom(
					[xName, yName],
					[domainX, domainY],
					false
				);
			}								
        });
    }
	

	updateAttr = (attr, initialAttr, dataExtents) => {
		// const range = initialAttr.scale.range();
		// if (dataExtents[attr]) {
		// 	return getScale({
		// 		dataExtents,
		// 		attribute: attr
		// 	}, range);
		// }
		// return initialAttr;
		const domain = dataExtents[attr];
		if (domain == null) return initialAttr;

		const {scale: initialScale, ordinary} = initialAttr;
		const newScale = initialScale.copy().domain(domain);
		const step = !ordinary ? 0: Math.abs(newScale(0) - newScale(1));
		return {
			...initialAttr,
			scale: newScale,
			step
		};
	}
	updateExtents = (initialExtents, newExtents) => {
		Object.keys(newExtents).map(key => {
			const extents = newExtents[key].length 
				? newExtents[key].slice()
				: this.state.dataExtents[key].slice();
			
			initialExtents[key] = newExtents[key];
		});
		return initialExtents;
	}

	handleByOther = ({what, data, inProgress}) => {
		// must what: extents
		if (what !== 'extents') return;
		if (this.panInProgress) return;

		//console.log(data, inProgress)
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
			origDataExtents: this.props.dataExtents,
			subscribe: this.subscribe,
			unsubscribe: this.unsubscribe,
			getCanvasContexts: this.getCanvasContexts,
			handleXAxisZoom: this.handleXAxisZoom,
			handleYAxisZoom: this.handleYAxisZoom,
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
							onPan={this.handlePan}
							onPanEnd={this.handlePanEnd}
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
