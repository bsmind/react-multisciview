import React from 'react';

import { fitWidth } from 'react-multiview/lib/helper';
import { 
    ImgListCanvas
} from 'react-multiview/lib/core';
import { ImgListSeries } from 'react-multiview/lib/series';


class ImageListChart extends React.Component {
    render() {
        const {
            width, ratio,
            dataList,
            imgHeight,
            imgGapY,
            imgGapX,
            imgPool,
            onImageRequest
        } = this.props;

        const margin = {left: 60, right: 40, top: 10, bottom: 30};
        const chartHeight = imgHeight * dataList.length
                            + Math.max(0, imgGapY * (dataList.length - 1))
                            + margin.top + margin.bottom;

        const imgList = dataList.map((l,i) => {
            const origin = {
                x: 0,
                y: (imgHeight + imgGapY) * i
            };
            return <ImgListSeries 
                key={`imgList-${l.id}`}
                title={l.id}
                data={l}
                imgHeight={imgHeight}
                imgGapX={imgGapX}
                imgPool={imgPool}
                onImageRequest={onImageRequest}
                origin={origin}
            />;
        });

        return <ImgListCanvas
            width={width}
            height={chartHeight} 
            ratio={ratio}
            margin={margin}
            zIndex={1}
            data={dataList}
        >
            {imgList}
        </ImgListCanvas>
    }
}

ImageListChart = fitWidth(ImageListChart);
export default ImageListChart;