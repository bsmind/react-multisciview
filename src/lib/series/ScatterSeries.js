import React from "react";
import PropTypes from "prop-types";

import { SubscriberExt } from "../core";
import { nest as d3Nest } from "d3-collection";
import ImgViewer from "./ImgViewer";

class ScatterSeries extends React.Component {
	constructor() {
		super();
		this.minDist = { x: null, y: null };
	}

	componentWillReceiveProps(nextProps) {
		const { minImageSize } = nextProps;
		if (this.__imgRefWidth || this.__imgRefHeight) {
			this.__imgRefWidth = Math.max(minImageSize, this.__imgRefWidth || minImageSize);
			this.__imgRefHeight = Math.max(minImageSize, this.__imgRefHeight || minImageSize);
			// forceUpdate();
		}
	}

    drawMarkersWithProvider = (ctx, moreProps) => {
    	const { markerProvider, shared: { origDataExtents, ratio } } = this.props;
    	const { plotData, dataExtents } = moreProps;
    	const { name: xName, scale: xScale, step: xStep, ordinary: xOrdinary, origExtents: xExtents } = moreProps.xAttr;
    	const { name: yName, scale: yScale, step: yStep, ordinary: yOrdinary, origExtents: yExtents } = moreProps.yAttr;

    	const nest = d3Nest()
    		.key(d => d.markerID)
    		.entries(plotData);

    	const xAccessor = d => {
    		return !xOrdinary
    			? xScale(d[xName])
    			: xScale(xExtents.length - xExtents.indexOf(d[xName]) - 1) + xStep / 2;
    	};

    	const yAccessor = d => {
    		return !yOrdinary
    			? yScale(d[yName])
    			: yScale(yExtents.length - yExtents.indexOf(d[yName]) - 1) - yStep / 2;
    	};

    	const xRange = xScale.range();
    	const yRange = yScale.range();
    	const inRange = (v, minv, maxv) => minv < v && v < maxv;

    	const dataKeys = Object.keys(dataExtents);
    	let minDistX, minDistY;
    	const pointSet = [];
    	nest.forEach(group => {
    		const { key: markerKey, values } = group;
    		values.forEach(d => {
    			const x = xAccessor(d);
    			const y = yAccessor(d);

    			// filter null values
    			if (x == null || y == null)
    				return;

    			// callback for data filter
    			const inDomain = dataKeys.map(key => {
    				const extents = dataExtents[key];

    				let value = d[key];
    				if (value == null) return true;
    				if (typeof value === "string") {
    					const tempExtents = origDataExtents[key];
    					value = tempExtents.length - tempExtents.indexOf(value) - 1 + 0.5;
    				}

    				return extents[0] <= value && value <= extents[1];
    			}).every(each => each);
    			if (!inDomain) return;

    			// callback for drawing
    			markerProvider.drawAt(ctx, x, y, markerKey);

    			// callback for hit test
    			if (this.__pixelData && d.colorID) {
    				const colorID = d.colorID;
    				const rgbDigits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(colorID);
    				const R = parseInt(rgbDigits[2]);
    				const G = parseInt(rgbDigits[3]);
    				const B = parseInt(rgbDigits[4]);
    				const px = Math.floor( (x) * ratio );
    				const py = Math.floor( (y) * ratio );

    				for (let ppy = py - 4; ppy <= py + 4; ++ppy) {
    					for (let ppx = px - 4; ppx <= px + 4; ++ppx) {
    						const pIndex = 4 * (this.__canvasWidth * ppy + ppx);
    						this.__pixelData[pIndex] = R;
    						this.__pixelData[pIndex + 1] = G;
    						this.__pixelData[pIndex + 2] = B;
    						this.__pixelData[pIndex + 3] = 255;
    					}
    				}
    			}

    			// callback for distance compute
    			if (!inRange(x, xRange[0], xRange[1]) || !inRange(y, yRange[1], yRange[0]))
    				return;


    			if (pointSet.length === 0) {
    				pointSet.push({ x, y });
    				return;
    			}

    			pointSet.forEach(p => {
    				const distX = Math.abs(p.x - x);
    				const distY = Math.abs(p.y - y);
    				minDistX = Math.min(minDistX || distX, distX);
    				minDistY = Math.min(minDistY || distY, distY);
    			});
    			pointSet.push({ x, y });
    		});
    	});
    }

