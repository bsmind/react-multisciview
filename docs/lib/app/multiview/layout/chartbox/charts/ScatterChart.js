import React from 'react';
import PropTypes from 'prop-types';

import { fitWidth } from 'react-multiview/lib/helper';
import { markerProvider } from 'react-multiview/lib/series';
import { ChartCanvas, Chart, Series } from 'react-multiview/lib/core';
import { XAxis, YAxis } from 'react-multiview/lib/axes';
import { ScatterSeries, CircleMarker } from 'react-multiview/lib/series';

import {
    extent as d3Extent,
    min,
    max
} from 'd3-array';

import {
    scaleLinear
} from 'd3-scale';

import uniqBy from 'lodash.uniqby';

import randomColor from 'randomcolor';

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

    componentDidMount() {

    }

    componentWillReceiveProps(nextProps) {

    }

    shouldComponentUpdate(nextProps) {
        return true;        
    }

    render() {
        const margin= {left: 60, right: 40, top: 10, bottom: 60};
        const {
            width,
            height,
            ratio,
            data,
            xAttr,
            yAttr,
            xExtents,
            yExtents,
            xAccessor: xAccessorProp,
            yAccessor: yAccessorProp,
            zAccessor,
            xScale,
            yScale,
            xType,
            yType,
            groups,
            colorsByGroup,
            groupAccessor
        } = this.props;

        if (data == null)
            return null;

        let mProvider = markerProvider(
            zAccessor == null ? groupAccessor: zAccessor,
            {
                type: 'square',
                width: 6,
                height: 6,
                defaultColor: '#FF0000',
                style: {
                    strokeWidth: 1,
                    opacity: 0.5
                }
            },
            ratio 
        );
        if (zAccessor == null)
            mProvider = mProvider.colorSet(colorsByGroup);
        mProvider.calculateMarkers(data);

        let yAccessor;
        if (yType === 'str') {
            yAccessor =  d => {
                const index = yExtents.findIndex(each => each === yAccessorProp(d));
                return yExtents.length - index - 1;
            }
        } else {
            yAccessor = yAccessorProp;
        }

        let xAccessor;
        if (xType === 'str') {
            xAccessor = d => {
                const index = xExtents.findIndex(each => each === xAccessorProp(d));
                return index;
            }
        } else {
            xAccessor = xAccessorProp;
        }
        
        const markerProps = {
            r: 3,
            stroke: d => colorsByGroup[groupAccessor(d) || d],
            fill: d => colorsByGroup[groupAccessor(d) || d],
            opacity: 0.5,
            strokeWidth: 1
        }

        //console.log('ScatterChart: ', xExtents)
        //console.log(yExtents)

        return (
            <ChartCanvas
                width={width}
                height={height}
                ratio={ratio}
                margin={margin}
                data={data}
                xAttr={xAttr}
                xAccessor={xAccessor}
                xExtents={xExtents}
                xScale={scaleLinear()}
                xFlip={false}
                xPadding={0}
                clamp={true}
            >
                <Chart
                    id={1}
                    //height={height}
                    yAttr={yAttr}
                    yExtents={yExtents}
                    yScale={scaleLinear()}
                    yFlip={false}
                    yPadding={0}
                >
                    <XAxis 
                        axisAt='bottom' 
                        orient='bottom' 
                        axisHeight={25} 
                        ordinary={xType === 'str'}
                    />
                    <YAxis 
                        axisAt='left' 
                        orient='left' 
                        axisWidth={40} 
                        ordinary={yType === 'str'}
                    />
                    <Series>
                        <ScatterSeries
                            yAccessor={yAccessor}
                            marker={CircleMarker}
                            markerProps={markerProps}
                            markerProvider={mProvider}
                            drawOrder={groups}
                            orderAccessor={groupAccessor}
                        />
                    </Series>
                </Chart>
            </ChartCanvas>
        );
    }
}

ScatterChart = fitWidth(ScatterChart);
export default ScatterChart;
