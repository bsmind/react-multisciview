import React from "react";
import PropTypes from "prop-types";

import uniqueId from "lodash.uniqueid";

import CanvasContainer from "./CanvasContainer";
import EventHandler from "./EventHandler";
import { ColorLegend } from "../legends";

import { dimension as getCanvasDimension, clearCanvas } from "./utils";
import { getScale } from "./scatterUtils";
import { cursorStyle, isArrayOfString } from "../utils";

import { format as d3Format } from "d3-format";
import { range as d3Range } from "d3-array";

class ChartCanvas extends React.Component {
	constructor(props) {
		super(props);
		const initialState = this.resetChart();
		this.state = {
			id: uniqueId("chartcanvas-"),
			...initialState,
			zoomFactor: 1
		};
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
		this.hitCanvas = document.createElement("canvas");
		this.hitCanvas.width = Math.floor(width * ratio);
		this.hitCanvas.height = Math.floor(height * ratio);
		this.hitCanvas.style.width = width;
		this.hitCanvas.style.height = height;
		this.hitCtx = this.hitCanvas.getContext("2d");
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
		this.setState({ ...state });
		const {
			width: widthPrev,
			height: heightPrev,
			ratio: ratioPrev
		} = this.props;
		const { width, height, ratio } = nextProps;

		if (widthPrev !== width ||
			heightPrev !== height ||
			ratioPrev !== ratio) {
			this.updateHitTestCanvas(nextProps);
		}
	}

	shouldComponentUpdate() {
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

		// return {R: this.R, G: this.G, B: this.B};
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
			samples,
			seriesName,
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
			name: dataExtentsProp[zAttrProp] ? zAttrProp : "unknown",
			extents: dataExtentsProp[zAttrProp] ? dataExtentsProp[zAttrProp].slice() : [0, 1],
			select: null,
			selectDomain: null,
		};

		// flatten data to plot
		/*eslint-disable */
		const dimName = Object.keys(dataExtentsProp);
		const plotData = data.map((d, index) => {
			const flattened = {};
			dimName.forEach(name => {
				flattened[name] = dataAccessor(d, name);
			});
			flattened["_id"] = d._id;
			flattened["markerID"] = d.markerID;
			flattened["item"] = d.item;

			// dataHash
			const colorID = this.hashingData(d._id, index);
			flattened["colorID"] = colorID;

			return flattened;
		});
		/* eslint-enable */

		const dataExtents = {};
		dimName.forEach(name => {
			dataExtents[name] = isArrayOfString(dataExtentsProp[name]) // eslint-disable-line
				? [0, dataExtentsProp[name].length]
				: dataExtentsProp[name].slice();
		});

