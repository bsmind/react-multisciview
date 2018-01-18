import React from 'react';
import { SubscriberExt } from '../core';
import { hexToRGBA } from '../utils';

class DataBox extends React.Component {
    drawInfo = (ctx, info, x, y) => {
        const { hint } = this.props;

        const fontSize = Math.floor(7);
        const fontFamily = 'Roboto, sans-serif';
        const lineHeight = Math.floor(fontSize * 2);
        
        let textX = x, textY = y, maxWidth = 0;
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = hexToRGBA('#000000', 0.8);
        info.forEach( (line, index) => {
            if (hint.indexOf(line.key) === -1) return;
            const text = line.key + ' : ' + line.value;
            ctx.fillText(text, textX, textY);
            textY += lineHeight;
        });
    }

    drawImage = (ctx, imgData, x, y) => {
        if (imgData == null) {
            // const fontSize = Math.floor(10);
            // const fontFamily = 'Roboto, sans-serif';
            
            // ctx.fillStyle = hexToRGBA('#000000', 0.1)
            // ctx.fillRect(x, y, 100, 100);
            
            // ctx.font = `${fontSize}px ${fontFamily}`;
            // ctx.fillStyle = hexToRGBA('#000000', 1.0);
            // ctx.textAlign = 'center';
            // ctx.fillText('...onLoading', x + 50, y + 50);
            return;
        }

        const img = new Image;
        img.onload = () => {
            ctx.drawImage(img, x, y, 100, 100);            
        };
        img.src = imgData.url;
    }

    draw = (ctx, moreProps) => {
        if (moreProps.mouseXY == null ||
            moreProps.mouseXY.x == null ||
            moreProps.mouseXY.y == null ||
            moreProps.mouseXY.info == null) {
            return;
        }

        const { x, y, info, id } = moreProps.mouseXY;
        const { origin, infoSortor } = this.props;
        const { imgPool, ratio, margin, canvasDim } = this.props.shared;
        const imgData = imgPool[id];

        const boxX = (x + margin.left + 5);// * ratio;
        let boxY;
        const refY = 120 / ratio;
        if (y < refY) {
            boxY = y + (refY - y);
        } else if (canvasDim.height - y < refY) {
            boxY = y - (refY - canvasDim.height + y);
        } else {
            boxY = y;
        }
        this.drawImage(ctx, imgData, boxX, boxY);
        this.drawInfo(ctx, infoSortor(info), boxX + 110 - margin.left, boxY);
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