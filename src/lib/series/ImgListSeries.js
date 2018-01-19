import React from 'react';

import { ImgListSubscriberExt } from '../core';

class ImgListSeries extends React.Component {
    drawImage = (ctx, imgData, x, y, w, h) => {
        const img = new Image;
        img.onload = () => {
            ctx.drawImage(img, x, y, w, h);
        };
        img.src = imgData.url;
    }

    draw = (ctx, moreProps) => {
        return;
        const {
            title,
            data,
            imgHeight,
            imgGapX,
            imgPool,
            onImageRequest,
            origin
         } = this.props;

        data.forEach(d => {
            if (imgPool[d.data._id])
                this.drawImage(ctx, imgData, x, y, w, h);   
            else
                onImageRequest(d.data._id);         
        });
    }

    render() {
        return <ImgListSubscriberExt
            canvas={contexts => contexts.chartOn}
            clip={true}
            edgeClip={false}
            draw={this.draw}
            drawOn={["pan"]}
            shared={this.props.shared}
        />;
    }
}

export default ImgListSeries;