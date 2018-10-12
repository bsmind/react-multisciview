import React from "react";

import { fitWidth } from "react-multiview/lib/helper";
import { markerProvider } from "react-multiview/lib/series";
import { ChartCanvas, Chart, Series } from "react-multiview/lib/core";
import { ColorLegend } from "react-multiview/lib/legends";
import { XAxis, YAxis } from "react-multiview/lib/axes";
import { ScatterSeries } from "react-multiview/lib/series";
import { DraggableDataBox, Pivots } from "react-multiview/lib/indicators";

import { scaleSequential } from "d3-scale";
import get from "lodash.get";
import {getColorInterpolator} from "../../utils";


class ScatterChart extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            markerProvider: this.getMarkerProvider(props)
        };
    }

	getMarkerProvider = (props = this.props) => {
		const {
			colorsByGroup,
			zAttr,
			ratio,
			opacity,
			data,
			dimension,
            colorScheme,
            iconSize,
            iconType,
		} = props;
		const shape = {
			type: iconType,
			width: iconSize,
			height: iconSize,
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
        //console.log(zAttr, data)
        //console.log(colorDomain)
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
            onScatterPanZoom, dataExtents,
            imgPool, showImage, minPoints, minImageSize, imageColorTable,
            fontSize, iconSize, zoomSensitivity, imageScale,
        } = this.props;
        const { markerProvider } = this.state;
        const pivot = 'M0-48c-9.8 0-17.7 7.8-17.7 17.4 0 15.5 17.7 30.6 17.7 30.6s17.7-15.4 17.7-30.6c0-9.6-7.9-17.4-17.7-17.4z';		
        const attrParser = attr => {
            const tokens = attr.split('/');
            if (tokens.length == 1) return attr;
            let name = '';
            for (let i=0; i<tokens.length-1; i++)
                name = name + '/' + tokens[i].slice(0,4);
            name = name + '/' + tokens[tokens.length-1];
            return name;
        }

        //console.log(data);
        //console.log(dataExtents)
        //debugger;
        //console.log(fontSize)

        return (
            <ChartCanvas
                ref={node => this.ScatterChartCanvasNode = node}
                width={width}
                height={height}
                ratio={ratio}
                margin={margin}
                zIndex={1}
                seriesName={'scatter chart'}
                samples={samples}
                data={data}
                dataExtents={dimension}
                dataExtentsExt={dataExtents}
                dataAccessor={(d,name) => get(d, name)}
                xAttr={xAttr}
                yAttr={yAttr}
                zAttr={zAttr}
                imgPool={imgPool}
                showImage={showImage}
                imageColorTable={imageColorTable}
                onScatterPanZoom={onScatterPanZoom}
                onDataRequest={this.handleDataRequest}
                zoomSensitivity={zoomSensitivity}
                // onSelectDataItems={this.handleSelectDataItems}
            >
                <XAxis 
                    axisAt="bottom"
                    orient="bottom"
                    axisHeight={25}
                    labelStyle={{
                        fontSize: fontSize,
                        fontFamily: "Roboto, sans-serif",
                        textAnchor: "middle",
                        tickLabelFill: "#000000"
                    }}
                />
                <YAxis 
                    axisAt="left"
                    orient="left"
                    axisWidth={40}
                    labelStyle={{
                        fontSize: fontSize,
                        fontFamily: "Roboto, sans-serif",
                        textAnchor: "middle",
                        tickLabelFill: "#000000"
                    }}
                />
                <Series>
                    <ScatterSeries 
                        markerProvider={markerProvider}
                        minPoints={minPoints}
                        minImageSize={minImageSize}
                        imageScale={imageScale}
                    />
                </Series>
                <Pivots 
                    pivot={pivot} 
                    normal={'#000000'} 
                    accent={'#ff0000'} 
                    opacity={0.65} 
                    scale={Math.min(1.5, Math.max(0.35, 0.35 * (iconSize/12)))} 
                />
                <DraggableDataBox 
                    initialPos={{x: margin.left + 5, y: margin.top + 5}}
                    width={400}
                    height={600}
                    keyParser={attrParser}
                />
            </ChartCanvas>
        );
    }
}
ScatterChart = fitWidth(ScatterChart);
export default ScatterChart;