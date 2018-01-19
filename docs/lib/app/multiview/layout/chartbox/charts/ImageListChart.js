import React from 'react';

import { fitWidth } from 'react-multiview/lib/helper';
import { 
    ImgListCanvas
} from 'react-multiview/lib/core';


class ImageListChart extends React.Component {
    render() {
        const {
            width, ratio,
            dataList,
            imgHeight,
            imgGapY
        } = this.props;

        const margin = {left: 60, right: 40, top: 10, bottom: 30};
        const chartHeight = imgHeight * dataList.length
                            + Math.max(0, imgGapY * (dataList.length - 1))
                            + margin.top + margin.bottom;

        return <ImgListCanvas
            width={width}
            height={chartHeight} 
            ratio={ratio}
            margin={margin}
            zIndex={1}
        >

        </ImgListCanvas>
    }
}

ImageListChart = fitWidth(ImageListChart);
export default ImageListChart;