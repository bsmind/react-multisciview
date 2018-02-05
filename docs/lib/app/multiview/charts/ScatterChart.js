import React from "react";
import PropTypes from "prop-types";

import { fitWidth } from "react-multiview/lib/helper";
import { markerProvider } from "react-multiview/lib/series";
import { ChartCanvas, Chart, Series } from "react-multiview/lib/core";
import { ColorLegend } from "react-multiview/lib/legends";
import { XAxis, YAxis } from "react-multiview/lib/axes";
import { ScatterSeries } from "react-multiview/lib/series";
import { DraggableDataBox, Pivots } from "react-multiview/lib/indicators";

import get from "lodash.get";
import { sortAlphaNum, getColorInterpolator } from "../utils";

import { scaleSequential, 
	interpolateViridis, interpolateInferno, interpolatePlasma,
	interpolateRainbow,
	scaleLinear } from "d3-scale";
import { extent as d3Extent } from "d3-array";

class ScatterChart extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			markerProvider: this.getMarkerProvider(props)
		};
	}

	getMarkerProvider(props = this.props) {
		const {
			colorsByGroup,
			zAttr,
			ratio,
			opacity,
			data,
			dimension,
			colorScheme
		} = props;

		const shape = {
			type: "square",
			width: 6,
			height: 6,
			defaultColor: "#FF0000",
			style: {
				strokeWidth: 1,
				opacity
			}
		};
		const {type, colorDomain} = colorScheme;
		const interpolate = getColorInterpolator(type); //interpolateRainbow;
		const colorScale = zAttr === "sample"
			? d => colorsByGroup[d]
			: scaleSequential(interpolate).domain(colorDomain).clamp(true)

		const mProvider = markerProvider(d => get(d, zAttr), shape, ratio);
		mProvider.colorScale(colorScale);


		if (zAttr === "sample") {
			mProvider.colorSet(colorsByGroup);
		}
		mProvider.calculateMarkers(data);
		return mProvider;
	}

	componentWillReceiveProps(nextProps) {
		const mProvider = this.getMarkerProvider(nextProps);
		this.setState({ markerProvider: mProvider });
	}

    getScatterChartCanvasNode = () => {
    	if (this.ScatterChartCanvasNode) return this.ScatterChartCanvasNode;
    }

    handleDataRequest = (dataID, priority) => {
    	// console.log('handleDataRequest: ', dataID)
    	if (this.props.onDataRequest)
    		this.props.onDataRequest(dataID, priority);
    }

    handleSelectDataItems = (selectedDataList) => {
    	if (this.props.onSelectDataItems)
    		this.props.onSelectDataItems(selectedDataList);
    }

    render() {
    	const {
    		width, height, margin, ratio,
    		data, dimension, seriesName, samples,
    		xAttr, yAttr, zAttr,
    		xAccessor, yAccessor, zAccessor,
    		onScatterPanZoom,
    		imgPool, showImage, minPoints, minImageSize,
    	} = this.props;

    	// console.log(markerProvider)
    	const { markerProvider } = this.state;

    	const databoxSortor = info => {
    		const sorted = info.sort((a, b) => sortAlphaNum(a.key, b.key));
    		const index = sorted.findIndex(d => d.key === "sample");
    		sorted.splice(0, 0, sorted.splice(index, 1)[0]);
    		return sorted;
		};
		
        const pivot = 'M0-48c-9.8 0-17.7 7.8-17.7 17.4 0 15.5 17.7 30.6 17.7 30.6s17.7-15.4 17.7-30.6c0-9.6-7.9-17.4-17.7-17.4z';		

    	return (
    		<ChartCanvas
    			ref={node => this.ScatterChartCanvasNode = node}
    			width={width}
    			height={height}
    			ratio={ratio}
    			margin={margin}
    			zIndex={1}
    			seriesName={seriesName}
    			samples={samples}
    			data={data}
    			dataExtents={dimension}
    			dataAccessor={(d, name) => get(d, name)}
    			xAttr={xAttr}
    			yAttr={yAttr}
    			zAttr={zAttr}
    			imgPool={imgPool}
    			showImage={showImage}
    			onScatterPanZoom={onScatterPanZoom}
    			onDataRequest={this.handleDataRequest}
    			// onSelectDataItems={this.handleSelectDataItems}
    		>
    			<XAxis
    				axisAt="bottom"
    				orient="bottom"
    				axisHeight={25}
    			/>
    			<YAxis
    				axisAt="left"
    				orient="left"
    				axisWidth={40}
    			/>
    			<Series>
    				<ScatterSeries
    					markerProvider={markerProvider}
    					minPoints={minPoints}
    					minImageSize={minImageSize}
    				/>
    			</Series>
				<Pivots 
					pivot={pivot}
					normal={'#000000'}
					accent={'#ff0000'}
					opacity={0.7}
					scale={0.25}
				/>				
				<DraggableDataBox 
					initialPos={{
						x: margin.left + 5,
						y: margin.top + 5
					}}
					width={150}
					height={200}
				/>
    		</ChartCanvas>
    	);
    }
}

ScatterChart = fitWidth(ScatterChart);
export default ScatterChart;
