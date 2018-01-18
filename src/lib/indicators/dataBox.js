import React from 'react';
import { SubscriberExt } from '../core';
import { hexToRGBA } from '../utils';

class DataBox extends React.Component {
    drawInfo = (ctx, info) => {
        const { hint } = this.props;
        const fontSize = 6;
        const fontFamily = 'Roboto, sans-serif';
        const lineHeight = Math.floor(fontSize * 2);
        
        let textX = 0, textY = 0;
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = hexToRGBA('#000000', 0.8);
        info.forEach( (line, index) => {
            if (hint.indexOf(line.key) === -1) return;
            const text = line.key + ' : ' + line.value;
            ctx.fillText(text, textX, textY);
            textY += lineHeight;
        });
    }

    draw = (ctx, moreProps) => {
        if (moreProps.mouseXY == null ||
            moreProps.mouseXY.x == null ||
            moreProps.mouseXY.y == null ||
            moreProps.mouseXY.info == null) {
            return;
        }

        const { x, y, info } = moreProps.mouseXY;
        const { origin, infoSortor } = this.props;
        ctx.save();
        ctx.translate(origin.x, origin.y);
        this.drawInfo(ctx, infoSortor(info));
        ctx.restore();
    }

    render() {
        return (
            <SubscriberExt
                canvas={contexts => contexts.mouseCoord}
                clip={true}
                edgeClip={false}
                draw={this.draw}
                drawOn={["mousemove"]}
                shared={this.props.shared}
            />
        );
    }
}

export default DataBox;