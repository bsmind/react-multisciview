import React from 'react';
import PropTypes from 'prop-types';

import { ImgViewer } from '../series';
import { mousePosition, d3Window } from '../utils';
import { select, event as d3Event, mouse } from 'd3-selection';
import { scaleLinear } from 'd3-scale';
import uniqueId from 'lodash.uniqueid';

import { Button } from 'react-toolbox/lib/button';
import theme from './draggableDataBox.css';

class DraggableDataBox extends React.Component {
    constructor(props) {
        super(props);

        const {initialPos} = props;
        const state = this.resetImage(props);

        this.state = {
            id: uniqueId('draggable-databox-'),

            pos: initialPos,
            dragging: false,
            rel: null,

            ...state,
            // imgCenterX: width/2,
            // imgCenterY: height/4,
            // imgRefWidth: width,
            // imgRefHeight: height/2,

            // xScale: scaleLinear().domain([0, width]).range([0, width]),
            // yScale: scaleLinear().domain([0, height/2]).range([0, height/2]),

            panInProgress: false,
            panStart: null
        }
    }

    resetImage = (props = this.props) => {
        const { width, height } = props;
        return {
            imgCenterX: width/2,
            imgCenterY: height/4,
            imgRefWidth: width,
            imgRefHeight: height/2,

            xScale: scaleLinear().domain([0, width]).range([0, width]),
            yScale: scaleLinear().domain([0, height/2]).range([0, height/2]),            
        };
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
        
        const mouseXY = mousePosition(e);
        this.panHappened = false;
        if (!this.state.panInProgress) {
            this.setState({
                panInProgress: true,
                panStart: {
                    pos: mouseXY,
                    xScale: this.state.xScale.copy(),
                    yScale: this.state.yScale.copy()
                }
            });
            select(d3Window(this.ImgViewerEventHandler))
                .on('mousemove', this.handlePan)
                .on('mouseup', this.handlePanEnd);
        }
    }

    handlePan = () => {
        const e = d3Event;
        if (this.state.panStart) {
            this.panHappened = true;
            const { panStart: {pos, xScale, yScale} } = this.state;
            const mouseXY = mouse(this.ImgViewerEventHandler);
            this.lastNewPos = mouseXY;
            const dx = mouseXY[0] - pos[0];
            const dy = mouseXY[1] - pos[1];
            this.dx = dx;
            this.dy = dy;

            const newDomainX = xScale.range().map(x => x - dx).map(xScale.invert);
            const newDomainY = yScale.range().map(y => y - dy).map(yScale.invert);

            this.setState({
                xScale: xScale.copy().domain(newDomainX),
                yScale: yScale.copy().domain(newDomainY)
            });
        }
    }

