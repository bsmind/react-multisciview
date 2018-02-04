import React from 'react';
import PropTypes from 'prop-types';

import { ImgViewer } from '../series';
import { mousePosition, d3Window } from '../utils';
import { select, event as d3Event, mouse } from 'd3-selection';
import { scaleLinear } from 'd3-scale';

class DraggableDataBox extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            pos: props.initialPos,
            dragging: false,
            rel: null,
            imgFocusX: 0,
            imgFocusY: 0,
            imgCenterX: (196-2)/2,
            imgCenterY: 100/2,
            imgRefWidth: 196-2,
            imgRefHeight: 100,
            xScale: scaleLinear().domain([0, 194]).range([0, 194]),
            yScale: scaleLinear().domain([0, 100]).range([0, 100])
        }

        //this.xScale = scaleLinear().domain([0, 194]).range([0, 194]);
    }

    handleMouseDown = (e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        e.preventDefault();

        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);

        this.setState({
            dragging: true,
            rel: {
                x: e.pageX - this.node.offsetLeft,
                y: e.pageY - this.node.offsetTop
            }
        });
    }

    handleMouseUp = (e) => {
        e.stopPropagation();
        e.preventDefault();        
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        this.setState({
            dragging: false
        });
    }

    handleMouseMove = (e) => {
        if (!this.state.dragging) return;
        e.stopPropagation();
        e.preventDefault();        

        this.setState({
            pos: {
                x: e.pageX - this.state.rel.x,
                y: e.pageY - this.state.rel.y
            }
        });
    }

    handleMouseDownImgViewer = (e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        e.preventDefault();
        console.log('mousedown:imgviewer')
    }

    handleWheelImgViewer = (e) => {
        e.preventDefault();
        const { imgRefWidth, imgRefHeight, imgCenterX, imgCenterY, xScale, yScale } = this.state;
        
        const SCALE_FACTOR = 0.001;
        const zoomFactor = Math.max(Math.min(1 + e.deltaY * SCALE_FACTOR, 3), 0.1);

        const mouseXY = mousePosition(e);
        const centerX = xScale.invert(mouseXY[0]),
              beginX = xScale.domain()[0],
              endX = xScale.domain()[1];
        const newDomainX = [
            centerX - (centerX - beginX) * zoomFactor,
            centerX + (endX - centerX) * zoomFactor
        ];

        const centerY = yScale.invert(mouseXY[1]),
              beginY = yScale.domain()[0],
              endY = yScale.domain()[1];
        const newDomainY = [
            centerY - (centerY - beginY) * zoomFactor,
            centerY + (endY - centerY) * zoomFactor
        ];
        
        this.setState({
            imgRefWidth: imgRefWidth * (1/zoomFactor),
            imgRefHeight: imgRefHeight * (1/zoomFactor),
            imgFocusX: mouseXY[0] - imgCenterX,
            imgFocusY: mouseXY[1] - imgCenterY,
            xScale: xScale.copy().domain(newDomainX),
            yScale: yScale.copy().domain(newDomainY)
            //imgCenterX: mouseXY[0],
            //imgCenterY: mouseXY[1]
        });
    }

    renderInfo = (info) => {
        const tableContents = info.map(d => {
            return <tr>
                <td> {d.key} </td>
                <td> {d.value} </td>
            </tr>;
        });
        return <table>
            <tbody>
                {tableContents}
            </tbody>
        </table>;
    }

    render() {
        const { selected, imgPool, handleImageRequest } = this.props.shared;
        if (selected.length === 0)
            return null;

        const divStyle = {
            position: 'absolute',
            left: this.state.pos.x,
            top: this.state.pos.y,
            cursor: 'pointer',
            width: 200,
            height: 250,
            backgroundColor: '#FFFFFF',
            border: '1px dotted #707070',
            borderRadius: 5,
            padding: 2,
            zIndex: 100
        };

        const {id, info} = selected[0];
        const {
            imgRefWidth, imgRefHeight, 
            imgCenterX, imgCenterY, 
            imgFocusX, imgFocusY,
            xScale, yScale
        } = this.state;
        const x = xScale(imgCenterX);
        const y = yScale(imgCenterY)

        return (
        <div ref={node => this.node = node}
            onMouseDown={this.handleMouseDown}
            style={divStyle}
        >
            <div style={{
                height: 100
            }}>
                <svg width={200 - 4} height={100}>
                    <ImgViewer 
                        x={x}
                        y={y}
                        imgRefWidth={imgRefWidth}
                        imgRefHeight={imgRefHeight}
                        id={id}  
                        imgPool={imgPool}       
                        onImageRequest={handleImageRequest}
                        showGrid={false}
                        svgDim={{width: 196, height: 100}}
                    />
                    <rect
                        ref={node => this.ImgViewerEventHandler = node}
                        x={0}
                        y={0}
                        width={196-2}
                        height={196}
                        fill='#000000'
                        fillOpacity={0.}
                        onMouseDown={this.handleMouseDownImgViewer}
                        onWheel={this.handleWheelImgViewer}
                    />
                </svg>
            </div>
            <div style={{
                height: 100,
                overflow: 'auto',
            }}>
                {this.renderInfo(info)}
            </div>
        </div>);
    }
}

DraggableDataBox.propTypes = {
    initialPos: PropTypes.shape({
        x: PropTypes.number,
        y: PropTypes.number
    }),
};

DraggableDataBox.defaultProps = {
    initialPos: {
        x: 0,
        y: 0
    }
};

export default DraggableDataBox;