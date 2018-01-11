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
            data
        } = this.props;
        //console.log(this.props)

        if (data.length === 0)
            return <div/>

        const numDim = 2;//dimName.length;    
        const dimName = ['sample', 'metadata_extract.data.annealing_temperature'];//Object.keys(dimension);
        //const dimExtents = dimName.map(name => dimension[name]);

        const xExtents = [0, numDim];

        const yAccessors = dimName.map(name => {
            return d => get(d, name);
        });

        
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
            >
            </PCPCanvas>
        );
    }
}

ParallelCoordinateChart = fitWidth(ParallelCoordinateChart);
export default ParallelCoordinateChart;