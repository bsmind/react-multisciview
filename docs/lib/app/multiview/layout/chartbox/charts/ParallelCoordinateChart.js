import React from 'react';
import PropTypes from 'prop-types';

import { fitWidth } from 'react-multiview/lib/helper';
import { ChartCanvas, PCPCanvas, Chart, Series } from 'react-multiview/lib/core';

import { scaleLinear } from 'd3-scale';

import get from 'lodash.get';

class ParallelCoordinateChart extends React.Component {
    render () {
        const margin= {left: 60, right: 40, top: 10, bottom: 60};
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

        const dimName = [
            'sample', 
            'metadata_extract.data.annealing_time',
            'metadata_extract.data.annealing_temperature'
        ];
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
                opacity={0.3}
            >
            </PCPCanvas>
        );
    }
}

ParallelCoordinateChart = fitWidth(ParallelCoordinateChart);
export default ParallelCoordinateChart;