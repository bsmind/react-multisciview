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
        const margin= {left: 80, right: 40, top: 30, bottom: 40};
        const {
            width,
            height,
            ratio,
            data,
            extents,
            xAccessor,
            yAccessor,
            zAccessor,
            groups,
            colorsByGroup,
            groupAccessor
        } = this.props;

        if (data == null)
            return null;

        const xExtents = xAccessor(extents);
        const yExtents = yAccessor(extents);

        let mProvider;
        if (zAccessor == null) {
            mProvider = markerProvider(
                groupAccessor,
                {
                    type: 'square',
                    width: 6,
                    height: 6,
                    style: {
                        //stroke: d => colorsByGroup[groupAccessor(d) || d],
                        strokeWidth: 1,
                        opacity: 0.5
                    }
                },
                ratio 
            );
            mProvider = mProvider.colorSet(colorsByGroup);
        } else {
            mProvider = markerProvider(
                zAccessor,
                {
                    type: 'square',
                    width: 6,
                    height: 6,
                    style: {
                        //stroke: d => colorsByGroup[groupAccessor(d) || d],
                        strokeWidth: 1,
                        opacity: 0.5
                    }
                },
                ratio 
            );
        }
        mProvider.calculateMarkers(data);
        
        //console.log(mProvider.getMarkers());

        const markerProps = {
            r: 3,
            stroke: d => colorsByGroup[groupAccessor(d) || d],
            fill: d => colorsByGroup[groupAccessor(d) || d],
            opacity: 0.5,
            strokeWidth: 1
        }

        return (
            <ChartCanvas
                width={width}
                height={height}
                ratio={ratio}
                margin={margin}
                data={data}
                xAccessor={xAccessor}
                xExtents={xExtents}
                xScale={scaleLinear()}
                xFlip={false}
                xPadding={0}
            >
                <Chart
                    id={1}
                    //height={height}
                    yExtents={yAccessor}
                    yScale={scaleLinear()}
                    yFlip={false}
                    yPadding={0}
                >
                    <XAxis axisAt='bottom' orient='bottom' axisHeight={25} />
                    <YAxis axisAt='left' orient='left' axisWidth={40} />
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
