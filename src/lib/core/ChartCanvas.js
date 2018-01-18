import React from "react";
import PropTypes, { shape } from "prop-types";

import uniqueId from 'lodash.uniqueid';

import CanvasContainer from './CanvasContainer';
import EventHandler from './EventHandler';
import {XAxis, YAxis} from '../axes';
import MousePathTracker from './MousePathTracker';

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

import randomColor from 'randomcolor';

import {
	format as d3Format
} from 'd3-format';

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
		this.axisSelectInProgress = false;
		this.trackInProgress = false;
		this.otherInProgress = false;

		this.R = 0;
		this.G = 0;
		this.B = 0;
		this.dataHashIDByColor = {};
		this.dataHashColorByID = {};
		this.dataHashIndexByID = {};

		// off-canvas for hit test
		this.hitCanvas = null;
		this.hitCtx = null;
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
		if (this.hitCtx) {
			clearCanvas([this.hitCtx], this.props.ratio);
		}
	}

	clearMouseCoordCanvas = () => {
		const canvases = this.getCanvasContexts();
		if (canvases && canvases.mouseCoord) {
			clearCanvas([
				canvases.mouseCoord
			], this.props.ratio);
		}		
	}

	updateHitTestCanvas = (prop = this.props) => {
		const { ratio, width, height } = prop;
		this.hitCanvas = document.createElement('canvas');
		this.hitCanvas.width = Math.floor(width * ratio);
		this.hitCanvas.height = Math.floor(height * ratio);
		this.hitCanvas.style.width = width;
		this.hitCanvas.style.height = height;
		this.hitCtx = this.hitCanvas.getContext('2d');
	}

	componentDidMount() {
		const state = this.resetChart();
		this.setState({
			...this.state,
			...state
		});
		this.updateHitTestCanvas();
	}

	componentWillReceiveProps(nextProps) {
		const state = this.updateChart(nextProps);
		this.clearAxisAndChartOnCanvas();
		this.setState({
			...this.state,
			...state
		});
		const {
			width: widthPrev,
			height: heightPrev,
			ratio: ratioPrev
		} = this.props;
		const { width, height, ratio} = nextProps;

		if (widthPrev !== width ||
			heightPrev !== height ||
			ratio !== ratio) {
			this.updateHitTestCanvas(nextProps);
		}
	}

	shouldComponentUpdate(){
		const inProgress = this.panInProgress ||
						   this.otherInProgress ||
						   this.axisSelectInProgress ||
						   this.trackInProgress;
		return !inProgress;
	}

	getColorID = () => {
		this.R += 1;
		this.G += Math.floor(this.R / 255);
		this.B += Math.floor(this.G / 255);

		this.R = this.R % 255;
		this.G = this.G % 255;
		this.B = this.B % 255;

		//return {R: this.R, G: this.G, B: this.B};
		return `rgb(${this.R}, ${this.G}, ${this.B})`;
	}

	hashingData = (DataId, index) => {
		if (this.dataHashColorByID[DataId]) {
			this.dataHashIndexByID[DataId] = index;
			return this.dataHashColorByID[DataId];
		}

		// R, G, B
		const color = this.getColorID();
		this.dataHashIDByColor[color] = DataId;
		this.dataHashColorByID[DataId] = color;
		this.dataHashIndexByID[DataId] = index;
		return color;
	}

	resetChart = (props = this.props) => {
		const {
			data,
			dataExtents: dataExtentsProp,
			dataAccessor,
			xAttr: xAttrProp,
			yAttr: yAttrProp,
			zAttr: zAttrProp
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

		// zScale: only domain...
		const zAttr = {
			name: dataExtentsProp[zAttrProp] ? zAttrProp: 'unknown',
			extents: dataExtentsProp[zAttrProp] ? dataExtentsProp[zAttrProp].slice(): null,
			select: null,
			selectDomain: null,
		}
		
		// flatten data to plot
		const dimName = Object.keys(dataExtentsProp);
		const plotData = data.map((d, index) => {
			const flattened = {};
			dimName.forEach(name => {
				flattened[name] = dataAccessor(d, name);
			});
			flattened['_id'] = d._id;
			flattened['markerID']=d.markerID;
			flattened['item'] = d.item;

			// dataHash
			const colorID = this.hashingData(d._id, index);
			flattened['colorID']=colorID;

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
			zAttr,
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
			zAttr: zAttrProp
		} = props;
		const canvasDim = getCanvasDimension(props);

		const {
			dataExtents: dataExtentsState,
			xAttr: initialXAttr,
			yAttr: initialYAttr,
			zAttr: initialZAttr,
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

		const zAttr = (initialZAttr.name === zAttrProp)
			? initialZAttr
			: {
				name: dataExtentsProp[zAttrProp] ? zAttrProp: 'unknown',
				extents: dataExtentsProp[zAttrProp] ? dataExtentsProp[zAttrProp].slice(): null,
				select: null,
				selectDomain: (dataExtentsProp[zAttrProp] && isArrayOfString(dataExtentsProp[zAttrProp])) 
					? null
					: dataExtentsState[zAttrProp] 
						? dataExtentsState[zAttrProp].slice()
						: null
			}

		//console.log(dataExtentsProp)
		
		// flatten data to plot
		const plotData = data.map((d,index) => {
			const flattened = {};
			dimName.forEach(name => {
				flattened[name] = dataAccessor(d, name);
			});
			flattened['_id'] = d._id;
			flattened['markerID']=d.markerID;
			flattened['item']=d.item;

			// dataHash
			const colorID = this.hashingData(d._id, index);
			flattened['colorID']=colorID;
			
			return flattened;
		});

		return {
			plotData,
			dataExtents: {...dataExtentsState},
			xAttr,
			yAttr,
			zAttr,
			xAccessor: d => d[xAttr],
			yAccessor: d => d[yAttr]
		}		
	}

    triggerEvent = (type, props, e) => {
    	this.subscriptions.forEach(each => {
    		const state = {
    			...this.state,
				subscriptions: this.subscriptions,
				hitTest: {
					canvas: this.hitCanvas,
					ctx: this.hitCtx
				}
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
        if (!this.waitingForPanAnimationFrame && !this.axisSelectInProgress) {
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
	
	zAxisSelectHelper = (selectDomain, selectRange, initialZAttr, initialDataExtents) => {
		const {
			name,
			extents
		} = initialZAttr;

		const newZAttr = {
			...initialZAttr,
			select: selectRange.slice(),
			selectDomain: selectDomain.slice()
		};

		if (!isArrayOfString(extents) && initialDataExtents[name]) {
			return {
				zAttr: newZAttr,
				dataExtents: {
					...initialDataExtents,
					[name]: selectDomain.slice()
				}
			};
		}
		return {
			zAttr: newZAttr,
			dataExtents: initialDataExtents
		}
	}

	handleZAxisSelect = (selectDomain, selectRange, e) => {
		if (!this.panInProgress &&
			!this.waitingForPanAnimationFrame &&
			!this.waitingForAnimationFrame) 
		{
			this.waitingForAnimationFrame = true;
			this.__zAttr = this.__zAttr || this.state.zAttr;
			this.__dataExtents = this.__dataExtents || this.state.dataExtents;

			const {zAttr, dataExtents} = this.zAxisSelectHelper(
				selectDomain, selectRange,
				this.__zAttr, this.__dataExtents);

			this.__zAttr = zAttr;
			this.__dataExtents = dataExtents;
			this.axisSelectInProgress = true;
			this.triggerEvent('pan', {zAttr, dataExtents}, e);
			requestAnimationFrame(() => {
				this.waitingForAnimationFrame = false;
				this.clearAxisAndChartOnCanvas();
				this.draw({trigger: 'pan'});
				if (this.props.onScatterPanZoom && zAttr.name !== 'sample') {
					this.props.onScatterPanZoom(
						[zAttr.name],
						[selectDomain.slice()],
						true
					);
				}													
			});
		}
	}

	handleZAxisSelectEnd = (selectDomain, selectRange, e) => {
		const {zAttr, dataExtents} = this.zAxisSelectHelper(
			selectDomain, selectRange,
			this.__zAttr, this.__dataExtents
		);
		this.__zAttr = null;
		this.__dataExtents = null;
		this.axisSelectInProgress = false;
		this.triggerEvent('pan', {zAttr, dataExtents}, e);
		requestAnimationFrame(() => {
			this.clearAxisAndChartOnCanvas();
			this.setState({
				zAttr,
				dataExtents
			});
			// connect to pcp
			if (this.props.onScatterPanZoom && zAttr.name !== 'sample') {
				this.props.onScatterPanZoom(
					[zAttr.name],
					[selectDomain.slice()],
					false
				);
			}															
		});
	}

	handleZAxisSelectCancel = (e) => {
		const {name, extents} = this.state.zAttr;
		const newZAttr = {
			...this.state.zAttr,
			select: null,
			selectDomain: null
		};

		this.clearAxisAndChartOnCanvas();		
		if (this.state.dataExtents[name] && !isArrayOfString(extents)) {
			const newDataExtents = {
				...this.state.dataExtents,
				[name]: extents.slice()
			};	
			this.setState({zAttr: newZAttr, dataExtents: newDataExtents});		
			// connect to pcp
			if (this.props.onScatterPanZoom) {
				this.props.onScatterPanZoom(
					[name],
					[newZAttr.extents.slice()],
					false
				);
			}															
				
		} else {
			this.setState({zAttr: newZAttr});
		}	
	}
	

	updateAttr = (attr, initialAttr, dataExtents) => {
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
	updateZAttr = (initialZAttr, dataExtents) => {
		const { name, extents } = initialZAttr;
		if (isArrayOfString(extents) || dataExtents[name] == null)
			return initialZAttr;
		
		return {
			...initialZAttr,
			selectDomain: dataExtents[name].slice()
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
				this.__zAttr = this.__zAttr || this.state.zAttr;

				const newDataExtents = this.updateExtents(this.__dataExtents, data);				
				const newXAttr = this.updateAttr(this.props.xAttr, this.__xAttr, data);
				const newYAttr = this.updateAttr(this.props.yAttr, this.__yAttr, data);
				const newZAttr = this.updateZAttr(this.__zAttr, data);

				this.__dataExtents = newDataExtents;
				this.__xAttr = newXAttr;
				this.__yAttr = newYAttr;
				this.__zAttr = newZAttr;

				this.otherInProgress = true;

				this.triggerEvent('pan', {
					xAttr: newXAttr, 
					yAttr: newYAttr, 
					zAttr: newZAttr,
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
			this.__zAttr = this.__zAttr || this.state.zAttr;
		
			const newXAttr = this.updateAttr(this.props.xAttr, this.__xAttr, data);
			const newYAttr = this.updateAttr(this.props.yAttr, this.__yAttr, data);
			const newZAttr = this.updateZAttr(this.__zAttr, data);
			const newDataExtents = this.updateExtents(this.__dataExtents, data);				
			
			this.__xAttr = null;
			this.__yAttr = null;
			this.__zAttr = null;
			this.__dataExtents = null;
			
			this.otherInProgress = false;
			this.triggerEvent('pan', {
				xAttr: newXAttr, 
				yAttr: newYAttr, 
				zAttr: newZAttr,
				dataExtents: newDataExtents
			});
			requestAnimationFrame(() => {
				this.clearAxisAndChartOnCanvas();
				this.setState({...this.state,
					xAttr: newXAttr,
					yAttr: newYAttr,
					zAttr: newZAttr,
					dataExtents: newDataExtents
				});
			});		
		}
	}

	pickColor = (mouseXY, layerXY) => {
		//const canvas = contexts => contexts.chartOn;
		const ctx = this.hitCtx;//canvas(this.getCanvasContexts());
		const { margin, ratio } = this.props;
		
		// ctx.save()
		// ctx.setTransform(1, 0, 0, 1, 0, 0);
		// ctx.scale(ratio, ratio);
		const x = Math.round(mouseXY[0]);// * ratio + margin.left;
		const y = Math.round(mouseXY[1]);// * ratio + margin.top;

		const lx = layerXY[0];
		const ly = layerXY[1];
		
		const pixx = (x + margin.left) * ratio;
		const pixy = (y + margin.top) * ratio;
		const pixel = ctx.getImageData( pixx, pixy, 1, 1);
		const data = pixel.data;
		const rgba = 'rgba(' + data[0] + ', ' + data[1] + ', ' + data[2] + ', ' +
					(data[3]/255) + ')';

		// ctx.restore();
		return {
			x, y,
			data,
			rgba
		};
	}

	getHoveredDataItem = (mouseXY) => {
		const x = Math.round(mouseXY[0]);
		const y = Math.round(mouseXY[1]);
		if (this.hitCtx == null)
			return {x, y, info: null, id: null};

		const ctx = this.hitCtx;
		const { margin, ratio } = this.props;
		const pixx = (x + margin.left) * ratio;
		const pixy = (y + margin.top) * ratio;
		const pixel = ctx.getImageData(pixx, pixy, 1, 1);
		const data = pixel.data;
		const colorID = `rgb(${data[0].toString()}, ${data[1].toString()}, ${data[2].toString()})`;

		const dataID = this.dataHashIDByColor[colorID];
		if (dataID) {
			const formatSI = d3Format('.3s');
			const dataIndex = this.dataHashIndexByID[dataID];
			const data = this.state.plotData[dataIndex];
			const info = [];
			Object.keys(data).forEach(key => {
				if (key === '_id' || key === 'colorID' || key === 'markerID') return;

				const value = data[key];
				if (value == null) return;

				const keyTokens = key.split('.');
				const shortKey = keyTokens.length > 1 ? keyTokens[keyTokens.length - 1]: keyTokens[0];
				const formattedValue = typeof value === 'string' ? value: formatSI(value);

				info.push({
					key: shortKey,
					value: formattedValue
				});
			});
			return {x, y, info, id: dataID};
		}
		return {x, y, info: null, id: null};
	}

	handleMouseMove = (mouseXY, e) => {
		if (!this.waitingForAnimationFrame) {
			this.waitingForAnimationFrame = true;
			const state = this.getHoveredDataItem(mouseXY);
			this.triggerEvent("mousemove", {
				mouseXY: state
			}, e);
			requestAnimationFrame(() => {
				this.clearMouseCoordCanvas();
				this.draw({trigger: "mousemove"});
				this.waitingForAnimationFrame = false;
				if (this.props.onDataRequest && state.id) {
					this.props.onDataRequest(state.id);
				}
			});
		}
	}

	handleMouseTrack = (mouseXY, e) => {
		if (!this.waitingForAnimationFrame && !this.axisSelectInProgress && !this.panInProgress) {
			this.waitingForAnimationFrame = true;
			this.trackInProgress = true;

			//console.log(e.layerX, e.layerY)
			const state = this.pickColor(mouseXY, [e.layerX, e.layerY]);

			this.triggerEvent('track', {mouseXY: state}, e);
			requestAnimationFrame(() => {
				this.waitingForAnimationFrame = false;
				// i don't clear
				this.draw({trigger: 'track'});

			});
		}
	}

	handleMouseTrackEnd = (e) => {
		this.trackInProgress = false;
		this.triggerEvent('track', {mouseXY: null}, e);
		requestAnimationFrame(() => {
			this.clearMouseCoordCanvas();
		});
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
			imgPool: this.props.imgPool,
			subscribe: this.subscribe,
			unsubscribe: this.unsubscribe,
			getCanvasContexts: this.getCanvasContexts,
			handleXAxisZoom: this.handleXAxisZoom,
			handleYAxisZoom: this.handleYAxisZoom,
			handleZAxisSelect: this.handleZAxisSelect,
			handleZAxisSelectEnd: this.handleZAxisSelectEnd,
			handleZAxisSelectCancel: this.handleZAxisSelectCancel,
			hitTest: {
				canvas: this.hitCanvas,
				ctx: this.hitCtx
			},		
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
							panEnabled={true}
							onMouseMove={this.handleMouseMove}
							onPan={this.handlePan}
							onPanEnd={this.handlePanEnd}
							//onMouseTrack={this.handleMouseTrack}
							//onMouseTrackEnd={this.handleMouseTrackEnd}
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