    drawOnCanvas = (ctx, plotData, xAccessor, yAccessor, dataFilter, hitTestor, distComputor) => {
    	const { markerProvider } = this.props;

    	const nest = d3Nest()
    		.key(d => d.markerID)
    		.entries(plotData);

    	const pointSet = [], minDist = { x: null, y: null };
    	nest.forEach(group => {
    		const { key: markerKey, values } = group;
    		values.forEach(d => {
    			const x = xAccessor(d);
    			const y = yAccessor(d);

    			if (x == null || y == null) return;
    			if (!dataFilter(d)) return;

    			// callback for drawing
    			if (ctx) {
    				markerProvider.drawAt(ctx, x, y, markerKey);
    			}

    			// callback for hit test
    			if (hitTestor) hitTestor(x, y, d.colorID);

    			// callback for distance compute
    			if (distComputor) distComputor(x, y, minDist, pointSet);
    		});
    	});
    }

    drawOnCanvasForce = (ctx, pointSet, hitTestor) => {
    	const { markerProvider } = this.props;

    	const nest = d3Nest()
    		.key(d => d.markerID)
    		.entries(pointSet);

    	nest.forEach(group => {
    		const { key: markerKey, values } = group;
    		values.forEach(d => {
    			const x = d.x;
    			const y = d.y;

    			// callback for drawing
    			if (ctx) {
    				markerProvider.drawAt(ctx, x, y, markerKey);
    			}

    			// callback for hit test
    			if (hitTestor) hitTestor(x, y, d.colorID);
    		});
    	});
    }

    getAccessor = (attr) => {
    	const { ordinary, name, step, scale, origExtents } = attr;
    	return (d) => {
    		const value = d[name];
    		if (value == null) return null;
    		let scaledValue;
    		if (ordinary) {
    			const index = origExtents.indexOf(value);
    			const range = scale.range();
    			const sign = range[0] < range[1] ? 1 : -1;
    			scaledValue = scale(index) + sign * step / 2;
    		} else {
    			scaledValue = scale(value);
    		}
    		return scaledValue;
    	};
    }

    getDataFilter = (dataExtents, origDataExtents) => {
    	const dataKeys = Object.keys(dataExtents);
    	return d => {
    		return dataKeys.map(key => {
    			const extents = dataExtents[key];
    			let value = d[key];
    			if (value == null) return true;
    			if (typeof value === "string") {
    				const tempExtents = origDataExtents[key];
    				value = tempExtents.indexOf(value) + 0.5;
    			}
    			return extents[0] <= value && value <= extents[1];
    		}).every(each => each);
    	};
    }

    getHitTestor = (ratio, pixelData, width) => {
    	return (x, y, colorID) => {
    		if (pixelData && colorID) {
    			const rgbDigits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(colorID);
    			const R = parseInt(rgbDigits[2]);
    			const G = parseInt(rgbDigits[3]);
    			const B = parseInt(rgbDigits[4]);
    			const px = Math.floor( (x) * ratio );
    			const py = Math.floor( (y) * ratio );

    			for (let ppy = py - 4; ppy <= py + 4; ++ppy) {
    				for (let ppx = px - 4; ppx <= px + 4; ++ppx) {
    					const pIndex = 4 * (width * ppy + ppx);
    					pixelData[pIndex] = R;
    					pixelData[pIndex + 1] = G;
    					pixelData[pIndex + 2] = B;
    					pixelData[pIndex + 3] = 255;
    				}
    			}
    		}
    	};
    }

    getDistanceComputor = () => {
    	return (x, y, minDist, pointSet) => {
    		if (pointSet.length === 0) {
    			return;
    		}
    		pointSet.forEach(p => {
    			const distX = Math.abs(p.x - x);
    			const distY = Math.abs(p.y - y);
    			minDist.x = Math.min(minDist.x || distX, distX);
    			minDist.y = Math.min(minDist.y || distY, distY);
    		});
    	};
    }

