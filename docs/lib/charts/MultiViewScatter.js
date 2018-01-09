import React from 'react';
import PropTypes from 'prop-types';

import { fitWidth } from 'react-multiview/lib/helper';
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

const getColorsByGroup = (groups) => {
    const colors = randomColor({
        luminosity: 'light',
        hue: 'random',
        count: groups.length
    });

    const colorsByGroup = {};
    groups.forEach((group, index) => {
        colorsByGroup[group] = colors[index];
    });

    return colorsByGroup;
}

class MultiView extends React.Component {
    render() {
        const height = 350;
        const margin= {left: 80, right: 40, top: 30, bottom: 40};
        const dataToUse = this.props.data.map(d => {
            if (d.meta == null ||
                d.meta.data.annealing_temperature == null ||
                d.meta.data.annealing_time == null
            ) {
                return {x: null, y: null};
            } else {
                return {
                    id: d.item,
                    group: d.sample,
                    y: d.meta.data.annealing_temperature,
                    x: d.meta.data.annealing_time
                };
            }
        })
        .filter(d => d.x != null && d.y != null)
        .sort((a,b) => a.x - b.x);

        const xExtents = d3Extent(dataToUse, d => d.x);
        const groups = uniqBy(dataToUse, 'group').map(d => d.group);
        const colorsByGroup = getColorsByGroup(groups);

        const markerProps = {
            r: 3,
            stroke: d => colorsByGroup[d.group || d],
            fill: d => colorsByGroup[d.group || d],
            opacity: 0.5,
            strokeWidth: 1
        }

        //console.log(dataToUse.length)

        return (
            <ChartCanvas
                width={this.props.width}
                height={height}
                ratio={this.props.ratio}
                margin={margin}
                data={dataToUse}
                xAccessor={d => d.x}
                xExtents={xExtents}
                xScale={scaleLinear()}
                xFlip={false}
                xPadding={0}
            >
                <Chart
                    id={1}
                    //height={height}
                    yExtents={d => d.y}
                    yScale={scaleLinear()}
                    yFlip={false}
                    yPadding={0}
                >
                    <XAxis axisAt='bottom' orient='bottom' axisHeight={25} />
                    <YAxis axisAt='left' orient='left' axisWidth={40} />
                    <Series>
                        <ScatterSeries
                            yAccessor={d => d.y}
                            marker={CircleMarker}
                            markerProps={markerProps}
                            drawOrder={groups}
                            orderAccessor={d => d.group}
                        />
                    </Series>
                </Chart>
            </ChartCanvas>
        );
    }
}

MultiView = fitWidth(MultiView);
export default MultiView;
