import React from 'react';
import PropTypes from 'prop-types';

import { fitWidth } from 'react-multiview/lib/helper';
import { ChartCanvas, PCPCanvas, Chart, Series } from 'react-multiview/lib/core';
import { PCPPolyLineSeries } from 'react-multiview/lib/series';

import { scaleLinear } from 'd3-scale';

import get from 'lodash.get';

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
            groupAccessor
        } = this.props;

        if (data == null || data.length === 0)
            return <div/>

        // console.log(dimension)
        // const dimName = [
        //     'sample', 
        //     'metadata_extract.data.annealing_time',
        //     'metadata_extract.data.annealing_temperature',
        //     //'linecut_qr.data.fit_peaks_sigma1'
        // ];
        const dimName = Object.keys(dimension);
        //console.log(dimension)
        //const xExtents = [0, numDim];

        // const yAccessor = dimName.map(name => {
        //     return d => get(d, name);
        // });
        //const yAccessor = (d, name) => get(d, name);

        
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