    getDistanceComputorSum = (xRange, yRange) => {
    	const inRange = (v, minv, maxv) => minv < v && v < maxv;
    	return (x, y, sumDist, pointSet) => {
    		if (!inRange(x, xRange[0], xRange[1]) || !inRange(y, yRange[1], yRange[0])) return;
    		if (pointSet.length === 0) {
    			return;
    		}
    		pointSet.forEach(p => {
    			const distX = Math.abs(p.x - x);
    			const distY = Math.abs(p.y - y);
    			sumDist.x = sumDist.x + distX;
    			sumDist.y = sumDist.y + distY;
    			sumDist.count = sumDist.count + 1;
    		});
    	};
    }

    preDraw = (hitTest) => {
    	const { width, height, ratio, margin } = this.props.shared;
    	this.__hitCanvas = (hitTest.canvas) ? hitTest.canvas : null;
    	this.__hitCtx = (hitTest.ctx) ? hitTest.ctx : null;

    	this.__pixelData = null;
    	this.__pixel = null;
    	this.__canvasWidth = 0;
    	if (this.__hitCanvas && this.__hitCtx) {
    		const canvasWidth = Math.floor( width * ratio );
    		const canvasHeight = Math.floor( height * ratio );

    		this.__hitCtx.save();
    		this.__hitCtx.setTransform(1, 0, 0, 1, 0, 0);
    		this.__hitCtx.scale(ratio, ratio);
    		this.__hitCtx.translate(margin.left, margin.top);
    		this.__pixel = this.__hitCtx.getImageData(0, 0, canvasWidth, canvasHeight);
    		this.__pixelData = this.__pixel.data;
    		this.__canvasWidth = canvasWidth;
    	}
    }

    draw = (ctx, moreProps) => {
    	if (this.props.shared.showImage) {
    		return;
    	}

    	const { hitTest, xAttr, yAttr, dataExtents, plotData, enableHitTest } = moreProps;
		const { shared: { origDataExtents, ratio } } = this.props;
		
		//console.log(enableHitTest)

    	this.preDraw(hitTest);
    	const dataFilter = this.getDataFilter(dataExtents, origDataExtents);
    	const hitTestor = enableHitTest ? this.getHitTestor(ratio, this.__pixelData, this.__canvasWidth): null;
    	const distComputor = null; // this.getDistanceComputor(xAttr.scale.range(), yAttr.scale.range());
    	const xAccessor = this.getAccessor(xAttr);
    	const yAccessor = this.getAccessor(yAttr);

    	this.drawOnCanvas(ctx, plotData, xAccessor, yAccessor, dataFilter, hitTestor, distComputor);
    	this.postDraw();
    }

    postDraw = () => {
    	const { ratio, margin } = this.props.shared;

    	if (this.__pixelData && this.__pixel) {
    		this.__hitCtx.putImageData(this.__pixel, margin.left * ratio, margin.top * ratio);
    		this.__pixelData = null;
    		this.__pixel = null;
    		this.__canvasWidth = 0;
    		this.__hitCtx.restore();
    	}
    }

    // svg version of the draw function using MarkerProvider
    drawSVG = (moreProps) => {
    	const {
    		markerProvider,
    		shared: { origDataExtents }
    	} = this.props;

    	const {
    		xAttr,
    		yAttr,
    		plotData,
    		dataExtents
    	} = moreProps;

    	const {
    		name: xName,
    		scale: xScale,
    		step: xStep,
    		ordinary: xOrdinary,
    		origExtents: xExtents
    	} = xAttr;

    	const {
    		name: yName,
    		scale: yScale,
    		step: yStep,
    		ordinary: yOrdinary,
    		origExtents: yExtents
    	} = yAttr;

    	const nest = d3Nest()
    		.key(d => d.markerID)
    		.entries(plotData);

    	const xAccessor = d => {
    		return !xOrdinary
    			? xScale(d[xName])
    			: xScale(xExtents.length - xExtents.indexOf(d[xName]) - 1) + xStep / 2;
    	};

    	const yAccessor = d => {
    		return !yOrdinary
    			? yScale(d[yName])
    			: yScale(yExtents.length - yExtents.indexOf(d[yName]) - 1) - yStep / 2;
    	};

    	const points = [];
    	const dataKeys = Object.keys(dataExtents);
    	nest.forEach(group => {
    		const { key: markerKey, values } = group;
    		values.forEach(d => {
    			const x = xAccessor(d);
    			const y = yAccessor(d);

    			if (x == null || y == null)
    				return;

    			const inDomain = dataKeys.map(key => {
    				const extents = dataExtents[key];

    				let value = d[key];
    				if (value == null) return true;
    				if (typeof value === "string") {
    					const tempExtents = origDataExtents[key];
    					value = tempExtents.length - tempExtents.indexOf(value) - 1 + 0.5;
    				}

    				return extents[0] <= value && value <= extents[1];
    			}).every(each => each);
    			if (!inDomain) return;

    			points.push(
    				markerProvider.getSVG(x, y, markerKey, d._id)
    			);
    		});
    	});

    	return points;
    }

