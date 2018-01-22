import React from 'react';
import PropTypes from 'prop-types';

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
        />;
    }

    render() {
        return <g>
            {this.renderImage()}
        </g>;
    }
}

export default ImgViewer;