import React from 'react';
import PropTypes from 'prop-types';

import { PCPSubscriberExt } from '../core';
import { hexToRGBA } from '../utils';

import { nest as d3Nest } from 'd3-collection';

class PCPPolyLineSeries extends React.Component {
    draw = (ctx, moreProps) => {
        const { 
            plotData,
            xScale,
            dimConfig
        } = moreProps;
        const { opacity, strokeWidth } = this.props;

        //console.log(moreProps)
        const nest = d3Nest()
                        .key(d => d.stroke)
                        .entries(plotData);

        const dimOrder = xScale.domain();
        //console.log(dimOrder)

        const yAccessor = (d, config) => {
            const {ordinary, scale, accessor, extents, step, nullPositionY} = config;
            //console.log(d, accessor)
            const yValue = accessor(d);
            if (yValue == null) return nullPositionY;
            return ordinary
                ? scale(extents.indexOf(accessor(d))) - step/2
                : scale(accessor(d));
        };

        const xAccessor = (config) => {
            return config.position;
        }
            //     const y = ordinary
            //         ? scale(extents.findIndex(v => v === yValue)) - step/2
            //         : scale(yValue);

        let p1Config, p2Config, p1, p2;

        ctx.save();
        nest.forEach(groupByStroke => {
            const {key: stroke, values: group} = groupByStroke;

            ctx.strokeStyle = hexToRGBA(stroke, opacity);
            ctx.lineWidth = strokeWidth;

            group.forEach(d => {
                ctx.beginPath();

                p1Config = dimConfig[dimOrder[0]];
                p1 = [xAccessor(p1Config), yAccessor(d, p1Config)];
                ctx.moveTo(p1[0], p1[1]);
                for (let i=1; i<dimOrder.length; ++i) {
                    
                    p2Config = dimConfig[dimOrder[i]];
                    p2 = [xAccessor(p2Config), yAccessor(d, p2Config)];
                    //ctx.moveTo(p1[0], p1[1]);
                    ctx.lineTo(p2[0], p2[1]);

                    //p1Config = p2Config;
                    //p1 = p2;
                }
                ctx.stroke();
            });
        });
        ctx.restore();
    }

    render() {
        return <PCPSubscriberExt
            canvas={contexts => contexts.axes}
            clip={false}
            edgeClip={false}
            draw={this.draw}
            drawOn={["moveaxis"]}
            shared={this.props.shared}
            dimConfig={this.props.dimConfig}
            useAllDim={true}
        />
    }
}

export default PCPPolyLineSeries;