    updateRefImageSize = (minDist, numPoints, zoomFactor = 1) => {
    	const { minPoints, minImageSize } = this.props;
    	const MIN_IMAGE_SIDE = minImageSize;
    	const inversed = 1 / zoomFactor;
    	if (minDist.x == null && minDist.y == null && numPoints <= 1) {
    		// console.log('case 1: ', minDist, numPoints)
    		this.__imgRefWidth = (this.__imgRefWidth || 200) * inversed;
    		this.__imgRefHeight = (this.__imgRefHeight || 200) * inversed;
    	} else if (minDist.x < MIN_IMAGE_SIDE && minDist.y < MIN_IMAGE_SIDE && numPoints <= minPoints) {
    		// console.log('case 2: ', minDist, numPoints)
    		this.__imgRefWidth = (this.__imgRefWidth || MIN_IMAGE_SIDE) * inversed;
    		this.__imgRefHeight = (this.__imgRefHeight || MIN_IMAGE_SIDE) * inversed;
    	} else if ( (minDist.x >= MIN_IMAGE_SIDE || minDist.y >= MIN_IMAGE_SIDE) && numPoints <= minPoints) {
    		// console.log('case 3: ', minDist, numPoints)
    		this.__imgRefWidth = (this.__imgRefWidth || Math.floor(minDist.x)) * inversed;
    		this.__imgRefHeight = (this.__imgRefHeight || Math.floor(minDist.y)) * inversed;
    	} else if (minDist.x >= MIN_IMAGE_SIDE && minDist.y >= MIN_IMAGE_SIDE) {
    		// console.log('case 4: ', minDist, numPoints)
    		this.__imgRefWidth = (this.__imgRefWidth || Math.floor(minDist.x)) * inversed;
    		this.__imgRefHeight = (this.__imgRefHeight || Math.floor(minDist.y)) * inversed;
    	} else {
    		// console.log('case 5: do not render image', minDist, numPoints)
    		this.__imgRefWidth = null;
    		this.__imgRefHeight = null;
    	}
    }

