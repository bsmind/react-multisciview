import React from 'react';
import PropTypes from 'prop-types';

import { fitWidth } from 'react-multiview/lib/helper';
import { markerProvider } from 'react-multiview/lib/series';
import { 
    ChartCanvas, Chart, Series 
} from 'react-multiview/lib/core';
import {
    ColorLegend
} from 'react-multiview/lib/legends';
import { XAxis, YAxis } from 'react-multiview/lib/axes';
import { ScatterSeries, CircleMarker } from 'react-multiview/lib/series';
import { DataBox } from 'react-multiview/lib/indicators';

import {
    extent as d3Extent,
    min,
    max
} from 'd3-array';

import {
    scaleLinear
} from 'd3-scale';

import uniqBy from 'lodash.uniqby';
import get from 'lodash.get';

import randomColor from 'randomcolor';

import { sortAlphaNum } from '../../../utils';

// const getColorsByGroup = (groups) => {
//     const colors = randomColor({
//         luminosity: 'light',
//         hue: 'random',
//         count: groups.length
//     });

//     const colorsByGroup = {};
//     groups.forEach((group, index) => {
//         colorsByGroup[group] = colors[index];
//     });

//     return colorsByGroup;
// }

class ScatterChart extends React.Component {
    constructor(props) {
        super(props);
        
        this.state = {
            markerGen: this.getMarkerProvider(props)
        };
    }

    componentWillReceiveProps(nextProp) {
        this.setState({
            markerGen: this.getMarkerProvider(nextProp)
        });
    }

    getMarkerProvider = (props = this.props) => {
        const { 
            zAttr,
            colorsByGroup,
            ratio 
        } = props;

        let  mProvider = markerProvider(
            d => get(d, zAttr),
            {
                type: 'square',
                width: 6,
                height: 6,
                defaultColor: '#FF0000',
                style: {
                    strokeWidth: 1,
                    opacity: 0.3
                }
            },
            ratio 
        );

        if (zAttr === 'sample') {
            mProvider = mProvider.colorSet(colorsByGroup);
        }

        return mProvider;
    }

    getScatterChartCanvasNode = () => {
    	if (this.ScatterChartCanvasNode) return this.ScatterChartCanvasNode;
    }

    handleDataRequest = (dataID) => {
        if (this.props.onDataRequest)
            this.props.onDataRequest(dataID);
    }

    render() {
        const margin= {left: 60, right: 40, top: 10, bottom: 60};
        const {
            width, height, ratio,
            data, dimension,
            xAttr, yAttr, zAttr,
            xAccessor, yAccessor, zAccessor,
            onScatterPanZoom,
            imgPool
        } = this.props;

        const { markerGen } = this.state;
        markerGen.calculateMarkers(data);

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
                data={data}
                dataExtents={dimension}
                dataAccessor={(d, name) => get(d, name)}
                xAttr={xAttr}
                yAttr={yAttr}
                zAttr={zAttr}
                imgPool={imgPool}
                onScatterPanZoom={onScatterPanZoom}
                onDataRequest={this.handleDataRequest}
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
                        markerProvider={markerGen}
                    />
                </Series>        
                <ColorLegend 
                    legendOrigin={{
                        x: Math.round((width - margin.left - margin.right)/6) * 4, 
                        y: Math.round((height - margin.top - margin.bottom)/10) * 0
                    }}
                    legendWidth={200}
                    legendHeight={35}
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
                        'fit_peaks_sigma1'
                    ]}           
                />       
            </ChartCanvas>
        );
    }
}

ScatterChart = fitWidth(ScatterChart);
export default ScatterChart;
