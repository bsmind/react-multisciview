import React from 'react';

import { ChartContainer, Series } from 'react-multiview/lib/core';
import { XAxisSVG, YAxisSVG } from 'react-multiview/lib/axes';
import { ScatterSeriesSVG } from 'react-multiview/lib/series';

import get from 'lodash.get';

class ScatterChartSVG extends React.Component {
    // width={w}
    // height={h}
    // margin={margin}
    // data={pcpData}
    // dimension={pcpDimension}
    // xAttr={xAttr}
    // yAttr={yAttr}
    // zAttr={zAttr}
    // colorsByGroup={colorsBySampleNames}
    // imgPool={imgPool}
    // onScatterPanZoom={this.handleScatterPanZoom}
    // onDataRequest={this.handleDataImageRequest}
    // onSelectDataItems={this.handleScatterSelectDataItems}    

    render() {
        const {
            width, height, margin,
            data, dimension, imgPool,
            xAttr, yAttr, zAttr,
            colorsByGroup, 
            onScatterPanZoom,
            onDataRequest,
            onSelectDataItems
        } = this.props;
        return (
            <ChartContainer
                width={width}
                height={height}
                margin={margin}
                data={data}
                dataExtents={dimension}
                dataAccessor={(d, name) => get(d, name)}
                xAttr={xAttr}
                yAttr={yAttr}
                zAttr={zAttr}
                imgPool={imgPool}
                onScatterPanZoom={onScatterPanZoom}
                onDataRequest={onDataRequest}
                onSelectDataItems={onSelectDataItems}
            >
                <XAxisSVG
                    axisAt='bottom' 
                    orient='bottom' 
                    axisHeight={25}                     
                />
                <YAxisSVG 
                    axisAt='left' 
                    orient='left' 
                    axisWidth={40} 
                />
                <Series>
                    <ScatterSeriesSVG
                    />
                </Series>
                {/*ScatterSeriesSVG*/}
            </ChartContainer>
        );
    }
}

export default ScatterChartSVG;