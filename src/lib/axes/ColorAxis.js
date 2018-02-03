import React from 'react';
import PropTypes from 'prop-types';

import uniqueId from 'lodash.uniqueid';
import {
    scaleLinear,
    scaleSequential,
    interpolateViridis
} from 'd3-scale';
import { format as d3Format } from 'd3-format';
import { select, mouse } from 'd3-selection';
import { d3Window, mousePosition, cursorStyle } from '../utils';

class ColorAxis extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            id: uniqueId('colorAxis-'),
            initSite: null,
            width: null
        };
    }

    componentDidMount(){
        window.addEventListener('resize', this.handleResize);
        const el = this.container;
        this.setState({width: el.clientWidth});
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize);
    }

    handleResize = () => {
        const el = this.container;
        this.setState({width: el.clientWidth});        
    }

    getCursor = () => {
        let cursor;
        switch (this.state.initSite) {
            case 'right':
            case 'left': cursor = 'react-multiview-ew-resize-cursor'; break;
            case 'center': cursor = 'react-multiview-grabbing-cursor'; break;
            default: cursor = 'react-multiview-crosshair-cursor';
        }
        return cursor;
    }

    getBarWidth = (props = this.props) => {
        const { width: widthProp, margin } = props;
        const { width: widthState } = this.state;
        const width = widthState || widthProp;
        return Math.floor(Math.max(width - margin.left - margin.right, 0));
    }

    getScale = () => {
        const { minDomain, maxDomain } = this.props;
        const width = this.getBarWidth();
        const scale = scaleLinear().domain([minDomain, maxDomain]).range([0, width]);
        return scale;
    }

    handleMouseDown = (e, handleType) => {
        e.preventDefault();
        const mouseXY = mousePosition(e);
        const scale = this.getScale();
        const { colorBarDomain } = this.props;

        select(d3Window(this.node))
            .on('mousemove', this.handleHandleDrag, false)
            .on('mouseup', this.handleHandleDragEnd, false);

        this.setState({
            startX: mouseXY[0] + scale(colorBarDomain[0]),
            initScale: scale.copy(),
            initSite: handleType,
            initColorBarDomain: colorBarDomain.slice()
        });
    }

    handleHandleDrag = () => {
        const { margin, onColorDomainChange, colorBarDomain } = this.props;
        const { initScale, initSite, startX, initColorBarDomain } = this.state;

        const mouseXY = mouse(this.node);
        const width = this.getBarWidth();
        const domain = initScale.domain();
        const x = Math.min(Math.max(mouseXY[0] - margin.left, 0), width);
        let left, right, tx;

        if (initSite === 'left') {
            left = initScale.invert(x);
            right = colorBarDomain[1];
        } else if (initSite === 'right') {
            left = colorBarDomain[0];
            right = initScale.invert(x);
        } else { // center
            tx = x - startX;
            left = Math.min(Math.max(initScale(initColorBarDomain[0]) + tx, 0), width);
            right = Math.min(Math.max(initScale(initColorBarDomain[1]) + tx, 0), width);
            left = initScale.invert(left);
            right = initScale.invert(right);
        }

        if (onColorDomainChange)
            onColorDomainChange([left, right]);
    }

    handleHandleDragEnd = () => {
        select(d3Window(this.node))
            .on('mousemove', null)
            .on('mouseup', null)

        this.setState({
            initScale: null,
            initSite: null
        });
    }

    renderOverlay = () => {
        const cursor = this.getCursor();
        const width = this.getBarWidth();
        const { colorBarHeight: height } = this.props;
        const OverlayStyle = {
            fill: '#000000',
            opacity: 0.3,
            cursor
        }

        return <rect
            ref = {c => this.colorBar = c}
            x = {0}
            y = {0}
            width = {width}
            height = {height}
            style={OverlayStyle}
            onMouseDown={this.handleOverlayMouseDown}
        />;
    }

    renderColorBar = () => {
        const { id } = this.state;
        const { colorBarDomain, colorBarHeight: height, interpolator } = this.props;
        const scale = this.getScale();
        const width = this.getBarWidth();
        const barLeftPos = scale(colorBarDomain[0]);
        const barRightPos = scale(colorBarDomain[1]);
        
        const colorBarStyle = {
            fill: `url(#${id})`,
        };
        return <g>
            {barLeftPos > 0 &&
                <rect 
                    x={0}
                    y={0}
                    width={barLeftPos+1}
                    height={height}
                    fill={interpolator(0)}
                />
            }
            {barRightPos < width &&
                <rect 
                    x={barRightPos-1}
                    y={0}
                    width={width - barRightPos}
                    height={height}
                    fill={interpolator(1)}
                />
            }
            <rect 
                x={barLeftPos}
                y={0}
                width={barRightPos - barLeftPos}
                height={height}
                style={colorBarStyle}
                onMouseDown={e => this.handleMouseDown(e, 'center')}
            />            
        </g>;
    }

    renderHandles = () => {
        const { handleSize } = this.props;
        const { colorBarDomain } = this.props;
        const scale = this.getScale();
        const barLeftPos = scale(colorBarDomain[0]);
        const barRightPos = scale(colorBarDomain[1]);

        return <g>
            <path
                d={`M${barLeftPos} 0 L${barLeftPos+handleSize/2} ${-handleSize} L${barLeftPos-handleSize/2} ${-handleSize} Z`}
                fill={'red'}
                onMouseDown={e => this.handleMouseDown(e, 'left')}
            />
            <path
                d={`M${barRightPos} 0 L${barRightPos+handleSize/2} ${-handleSize} L${barRightPos-handleSize/2} ${-handleSize} Z`}
                fill={'red'}
                onMouseDown={e => this.handleMouseDown(e, 'right')}
            />            
            <line 
                x1={barLeftPos}
                y1={0}
                x2={barRightPos}
                y2={0}
                style={{
                    stroke: 'red',
                    strokeWidth: 1,
                    fill: 'none'
                }}
            />
        </g>;
    }

    renderAxis = () => {
        const width = this.getBarWidth();
        const { id } = this.state;
        const { colorBarHeight, minDomain, maxDomain } = this.props;
        const { tickSize, numTicks, fontSize, fontFamily } = this.props;

        const formatSI = d3Format(".3s");
        const scale = this.getScale();
        const ticks = [], labels = [];
        for (let i=0; i<numTicks+2; ++i) {
            const pos = i / (numTicks + 1) * width;
            ticks.push(<line
                key={`${id}-tick-${i}`}
                x1={pos}
                y1={0}
                x2={pos}
                y2={tickSize}
                style={{stroke: '#000000', strokeWidth: 1}}
            />);

            labels.push(<text
                x={pos}
                y={tickSize + 1.5*fontSize}
                style={{
                    fontFamily,
                    fontSize,
                    textAnchor: 'middle'
                }}
            >
                {formatSI(scale.invert(pos))}
            </text>);
        }


        return <g transform={`translate(${0},${colorBarHeight})`}>
            <line 
                x1={0}
                y1={0}
                x2={width}
                y2={0}
                style={{
                    stroke: '#000000',
                    strokeWidth: 1
                }}
            />
            {ticks}
            {labels}
        </g>;
    }
    
    render () {
        const { id, width: widthState } = this.state;
        const { height, width: widthProp, margin, interpolator, colorOpacity, reverse } = this.props;
        const width = widthState || widthProp;

        const colorStops = [];
        const nSamples = 20;
        for (let i=0; i<=nSamples; ++i) {
            let offset = (i / nSamples);
            const stopColor = interpolator(reverse ? 1 - offset: offset);
            colorStops.push(
                <stop offset={`${offset * 100}%`} stopColor={stopColor} stopOpacity={colorOpacity} />
            );
        }

        return (
            <div ref={node => this.container = node}>
                <svg 
                    ref={node => this.node = node}
                    width={width} 
                    height={height}
                >
                    <defs>
                        <linearGradient id={id}>
                            {colorStops}
                        </linearGradient>
                    </defs>
                    {cursorStyle(true)}
                    <g transform={`translate(${margin.left},${margin.top})`}
                        className={this.getCursor()}
                    >
                        {this.renderColorBar()}
                        {this.renderHandles()}
                        {this.renderAxis()}
                    </g>
                </svg>
            </div>
        );
    }
}

ColorAxis.propTypes = {
    height: PropTypes.number.isRequired,
    width: PropTypes.number,
    colorBarHeight: PropTypes.number,
    margin: PropTypes.shape({
        left: PropTypes.number,
        right: PropTypes.number,
        top: PropTypes.number,
        bottom: PropTypes.number
    }),
    handleSize: PropTypes.number,
    minDomain: PropTypes.number,
    maxDomain: PropTypes.number,
    colorBarDomain: PropTypes.arrayOf(PropTypes.numTicks),
    interpolator: PropTypes.func,

    numTicks: PropTypes.number,
    tickSize: PropTypes.number,
    fontSize: PropTypes.number,
    fontFamily: PropTypes.string
};
ColorAxis.defaultProps = {
    height: 50,
    width: 280,
    colorBarHeight: 20,
    margin: {
        left: 10,
        right: 10,
        top: 5, 
        bottom: 0
    },
    handleSize: 5,
    minDomain: 0,
    maxDomain: 10,
    colorBarDomain: [0, 10],

    numTicks: 4,
    tickSize: 5,
    fontSize: 6,
    fontFamily: 'Roboto, sans-serif'
};

export default ColorAxis;