import React from 'react';
import { fitWidth } from 'react-multiview/lib/helper';

class ImageShipTest extends React.Component {
    constructor() {
        super();
    }

    componentDidMount() {
        this.canvas = this.node;
        this.ctx = this.node.getContext("2d");
    }

    render() {
        const {
            width, height, ratio
        } = this.props;

        const canvasWidth = width * ratio;
        const canvasHeight = height * ratio;

        return (
            <div style={{
                position: "relative",
                width,
                height
            }}>
                <canvas id="test" 
                    ref={node => this.node = node}
                    width={canvasWidth}
                    height={canvasHeight}
                    style={{
                        width,
                        height
                    }}
                />
            </div>
        );
    }
}

ImageShipTest = fitWidth(ImageShipTest);
export default ImageShipTest;