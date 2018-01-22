import React from 'react';
import PropTypes from 'prop-types';

import { fitWidth } from 'react-multiview/lib/helper';
import { markerProvider } from 'react-multiview/lib/series';
import { ChartCanvas, Chart, Series } from 'react-multiview/lib/core';
import { ColorLegend } from 'react-multiview/lib/legends';
import { XAxis, YAxis } from 'react-multiview/lib/axes';
import { ScatterSeries } from 'react-multiview/lib/series';
import { DataBox, MousePathTracker } from 'react-multiview/lib/indicators';

import get from 'lodash.get';
import { sortAlphaNum } from '../utils';

import { scaleSequential, interpolateViridis } from 'd3-scale';
import { extent as d3Extent } from 'd3-array';

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
            dimension
        } = props;

        // todo: shape go to vis reducer
        const shape = {
            type: 'square',
            width: 6,
            height: 6,
            defaultColor: '#FF0000',
            style: {
                strokeWidth: 1,
                opacity
            }
        }
        const colorScale = zAttr === 'sample'
            ? d => colorsByGroup[d]
            : dimension[zAttr] 
                ? scaleSequential(interpolateViridis).domain(dimension[zAttr])
                : scaleSequential(interpolateViridis).domain([0, 1]);

        let mProvider = markerProvider(d => get(d, zAttr), shape, ratio)
        mProvider.colorScale(colorScale);


        if (zAttr === 'sample') {
            mProvider.colorSet(colorsByGroup);
        }
        mProvider.calculateMarkers(data);
        return mProvider;    
    }

    componentWillReceiveProps(nextProps) {
        const mProvider = this.getMarkerProvider(nextProps);
        this.setState({markerProvider: mProvider});
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
            imgPool, showImage
        } = this.props;

        //console.log(markerProvider)
        const { markerProvider } = this.state;

        const databoxSortor = info => {
            const sorted = info.sort((a, b) => sortAlphaNum(a.key, b.key));
            const index = sorted.findIndex(d => d.key === 'sample');
            sorted.splice(0, 0, sorted.splice(index, 1)[0]);
            return sorted;
        };

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
                //onScatterPanZoom={onScatterPanZoom}
                onDataRequest={this.handleDataRequest}
                //onSelectDataItems={this.handleSelectDataItems}
            >
                <XAxis 
                    axisAt='bottom' 
                    orient='bottom' 
                    axisHeight={25} 
                />     
                <YAxis 
                    axisAt='left' 
                    orient='left' 
                    axisWidth={40} 
                />
                <Series>
                    <ScatterSeries
                        markerProvider={markerProvider}
                    />
                </Series>        
                    <ColorLegend 
                        orient={'vertical'}
                        tickOrient={'right'}
                        legendWidth={35}
                        legendHeight={150}
                        outerTickSize={0}
                        innerTickSize={4}
                        numTicks={3}
                        labelStyle={{
                            fontSize: 6,
                            fontFamily: 'Roboto, sans-serif',
                            tickLabelFill: '#000000'
                        }}
                    />
                <DataBox 
                    origin={{
                        x: Math.round((width - margin.left - margin.right)/6) * 4, 
                        y: Math.round((height - margin.top - margin.bottom)/10) * 3
                    }}     
                    infoSortor={databoxSortor}
                    hint={[
                        'sample',
                        'annealing_temperature',
                        'annealing_time',
                        'fit_peaks_alpha',
                        'fit_peaks_b',
                        'fit_peaks_chi_squared',
                        'fit_peaks_d0',
                        'fit_peaks_sigma1',
                        'sequence_ID'
                    ]}           
                />       
                <MousePathTracker 
                />
            </ChartCanvas>
        );
    }
}

ScatterChart = fitWidth(ScatterChart);
export default ScatterChart;