    handlePanEnd = () => {
        if (this.state.panStart) {
            select(d3Window(this.ImgViewerEventHandler))
                .on('mousemove', null)
                .on('mouseup', null);

            if (this.panHappened) {
                const { dx, dy } = this;
                delete this.dx;
                delete this.dy;
            }

            this.setState({
                panInProgress: false,
                panStart: null
            });
        }
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
            xScale: xScale.copy().domain(newDomainX),
            yScale: yScale.copy().domain(newDomainY)
        });
    }

    handleCurrSelectedIndex = (dir, e) => {
        const {selected, currSelectedIndex, handleCurrSelectedIndexChange} = this.props.shared;
        if (selected.length < 2) return;

        let newIndex = (dir === 'left') 
            ? currSelectedIndex - 1
            : currSelectedIndex + 1;

        if (newIndex < 0) newIndex = selected.length - 1;
        if (newIndex > selected.length-1) newIndex = 0;

        if (handleCurrSelectedIndexChange && newIndex !== currSelectedIndex) {
            handleCurrSelectedIndexChange(newIndex);
        }
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

    renderButtons = () => {
        const { handleCurrSelectedIndexDelete, currSelectedIndex, handleShowDataBox } = this.props.shared;

        const deleteCallback = handleCurrSelectedIndexDelete 
            ? handleCurrSelectedIndexDelete
            : () => {};

        const resetCallback = () => {
            const state = this.resetImage();
            this.setState({...state});
        };

        return (<table style={{width: '100%', textAlign: 'center'}}>
            <tbody>
            <tr>
                <td>
                    <Button label="RESET" primary theme={theme} 
                        onClick={resetCallback}
                    />
                </td>
                <td>
                    <Button label="DELETE" primary theme={theme}
                        onClick={() => deleteCallback(currSelectedIndex)}
                    />
                </td>
                <td>
                    <Button label="CLOSE" primary theme={theme}
                        onClick={() => handleShowDataBox(false)}
                    />
                </td>
            </tr>
            </tbody>
        </table>);
    }

    render() {
        const { selected, currSelectedIndex, imgPool, handleImageRequest, showDataBox } = this.props.shared;
        const { width, height } = this.props;
        if (selected.length === 0 || !showDataBox)
            return null;

        const divStyle = {
            position: 'absolute',
            left: this.state.pos.x,
            top: this.state.pos.y,
            cursor: 'pointer',
            width: width,
            height: height,
            backgroundColor: '#FFFFFF',
            border: '1px dotted #707070',
            borderRadius: 0,
            //padding: 2,
            zIndex: 100,
            boxShadow: '3px 3px 6px #888888'
        };

        const {id, info} = selected[currSelectedIndex];
        const {
            imgRefWidth, imgRefHeight, 
            imgCenterX, imgCenterY, 
            xScale, yScale
        } = this.state;
        const x = xScale(imgCenterX);
        const y = yScale(imgCenterY);

        const imageRatio = Math.max(
            imgRefWidth / width || 0.1,
            imgRefHeight / (height/2) || 0.1
        );
        const showGrid = imageRatio > 50;

        const infoStyle = <style type="text/css">
            {`td {
                font-family: Roboto, sans-serif;
                font-size: 7px;
            }`}
        </style>;

        const leftTrianglePath = `M 0 0 L 6 -6 L 6 6 z`;
        const rightTrianglePath = `M 0 0 L -6 -6 L -6 6 z`;

        return (
        <div ref={node => this.node = node}
            onMouseDown={this.handleMouseDown}
            style={divStyle}
        >
            {infoStyle}
            <div style={{
                height: 100
            }}>
                <svg width={width} height={height/2}>
                    <defs>
                        <clipPath id={`${this.state.id}-img-area-clip`}>
                            <rect x={0} y={0} width={Math.floor(width)-2} height={height/2} />
                        </clipPath>
                    </defs>
                    <g style={{clipPath: `url(#${this.state.id}-img-area-clip)`}}>
                        <ImgViewer 
                            x={x}
                            y={y}
                            imgRefWidth={imgRefWidth}
                            imgRefHeight={imgRefHeight}
                            id={id}  
                            imgPool={imgPool}       
                            onImageRequest={handleImageRequest}
                            showGrid={showGrid}
                            svgDim={{width: width, height: height/2}}
                        />
                        <rect
                            ref={node => this.ImgViewerEventHandler = node}
                            x={0}
                            y={0}
                            width={width}
                            height={height/2}
                            fill='#000000'
                            fillOpacity={0.}
                            onMouseDown={this.handleMouseDownImgViewer}
                            onWheel={this.handleWheelImgViewer}
                        />
                        <g transform={`translate(${1},${height/4})`}>
                            <path 
                                d={leftTrianglePath}
                                fill={"#000000"}
                                stroke={"#ffffff"}
                                strokeWidth={1}
                                onClick={e => this.handleCurrSelectedIndex('left', e)}
                            />
                        </g>
                        <g transform={`translate(${width-3},${height/4})`}>
                            <path 
                                d={rightTrianglePath}
                                fill={"#000000"}
                                stroke={"#ffffff"}
                                strokeWidth={1}
                                onClick={e => this.handleCurrSelectedIndex('right', e)}
                            />
                        </g>
                        <text
                            x={3}
                            y={10}
                            textAnchor={'start'}
                            fontFamily={'Roboto, sans-serif'}
                            fontSize={7}
                        >
                            {`${currSelectedIndex+1}/${selected.length}`}
                        </text>
                    </g>
                </svg>
            </div>
            <div style={{
                height: height/2 - 20,
                overflow: 'auto',
            }}>
                {this.renderInfo(info)}
            </div>
            {this.renderButtons()}
        </div>);
    }
}

DraggableDataBox.propTypes = {
    initialPos: PropTypes.shape({
        x: PropTypes.number,
        y: PropTypes.number
    }),
    currSelectedIndex: PropTypes.number
};

DraggableDataBox.defaultProps = {
    initialPos: {
        x: 0,
        y: 0
    },
    currSelectedIndex: 0
};

export default DraggableDataBox;