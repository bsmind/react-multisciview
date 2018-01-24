import React from 'react';
import PropTypes from 'prop-types';

import { fitWidth } from 'react-multiview/lib/helper';
import { PCPCanvas, Chart, Series } from 'react-multiview/lib/core';
import { PCPPolyLineSeries } from 'react-multiview/lib/series';

import { scaleLinear } from 'd3-scale';

import get from 'lodash.get';

//import { sortAlphaNum } from '../../../utils';
import { sortAlphaNum } from '../utils';

class ParallelCoordinateChart extends React.Component {
    getPCPCanvasNode = () => {
        if (this.PCPCanvasNode) return this.PCPCanvasNode;
    }

    handleUnmountPCP = (dimOrder) => {
        if (this.props.updateDimOrder)
            this.props.updateDimOrder(dimOrder);
    }

    render () {
        const margin= {left: 60, right: 40, top: 20, bottom: 10};
        const {
            width,
            height,
            ratio,
            dimension,
            data,
            dimOrder,
            colorAccessor,
            titleFormat,
            onPCPAxisSelect,
            pcpAttrSelect
        } = this.props;

        return (
            <PCPCanvas
                ref={node => this.PCPCanvasNode = node}
                width={width}
                height={height}
                ratio={ratio}
                margin={margin}
                zIndex={1}

                dimName={dimOrder}
                dimExtents={dimension}
                dimAccessor={(d, name) => get(d, name)}
                data={data}

                colorAccessor={colorAccessor}
                axisWidth={26}

                titleFormat={titleFormat}

                onPCPAxisSelect={onPCPAxisSelect}
                pcpAttrSelect={pcpAttrSelect}
                onUnmount={this.handleUnmountPCP}
            >
                <Series>
                    <PCPPolyLineSeries
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