		return {
			plotData,
			seriesName,
			samples: samples.slice(),
			dataExtents,
			xAttr,
			yAttr,
			zAttr,
			zoomFactor: 1,
		};
	}

	updateChart = (props = this.props) => {
		const {
			data,
			seriesName: seriesNameProps,
			samples: samplesProp,
			dataExtents: dataExtentsProp,
			dataAccessor,
			xAttr: xAttrProp,
			yAttr: yAttrProp,
			zAttr: zAttrProp,
		} = props;

		const canvasDim = getCanvasDimension(props);

		const {
			dataExtents: dataExtentsState,
			xAttr: initialXAttr,
			yAttr: initialYAttr,
			zAttr: initialZAttr,
		} = this.state;

		const dimName = Object.keys(dataExtentsProp);
		dimName.forEach(name => {
			const extentsProps = dataExtentsProp[name];
			const extentsState = dataExtentsState[name];
			if (extentsState == null) { // new field
				dataExtentsState[name] = isArrayOfString(extentsProps) // eslint-disable-line
					? [0, extentsProps.length]
					: extentsProps.slice();
			} else if (name !== initialXAttr.name && name !== initialYAttr.name) {
				dataExtentsState[name] = isArrayOfString(extentsProps) // eslint-disable-line
					? [0, extentsProps.length]
					: extentsProps.slice();
			} else {
				// expand one but ordinary
				if (isArrayOfString(extentsProps) && (xAttrProp !== name && yAttrProp !== name)) {
					extentsState[0] = 0; // eslint-disable-line
					extentsState[1] = extentsProps.length; // eslint-disable-line
				}
				// else {
				// 	extentsState[0] = Math.min(extentsState[0], extentsProps[0]);
				// 	extentsState[1] = Math.max(extentsState[1], exten[1]);
				// }
			}
		});
		// console.log(dataExtentsProp, dataExtentsState)

		// xScale
		const xAttr = getScale({
			dataExtents: dataExtentsProp,
			attribute: xAttrProp,
			dataExtentsPrev: dataExtentsState
		}, [0, canvasDim.width]);

		// yScale
		const yAttr =  getScale({
			dataExtents: dataExtentsProp,
			attribute: yAttrProp,
			dataExtentsPrev: dataExtentsState
		}, [canvasDim.height, 0]);

		// need to think
		const zAttr = (initialZAttr.name === zAttrProp)
			? {
				...initialZAttr,
				extents: dataExtentsProp[zAttrProp] ? dataExtentsProp[zAttrProp].slice() : [0, 1]
			}
			: {
				name: dataExtentsProp[zAttrProp] ? zAttrProp : "unknown",
				extents: dataExtentsProp[zAttrProp] ? dataExtentsProp[zAttrProp].slice() : [0, 1],
				select: null,
				selectDomain: (dataExtentsProp[zAttrProp] && isArrayOfString(dataExtentsProp[zAttrProp]))
					? null
					: dataExtentsState[zAttrProp]
						? dataExtentsState[zAttrProp].slice()
						: null
			};

		// flatten data to plot
		// todo: avoid unneccessary update...
		// (need to update markerID)
		// const samples, seriesName;
		// if (!isEqualArray(samplesProp, samplesState) || seriesNameProps !== seriesNameState) {
		/*eslint-disable */
		const plotData = data.map((d, index) => {
			const flattened = {};
			dimName.forEach(name => {
				flattened[name] = dataAccessor(d, name);
			});
			flattened["_id"] = d._id;
			flattened["markerID"] = d.markerID;
			flattened["item"] = d.item;

			// dataHash
			const colorID = this.hashingData(d._id, index);
			flattened["colorID"] = colorID;

			return flattened;
		});
		/* eslint-enable */
		const samples = samplesProp.slice();
		const seriesName = seriesNameProps;
		// } else {
		//	plotData = this.state.plotData;
		//	samples = samplesState;
		//	seriesName = seriesNameState;
		// }

		return {
			plotData,
			samples,
			seriesName,
			dataExtents: { ...dataExtentsState },
			xAttr,
			yAttr,
			zAttr,
			zoomFactor: 1
		};
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
    		each.listener(type, {
    			zoomFactor: 1,
    			...props
    		},
    		state, e);
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
		const { scale, extents, name, ordinary } = initialXAttr;

		if (ordinary) {
			newDomain[0] = Math.max(extents[0], newDomain[0]);
			newDomain[1] = Math.min(extents[1], newDomain[1]);
		}

		const newDataExtents = {
			...this.state.dataExtents,
			[name]: newDomain
		};

		// console.log(newDataExtents)

		this.clearAxisAndChartOnCanvas();
		this.setState({
			...this.state,
			xAttr: {
				...this.state.xAttr,
				scale: scale.copy().domain(newDomain)
			},
			dataExtents: newDataExtents,
			zoomFactor: 1
		});
		if (this.props.onScatterPanZoom) {
			this.props.onScatterPanZoom(newDataExtents, false);
		}
	}

    handleYAxisZoom = (newDomain) => {
    	const { yAttr: initialYAttr } = this.state;
    	const { scale, extents, name, ordinary } = initialYAttr;

    	if (ordinary) {
    		newDomain[0] = Math.max(extents[0], newDomain[0]);
    		newDomain[1] = Math.min(extents[1], newDomain[1]);
    	}

    	const newDataExtents = {
    		...this.state.dataExtents,
    		[name]: newDomain
    	};

    	this.clearAxisAndChartOnCanvas();
    	this.setState({
    		...this.state,
    		yAttr: {
    			...this.state.yAttr,
    			scale: scale.copy().domain(newDomain)
    		},
    		dataExtents: newDataExtents,
    		zoomFactor: 1
    	});
    	if (this.props.onScatterPanZoom) {
    		this.props.onScatterPanZoom(false, newDataExtents);
    	}
    }

	handleZoom = (mouseXY, e) => {
		if (this.panInProgress) return;

		const {
			xAttr: { scale: initialXScale, extents: xExtents, name: xName, ordinary: xOrdinary },
			yAttr: { scale: initialYScale, extents: yExtents, name: yName, ordinary: yOrdinary }
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
			Math.max(centerX - (centerX - beginX) * zoomFactor, xExtents[0]),
			Math.min(centerX + (endX - centerX) * zoomFactor, xExtents[1])
		];
		if (xOrdinary) {
			newDomainX[0] = Math.max(xExtents[0], newDomainX[0]); // eslint-disable-line
			newDomainX[1] = Math.min(xExtents[1], newDomainX[1]); // eslint-disable-line
		}
		const newScaleX = initialXScale.copy().domain(newDomainX);
		const stepX = !xOrdinary
			? 0
			: Math.abs(newScaleX(0) - newScaleX(1));

		const newDomainY = [
			Math.max(centerY - (centerY - beginY) * zoomFactor, yExtents[0]),
			Math.min(centerY + (endY - centerY) * zoomFactor, yExtents[1])
		];
		if (yOrdinary) {
			newDomainY[0] = Math.max(yExtents[0], newDomainY[0]); // eslint-disable-line
			newDomainY[1] = Math.min(yExtents[1], newDomainY[1]); // eslint-disable-line
		}
		const newScaleY = initialYScale.copy().domain(newDomainY);
		const stepY = !yOrdinary
			? 0
			: Math.abs(newScaleY(0) - newScaleY(1));

		const newDataExtents = {
			...this.state.dataExtents,
			[xName]: newDomainX.slice(),
			[yName]: newDomainY.slice()
		};
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
			},
			dataExtents: newDataExtents,
			zoomFactor
		});
		if (this.props.onScatterPanZoom) {
			this.props.onScatterPanZoom(newDataExtents, false);
		}
	}

    panHelper = (mouseXY, initialXAttr, initialYAttr, initialDataExtents, { dx, dy }) => {
    	const {
    		name: xName,
    		scale: initialXScale,
    		extents: xExtents,
    		ordinary: xOrdinary
    	} = initialXAttr;

    	const {
    		name: yName,
    		scale: initialYScale,
    		extents: yExtents,
    		ordinary: yOrdinary
    	} = initialYAttr;

    	const newDomainX = initialXScale.range()
    		.map(x => x - dx)
			.map(initialXScale.invert);
		if (xOrdinary) {
			newDomainX[0] = Math.max(xExtents[0], newDomainX[0]); // eslint-disable-line
			newDomainX[1] = Math.min(xExtents[1], newDomainX[1]); // eslint-disable-line
		}
    	const newDomainY = initialYScale.range()
    		.map(y => y - dy)
			.map(initialYScale.invert);
		if (yOrdinary) {
			newDomainY[0] = Math.max(yExtents[0], newDomainY[0]); // eslint-disable-line
			newDomainY[1] = Math.min(yExtents[1], newDomainY[1]); // eslint-disable-line
		}
    	const updatedScaleX = initialXScale.copy().domain(newDomainX);
    	const updatedScaleY = initialYScale.copy().domain(newDomainY);

    	const stepX = !xOrdinary ? 0 : Math.abs(updatedScaleX(0) - updatedScaleX(1));
    	const stepY = !yOrdinary ? 0 : Math.abs(updatedScaleY(0) - updatedScaleY(1));

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
    		},
    		dataExtents: {
    			...initialDataExtents,
    			[xName]: newDomainX,
    			[yName]: newDomainY
    		}
    	};
    }

    handlePan = (mouseXY, dxdy, e) => {
    	if (!this.waitingForPanAnimationFrame && !this.axisSelectInProgress) {
    		this.waitingForPanAnimationFrame = true;

    		this.__xAttr = this.__xAttr || this.state.xAttr;
    		this.__yAttr = this.__yAttr || this.state.yAttr;
    		this.__dataExtents = this.__dataExtents || this.state.dataExtents;
    		const state = this.panHelper(mouseXY, this.__xAttr, this.__yAttr, this.__dataExtents, dxdy);
    		const {
    			xAttr: newXAttr,
    			yAttr: newYAttr,
    			dataExtents: newDataExtents
    		} = state;
    		if (this.props.showImage) {
    			this.waitingForPanAnimationFrame = false;
    			this.clearAxisAndChartOnCanvas();
    			this.setState({
    				...this.state,
    				xAttr: newXAttr,
    				yAttr: newYAttr,
    				dataExtents: newDataExtents,
    				zoomFactor: 1
    			});
    			if (this.props.onScatterPanZoom) {
    				this.props.onScatterPanZoom(newDataExtents, false);
    			}
    			// this.__xAttr = null;
    			// this.__yAttr = null;
    			// this.__dataExtents = null;

    		} else {
    			this.panInProgress = true;
    			this.triggerEvent("pan", state, e);
    			requestAnimationFrame(() => {
    				this.waitingForPanAnimationFrame = false;
    				this.clearAxisAndChartOnCanvas();
    				this.draw({ trigger: "pan" });
    				if (this.props.onScatterPanZoom) {
    					this.props.onScatterPanZoom(newDataExtents, true);
    				}
    			});
    		}
    	}
    }

    handlePanEnd = (mouseXY, dxdy, e) => {
    	// const {xAttr, yAttr, dataExtents} = this.state;
    	const state = this.panHelper(mouseXY, this.__xAttr, this.__yAttr, this.__dataExtents, dxdy);
    	this.panInProgress = false;
    	this.__xAttr = null;
    	this.__yAttr = null;
    	this.__dataExtents = null;

    	const {
    		xAttr: newXAttr,
    		yAttr: newYAttr,
    		dataExtents: newDataExtents
    	} = state;

    	if (this.props.showImage) {
    		this.clearAxisAndChartOnCanvas();
    		this.setState({
    			...this.state,
    			xAttr: newXAttr,
    			yAttr: newYAttr,
    			dataExtents: newDataExtents
    		});
    		if (this.props.onScatterPanZoom) {
    			this.props.onScatterPanZoom(newDataExtents, false);
    		}
    	} else {
    		this.triggerEvent("panend", state, e);
    		requestAnimationFrame(() => {
    			this.clearAxisAndChartOnCanvas();
    			this.setState({
    				...this.state,
    				xAttr: newXAttr,
    				yAttr: newYAttr,
    				dataExtents: newDataExtents,
    				zoomFactor: 1
    			});
    			if (this.props.onScatterPanZoom) {
    				this.props.onScatterPanZoom(newDataExtents, false);
    			}
    		});
    	}
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
		};
	}

	handleZAxisSelect = (selectDomain, selectRange, e) => {
		if (!this.panInProgress &&
			!this.waitingForPanAnimationFrame &&
			!this.waitingForAnimationFrame) {
			this.waitingForAnimationFrame = true;
			this.__zAttr = this.__zAttr || this.state.zAttr;
			this.__dataExtents = this.__dataExtents || this.state.dataExtents;

			const { zAttr, dataExtents } = this.zAxisSelectHelper(selectDomain, selectRange, this.__zAttr, this.__dataExtents);
			if (this.props.showImage) {
				this.waitingForAnimationFrame = false;
				this.__zAttr = null;
				this.__dataExtents = null;
				this.clearAxisAndChartOnCanvas();
				this.setState({ zAttr, dataExtents });
				if (this.props.onScatterPanZoom && zAttr.name !== "sample") {
					this.props.onScatterPanZoom(dataExtents, false);
				}
			} else {
				this.__zAttr = zAttr;
				this.__dataExtents = dataExtents;
				this.axisSelectInProgress = true;
				this.triggerEvent("pan", { zAttr, dataExtents }, e);
				requestAnimationFrame(() => {
					this.waitingForAnimationFrame = false;
					this.clearAxisAndChartOnCanvas();
					this.draw({ trigger: "pan" });
					if (this.props.onScatterPanZoom && zAttr.name !== "sample") {
						this.props.onScatterPanZoom(dataExtents, true);
					}
				});
			}
		}
	}

	handleZAxisSelectEnd = (selectDomain, selectRange, e) => {
		const { zAttr, dataExtents } = this.zAxisSelectHelper(
			selectDomain, selectRange,
			this.__zAttr, this.__dataExtents
		);
		this.__zAttr = null;
		this.__dataExtents = null;
		this.axisSelectInProgress = false;
		if (this.props.showImage) {
			this.clearAxisAndChartOnCanvas();
			this.setState({ zAttr, dataExtents });
			if (this.props.onScatterPanZoom && zAttr.name !== "sample") {
				this.props.onScatterPanZoom(dataExtents, false);
			}
		} else {
			this.triggerEvent("pan", { zAttr, dataExtents }, e);
			requestAnimationFrame(() => {
				this.clearAxisAndChartOnCanvas();
				this.setState({ zAttr, dataExtents });
				// connect to pcp
				if (this.props.onScatterPanZoom && zAttr.name !== "sample") {
					this.props.onScatterPanZoom(dataExtents, false);
				}
			});
		}
	}

	handleZAxisSelectCancel = (e) => { // eslint-disable-line
		const { name, extents } = this.state.zAttr;
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
			this.setState({ zAttr: newZAttr, dataExtents: newDataExtents });
			// connect to pcp
			if (this.props.onScatterPanZoom) {
				this.props.onScatterPanZoom(newDataExtents, false);
			}
		} else {
			this.setState({ zAttr: newZAttr });
		}
	}


	updateAttr = (attr, initialAttr, dataExtents) => {
		const domain = dataExtents[attr];
		if (domain == null) return initialAttr;

		const { scale: initialScale, ordinary } = initialAttr;
		const newScale = initialScale.copy().domain(domain);
		const step = !ordinary ? 0 : Math.abs(newScale(0) - newScale(1));
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
			// const extents = newExtents[key].length
			// 	? newExtents[key].slice()
			// 	: this.state.dataExtents[key].slice();

			initialExtents[key] = newExtents[key];
		});
		return initialExtents;
	}

	handleByOther = ({ what, data, inProgress }) => {
		// must what: extents
		if (what !== "extents") return;
		if (this.panInProgress) return;

		// console.log(data, inProgress)
		if (inProgress && this.props.showImage) {
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

				this.triggerEvent("pan", {
					xAttr: newXAttr,
					yAttr: newYAttr,
					zAttr: newZAttr,
					dataExtents: newDataExtents
				});
				requestAnimationFrame(() => {
					this.waitingForAnimationFrame = false;
					this.clearAxisAndChartOnCanvas();
					this.draw({ trigger: "pan" });
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
			this.triggerEvent("pan", {
				xAttr: newXAttr,
				yAttr: newYAttr,
				zAttr: newZAttr,
				dataExtents: newDataExtents
			});
			requestAnimationFrame(() => {
				this.clearAxisAndChartOnCanvas();
				this.setState({ ...this.state,
					xAttr: newXAttr,
					yAttr: newYAttr,
					zAttr: newZAttr,
					dataExtents: newDataExtents
				});
			});
		}
	}

	getHoveredDataItem = (mouseXY) => {
		const x = Math.round(mouseXY[0]);
		const y = Math.round(mouseXY[1]);
		if (this.hitCtx == null)
			return { x, y, info: null, id: null };

		const ctx = this.hitCtx;
		const { margin, ratio } = this.props;
		const pixx = (x + margin.left) * ratio;
		const pixy = (y + margin.top) * ratio;
		const pixel = ctx.getImageData(pixx, pixy, 1, 1);
		const data = pixel.data;
		const colorID = `rgb(${data[0].toString()}, ${data[1].toString()}, ${data[2].toString()})`;

		const dataID = this.dataHashIDByColor[colorID];
		if (dataID) {
			const formatSI = d3Format(".3s");
			const dataIndex = this.dataHashIndexByID[dataID];
			const data = this.state.plotData[dataIndex];
			const info = [];
			Object.keys(data).forEach(key => {
				if (key === "_id" || key === "colorID" || key === "markerID") return;

				const value = data[key];
				if (value == null) return;

				const keyTokens = key.split(".");
				const shortKey = keyTokens.length > 1 ? keyTokens[keyTokens.length - 1] : keyTokens[0];
				const formattedValue = typeof value === "string" ? value : formatSI(value);

				info.push({
					key: shortKey,
					value: formattedValue
				});
			});
			return { x, y, info, id: dataID };
		}
		return { x, y, info: null, id: null };
	}

	handleMouseMove = (mouseXY, e) => {
		return;
		if (!this.waitingForAnimationFrame) { // eslint-disable-line
			this.waitingForAnimationFrame = true;
			const state = this.getHoveredDataItem(mouseXY);
			this.triggerEvent("mousemove", {
				mouseXY: state
			}, e);
			requestAnimationFrame(() => {
				this.clearMouseCoordCanvas();
				this.draw({ trigger: "mousemove" });
				this.waitingForAnimationFrame = false;
				if (this.props.onDataRequest && state.id) {
					this.props.onDataRequest(state.id);
				}
			});
		}
	}

	searchDataItemOnPath = (startXY, endXY) => {
		const hitCtx = this.hitCtx;
		if (hitCtx == null) return;

		const { margin, ratio, width, height } = this.props;
		const canvasWidth = Math.floor( width * ratio );
		const canvasHeight = Math.floor( height * ratio );

		const startX = Math.round( (startXY[0] + margin.left) * ratio );
		const endX = Math.round( (endXY[0] + margin.left) * ratio );
		const startY = Math.round( (startXY[1] + margin.top) * ratio );
		const endY = Math.round( (endXY[1] + margin.top) * ratio );

		const pixelData = hitCtx.getImageData(0, 0, canvasWidth, canvasHeight).data;

		const timestamp = Date.now();
		const points = d3Range(11).map(i => {
			const t = i / 10;
			return {
				x: Math.floor( startX * (1 - t) + endX * t),
				y: Math.floor( startY * (1 - t) + endY * t)
			};
		});

		const prev = null;
		points.map(p => {
			const isSame = prev && (prev.x === p.x && prev.y === p.y);
			if (!isSame) {
				// search in 5x5 for each position
				for (let ppy = p.y - 2; ppy <= p.y + 2; ++ppy) {
					for (let ppx = p.x - 2; ppx <= p.x + 2; ++ppx) {
						const pIndex = 4 * (canvasWidth * ppy + ppx);
						const r = pixelData[pIndex];
						const g = pixelData[pIndex + 1];
						const b = pixelData[pIndex + 2];
						const colorID = `rgb(${r}, ${g}, ${b})`;
						const dataID = this.dataHashIDByColor[colorID];
						if (dataID && this.__selected[dataID] == null) {
							const dataIndex = this.dataHashIndexByID[dataID];
							const data = { ...this.state.plotData[dataIndex] };
							this.__selected[dataID] = {
								timestamp,
								data
							};
						}
					}
				}
				// end search
			}
		});
	}

	handleMouseTrack = (startXY, endXY, e) => {
		if (!this.waitingForAnimationFrame && !this.axisSelectInProgress && !this.panInProgress) {
			this.waitingForAnimationFrame = true;
			this.trackInProgress = true;

			this.__selected = this.__selected || {};
			this.searchDataItemOnPath(startXY, endXY);

			this.triggerEvent("track", { trackXY: [startXY, endXY] }, e);
			requestAnimationFrame(() => {
				this.waitingForAnimationFrame = false;
				// i don't clear
				this.draw({ trigger: "track" });
			});
		}
	}

	handleMouseTrackEnd = (e) => {
		this.trackInProgress = false;
		if (this.props.onSelectDataItems) {
			this.props.onSelectDataItems({ ...this.__selected });
		}
		this.__selected = null;
		this.triggerEvent("track", { trackXY: null }, e);
		requestAnimationFrame(() => {
			this.clearMouseCoordCanvas();
		});
	}

	render() {
		const { margin } = this.props;
    	const divStyle = {
    		position: "relative",
    		width: this.props.width,
			height: this.props.height,
			// overflow: 'scroll',
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
			showImage: this.props.showImage,
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
			handleImageRequest: this.props.onDataRequest,
			handleImageZoom: this.handleZoom,
			zoomFactor: this.state.zoomFactor,
			handlePan: this.handlePan,
			handlePanEnd: this.handlePanEnd,
			hitTest: {
				canvas: this.hitCanvas,
				ctx: this.hitCtx
			},
			...this.state
		};

		const cursor = cursorStyle(true);

		const children = [], childrenWithHandler = [];
		React.Children.forEach(this.props.children, child => {
			if (!React.isValidElement(child)) return;
			if (child.type === ColorLegend) {
				childrenWithHandler.push(React.cloneElement(child, { shared }));
			} else
				children.push(React.cloneElement(child, { shared }));
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
					<defs>
						<clipPath id="chart-area-clip">
							<rect x={0} y={0} width={canvasDim.width} height={canvasDim.height} />
						</clipPath>
					</defs>
					{cursor}
					<g transform={`translate(${margin.left},${margin.top})`}>
						<g>
							{children}
						</g>
						<EventHandler
							ref={node => this.eventHandlerNode = node}
							width={canvasDim.width}
							height={canvasDim.height}
							onZoom={this.handleZoom}
							onMouseMove={this.handleMouseMove}
							onPan={this.handlePan}
							onPanEnd={this.handlePanEnd}
							onMouseTrack={this.handleMouseTrack}
							onMouseTrackEnd={this.handleMouseTrackEnd}
						/>
						<g>
							{childrenWithHandler}
						</g>
					</g>
				</svg>
			</div>
		);
	}
}

ChartCanvas.propTypes = {
	ratio: PropTypes.number,
	width: PropTypes.number,
	height: PropTypes.number,
	data: PropTypes.array,
	samples: PropTypes.array,
	seriesName: PropTypes.string,
	dataExtents: PropTypes.object,
	dataAccessor: PropTypes.func,
	xAttr: PropTypes.string,
	yAttr: PropTypes.string,
	zAttr: PropTypes.string,
	onScatterPanZoom: PropTypes.func,
	showImage: PropTypes.bool,
	margin: PropTypes.shape({
		left: PropTypes.number,
		right: PropTypes.number,
		top: PropTypes.number,
		bottom: PropTypes.number
	}),
	onDataRequest: PropTypes.func,
	onSelectDataItems: PropTypes.func,
	zIndex: PropTypes.number,
	imgPool: PropTypes.object,
	children: PropTypes.any,
	className: PropTypes.any
};


export default ChartCanvas;
