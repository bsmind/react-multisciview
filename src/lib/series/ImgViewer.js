import React from 'react';
import PropTypes from 'prop-types';

import {mousePosition} from '../utils';
import {scaleLinear} from 'd3-scale';

class ImgViewer extends React.Component {
    constructor() {
        super();
        this.state = {
            img: null,
            id: null
        };
    }

    componentDidMount() {
        const {imgPool, id} = this.props;
        if (imgPool && imgPool[id]) {
            this.setState({id, img: imgPool[id]});
        }
        if (this.props.onImageRequest) {
            //console.log('imgViewer: request image, ', id);
            this.props.onImageRequest(id, 5);
        }
    }

    componentWillReceiveProps(nextProps) {
        const {imgPool, id, onImageRequest} = nextProps;
        const oldId = this.state.id;
        if (oldId && id === oldId) {
            // do nothing
            return;
        }
        if (imgPool && imgPool[id]) {
            this.setState({id, img: imgPool[id]});
            return;
        }
        if (onImageRequest) {
           // console.log('imgViewer: request image, ', id);
            onImageRequest(id, 5);
        }
        this.setState({id: null, img: null});
    }

    getImgSize = (side) => {
        const { img } = this.state;
        let width, height;
        if (img.width >= img.height) {
            width = side;
            height = (img.height / img.width) * side;
        } else {
            height = side;
            width = (img.width / img.height) * side;
        }
        return {width, height};
    }

    handleImageZoom = (size, e) => {
        const mouseXY = mousePosition(e);
        const {width, height} = size;

        const mX = mouseXY[0] - width/2;
        const mY = mouseXY[1] - height/2;

        const X = Math.round(this.props.x + mX);
        const Y = Math.round(this.props.y + mY);
        
        if (this.props.onImageZoom)
           this.props.onImageZoom([X, Y], e);
    }

    renderImage = () => {
        const { imgRefWidth, imgRefHeight, x, y } = this.props;
        let imgWidth = imgRefWidth ? imgRefWidth: imgRefHeight;
        let imgHeight = imgRefHeight ? imgRefHeight: imgRefWidth;
        let imgSide = Math.min(imgWidth, imgHeight);
        if (this.state.img == null || this.state.id == null) {
            return <rect
                x={x - imgSide/2}
                y={y - imgSide/2}
                width={imgSide}
                height={imgSide}
                style={{
                    fill: '#000000',
                    opacity: 0.3
                }}
            />;
        }

        const {width, height} = this.getImgSize(imgSide);
        return <image
            xlinkHref={this.state.img.url}
            x={x - width/2}
            y={y - height/2}
            width={width}
            height={height}
            imageRendering={'pixelated'}
            onWheel={this.handleImageZoom.bind(this, {width, height})}
        />;
    }

    renderGrid = () => {
        if (!this.props.showGrid || this.state.img == null) return;

        const { imgRefWidth, imgRefHeight, x, y, svgDim } = this.props;
        let imgWidth = imgRefWidth ? imgRefWidth: imgRefHeight;
        let imgHeight = imgRefHeight ? imgRefHeight: imgRefWidth;
        let imgSide = Math.min(imgWidth, imgHeight);
        
        const {width, height} = this.getImgSize(imgSide);
        const { img, id } = this.state;

        const xScale = scaleLinear().domain([0, img.width]).range([0, width]);
        const cx = x;
        const dx = xScale(1);
        const sx = cx - width/2;
        const ex = cx + width/2;
        const boundX = [ Math.max(sx, 0), Math.min(ex, svgDim.width) ];
        const start_ix = Math.floor((boundX[0] - sx) / dx);
        const end_ix = img.width - Math.ceil((ex - boundX[1])/dx);

        const yScale = scaleLinear().domain([0, img.height]).range([0, height]);
        const cy = y;
        const dy = yScale(1);
        const sy = cy - height/2;
        const ey = cy + height/2;
        const boundY = [ Math.max(sy, 0), Math.min(ey, svgDim.height) ];
        const start_iy = Math.floor((boundY[0] - sy) / dy);
        const end_iy = img.height - Math.ceil((ey - boundY[1])/dy);

        const lineStyleVertical = {
            stroke: '#000000',
            strokeWidth: 1,
            y1: boundY[0],
            y2: boundY[1]
        };
        const lineStyleHorizontal = {
            stroke: '#000000',
            strokeWidth: 1,
            x1: boundX[0],
            x2: boundX[1]            
        };
        const textStyle = {
            fontFamily: 'Roboto, sans-serif',
            fontSize: Math.min(dx, dy)/5,
            textAnchor: 'start',
            fill: 'black'
        }

        const grids = [];
        let needToDrawVerticalLine = true;
        for (let iy = start_iy; iy <= end_iy; ++iy) {
            const yy = sy + iy*dy;
            grids.push(<line
                key={`${id}-h-${iy}`}
                y1={yy}
                y2={yy}
                {...lineStyleHorizontal}
            />);

            for (let ix=start_ix; ix<=end_ix; ++ix) {
                const xx = sx + ix*dx;

                if (iy < img.height && ix < img.width) {
                    grids.push(<text 
                        key={`${id}-text-${ix}-${iy}`}
                        x={xx + dx/6}
                        y={yy + dy/3}
                        {...textStyle}
                    >
                        {img.data[iy][ix]}
                    </text>);
                }

                if (needToDrawVerticalLine)
                    grids.push(<line
                        key={`${id}-v-${ix}`}
                        x1={xx}
                        x2={xx}
                        {...lineStyleVertical}
                    />);
            }
            needToDrawVerticalLine = false;
        }

        return grids;
    }


    render() {
        return <g>
            {this.renderImage()}
            {this.renderGrid()}
        </g>;
    }
}

export default ImgViewer;