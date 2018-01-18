import React from 'react';
import SubscriberExt from './SubscriberExt';
import { hexToRGBA } from '../utils';

class MousePathTracker extends React.Component {
    draw = (ctx, moreProps) => {
        if (moreProps && moreProps.mouseXY) {
            //ctx.save();
            const { mouseXY } = moreProps;
            const {
                x, y, data, rgba
            } = mouseXY;

            const radius = 3;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2*Math.PI, false);
            ctx.fillStyle = hexToRGBA('#000000', 0.2);
            ctx.fill();

            ctx.beginPath();
            ctx.fillStyle = rgba;
            ctx.rect(0, 0, 50, 50);
            ctx.fill();
            console.log(rgba)
            //ctx.restore();
        }
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