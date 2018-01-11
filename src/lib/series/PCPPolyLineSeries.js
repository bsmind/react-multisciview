import React from 'react';
import PropTypes from 'prop-types';

import { PCPSubscriberExt } from '../core';

import { nest as d3Nest } from 'd3-collection';

class PCPPolyLineSeries extends React.Component {
    draw = (ctx, moreProps) => {
        const { data: plotData } = this.props;

        const nest = d3Nest()
                        .key(d => d.stroke)
                        .entries(plotData);

        const x = d => d[0], y = d => d[1];

        ctx.save();
        nest.forEach(groupByStroke => {
            const {key: stroke, values: group} = groupByStroke;

            ctx.strokeStyle = stroke;
            ctx.lineWidth = 1;

            group.forEach(points => {
                ctx.beginPath();
                for (let i=0; i<points.length - 1; ++i) {
                    const p1 = points[i];
                    const p2 = points[i+1];
                    ctx.moveTo(x(p1), y(p1));
                    ctx.lineTo(x(p2), y(p2));
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
            drawOn={["pan"]}
            shared={this.props.shared}
        />
    }
}

export default PCPPolyLineSeries;