import React from 'react';
import { SubscriberExt } from '../core';
import { hexToRGBA } from '../utils';

import { range as d3Range } from 'd3-array';

class MousePathTracker extends React.Component {
    draw = (ctx, moreProps) => {
        if (moreProps.trackXY) {
            //console.log(moreProps.trackXY);
            const [startXY, endXY] = moreProps.trackXY;
            const numSamples = 10;
            const points = d3Range(numSamples+1).map(i => {
                const t = i / numSamples;
                return {
                    x: Math.floor( startXY[0] * (1 - t) + endXY[0] * t  ),
                    y: Math.floor( startXY[1] * (1 - t) + endXY[1] * t)
                }
            });

            let prev = null;
            const radius = 3;
            ctx.fillStyle = hexToRGBA('#000000', 0.2);
            ctx.beginPath();
            points.forEach(p => {
                const isSame = prev && (
                    prev.x === p.x && prev.y === p.y
                );

                if(!isSame)
                    ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI, false);
            });
            ctx.fill();

        }

        // return;
        // if (moreProps && moreProps.mouseXY) {
        //     //ctx.save();
        //     const { mouseXY } = moreProps;
        //     const {
        //         x, y, data, rgba
        //     } = mouseXY;

        //     const radius = 3;
        //     ctx.beginPath();
        //     ctx.arc(x, y, radius, 0, 2*Math.PI, false);
        //     ctx.fillStyle = hexToRGBA('#000000', 0.2);
        //     ctx.fill();

        //     ctx.beginPath();
        //     ctx.fillStyle = rgba;
        //     ctx.rect(0, 0, 50, 50);
        //     ctx.fill();
        //     console.log(rgba)
        //     //ctx.restore();
        // }
    }

    render() {
        return (
            <SubscriberExt
                canvas={contexts => contexts.mouseCoord}
                clip={true}
                edgeClip={false}
                draw={this.draw}
                drawOn={["track"]}
                shared={this.props.shared}
            />
        );
    }
}

export default MousePathTracker;