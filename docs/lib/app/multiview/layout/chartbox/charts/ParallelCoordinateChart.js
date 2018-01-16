import React from 'react';
import PropTypes from 'prop-types';

import { fitWidth } from 'react-multiview/lib/helper';
import { ChartCanvas, PCPCanvas, Chart, Series } from 'react-multiview/lib/core';
import { PCPPolyLineSeries } from 'react-multiview/lib/series';

import { scaleLinear } from 'd3-scale';

import get from 'lodash.get';

import { sortAlphaNum } from '../../../utils';

class ParallelCoordinateChart extends React.Component {
    render () {
        const margin= {left: 60, right: 40, top: 20, bottom: 10};
        const {
            width,
            height,
            ratio,
            dimension,
            data,
            colorsByGroup,
            groupAccessor,
            titleFormat,
        } = this.props;

        //console.log('pcp char:', dimension)
        if (data == null || data.length === 0)
            return <div/>

        const dimName = Object.keys(dimension).sort(sortAlphaNum);
        const index = dimName.indexOf('sample');
        if (index !== -1) {
            dimName.splice(index, 1);
            dimName.splice(0, 0, 'sample');
        }

        
        return (
            <PCPCanvas
                width={width}
                height={height}
                ratio={ratio}
                margin={margin}
                zIndex={1}

                dimName={dimName}
                dimExtents={dimension}
                dimAccessor={(d, name) => get(d, name)}
                data={data}

                colorAccessor={d => colorsByGroup[groupAccessor(d)]}
                axisWidth={26}

                titleFormat={titleFormat}
            >
                <Series>
                    <PCPPolyLineSeries
                        //colorAccessor={d => colorsByGroup[groupAccessor(d)]} 
                        //groupAccessor={groupAccessor}
                        opacity={0.3}
                        strokeWidth={1}
                    />
                </Series>
            </PCPCanvas>
        );
    }
}

ParallelCoordinateChart = fitWidth(ParallelCoordinateChart);
export default ParallelCoordinateChart;