    drawImage = (moreProps, ctx) => {
    	const { plotData, xAttr, yAttr, dataExtents, zoomFactor } = moreProps;
    	const { shared: { origDataExtents } } = this.props;
    	const { canvasDim, imageFilter } = this.props.shared;

    	if (plotData.length === 0) return;

    	const xAccessor = this.getAccessor(xAttr);
    	const yAccessor = this.getAccessor(yAttr);
    	const dataFilter = this.getDataFilter(dataExtents, origDataExtents);
    	const distComputor = this.getDistanceComputor();

    	const pointSet = [], minDist = { x: null, y: null };
    	plotData.forEach(d => {
    		if (d._id == null) {
    			console.log("unknown error:missing id ", d);
    			return;
    		}
    		const x = xAccessor(d);
    		const y = yAccessor(d);

    		if (x == null || y == null) return;
    		if (!dataFilter(d)) return;
    		if (x < 0 || x > canvasDim.width) return;
    		if (y < 0 || y > canvasDim.height) return;

    		if (distComputor) {
    			distComputor(x, y, minDist, pointSet);
    		}
    		pointSet.push({ x, y, ...d });
    	});

    	// cache
    	if (pointSet.length === 1) {
    		const point = pointSet[0];
    		this.__cache = {};
    		Object.keys(point).forEach(key => {
    			this.__cache[key] = point[key];
    		});
    	}

    	this.updateRefImageSize(minDist, pointSet.length, zoomFactor);
    	if (this.__imgRefWidth == null && this.__imgRefHeight == null) {
    		if (this.SubscriberExtNode == null) return;
    		const { getCanvasContexts } = this.props.shared;
    		ctx = ctx ? ctx : getCanvasContexts().chartOn;
    		this.SubscriberExtNode.preDraw(ctx);
    		this.drawOnCanvasForce(ctx, pointSet);
    		this.SubscriberExtNode.postDraw(ctx);
    		return;
    	}

    	const imageSet = [];
    	const { imgPool, handleImageRequest } = this.props.shared;
    	const { markerProvider } = this.props;
    	const pointSetToUse = pointSet.length ? pointSet : [this.__cache];

    	const imageRatio = Math.max(
    		this.__imgRefWidth / canvasDim.width || 0.1,
    		this.__imgRefHeight / canvasDim.height || 0.1);

    	const showGrid = pointSetToUse.length === 1 && imageRatio > 30;

    	pointSetToUse.forEach(d => {
    		if (d._id == null) {
    			console.log("error in ", d);
    			return;
    		}
    		imageSet.push(<ImgViewer
    			key={`imgViewer-${d._id}`}
    			x={xAccessor(d)}
    			y={yAccessor(d)}
    			imgRefWidth={this.__imgRefWidth}
    			imgRefHeight={this.__imgRefHeight}
    			id={d._id}
    			imgPool={imgPool}
    			onImageRequest={handleImageRequest}
    			showGrid={showGrid}
    			svgDim={canvasDim}
				backgroundRectRef={markerProvider.getSVGRef(d.markerID)}
				imageFilter={imageFilter}
    		/>);
    	});
    	return imageSet;
    }

    render() {
    	const { showImage } = this.props.shared;
    	const draw = showImage ? null : this.draw;
    	const drawSVG = showImage ? this.drawImage : null;

    	return <SubscriberExt
    		ref={node => this.SubscriberExtNode = node}
    		canvas={contexts => contexts.chartOn}
    		clip={true}
    		edgeClip={false}
    		draw={draw}
    		drawSVG={drawSVG}
    		useSVG={showImage}
    		drawOn={["pan"]}
    		shared={this.props.shared}
    	/>;
    }
}

ScatterSeries.propTypes = {
	minImageSize: PropTypes.number,
	minPoints: PropTypes.number,
	shared: PropTypes.shape({
		width: PropTypes.number,
		height: PropTypes.number,
		ratio: PropTypes.number,
		showImage: PropTypes.bool,
		canvasDim: PropTypes.shape({
			width: PropTypes.number,
			height: PropTypes.number,
		}),
		getCanvasContexts: PropTypes.func,
		imgPool: PropTypes.object,
		handleImageRequest: PropTypes.func,
		margin: PropTypes.shape({
			left: PropTypes.number,
			right: PropTypes.number,
			top: PropTypes.number,
			bottom: PropTypes.number
		})
	}),

	className: PropTypes.string,
	yAccessor: PropTypes.func,
	marker: PropTypes.func,
	markerProvider: PropTypes.func,
	markerProps: PropTypes.shape({
		r: PropTypes.oneOfType([
			PropTypes.number,
			PropTypes.func
		]),
		stroke: PropTypes.oneOfType([
			PropTypes.string,
			PropTypes.func
		]),
		fill: PropTypes.oneOfType([
			PropTypes.string,
			PropTypes.func
		]),
		opacity: PropTypes.oneOfType([
			PropTypes.number,
			PropTypes.func
		]),
		strokeWidth: PropTypes.oneOfType([
			PropTypes.number,
			PropTypes.func
		]),
	}),
	drawOrder: PropTypes.array,
	orderAccessor: PropTypes.func,
};

ScatterSeries.defaultProps = {
	className: ""
};


export default ScatterSeries;


