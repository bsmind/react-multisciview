import React from 'react';

import LegendEventHandler from './LegendEventHandler';
import { SubscriberExt } from '../core';

import {
    isArrayOfString,
    hexToRGBA
} from '../utils';

import {
    scaleSequential,
    scaleLinear,
    interpolateViridis
} from 'd3-scale';

import {
    format as d3Format, format
} from 'd3-format'

class ColorLegend extends React.Component {
    constructor(props) {
        super(props);
        this.scale = this.getScale(props);
    }

    getTicks = (width, height, extents) => {
        const getValue = i => {
            return (extents[1] - extents[0]) * i + extents[0];
        };
        const formatSI = d3Format('.3s');
        const { labelStyle, numTicks, innerTickSize, outerTickSize, orient } = this.props;
        const { fontSize } = labelStyle;
        const textAnchor = orient === 'vertical' ? 'start': 'center';
        const length = orient === 'vertical' ? height: width;
        const tickStep = length / (numTicks + 2);
        const ticks = [];

        for (let i=0; i <= (numTicks+2); ++i) {
            const temp = orient === 'horizontal' 
                ? i*tickStep/length 
                : 1 - i*tickStep/length;

            const value = getValue(temp);
            const pos = i*tickStep;
            if (orient === 'horizontal') {
                ticks.push({
                    x1: pos,
                    y1: height,
                    x2: pos,
                    y2: height + innerTickSize,
                    label: formatSI(value),
                    labelX: pos,
                    labelY: height + Math.max(outerTickSize, innerTickSize) + fontSize
                });
            } else {
                ticks.push({
                    x1: width,
                    y1: pos,
                    x2: width + innerTickSize,
                    y2: pos,
                    label: formatSI(value),
                    labelX: width + Math.max(outerTickSize, innerTickSize) + fontSize,
                    labelY: pos
                });                
            }
        }        

        return ticks;
    }    

    drawColorBar = (ctx, width, height, orient, scale) => {
        let gradient, i;

        if (orient === 'horizontal') {
            gradient = ctx.createLinearGradient(0, 0, width, 0);
            for (i=0; i<width; ++i)
                gradient.addColorStop(i/width, scale(i));
        } else {
            gradient = ctx.createLinearGradient(0, 0, 0, height);
            for (i=0; i<height; ++i)
                gradient.addColorStop(i/height, scale(i));
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);        
    }

    drawMainLine = (ctx, width, height, orient) => {
        const { outerTickSize } = this.props;
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (orient === 'horizontal') {
            ctx.moveTo(0, height + outerTickSize);
            ctx.lineTo(0, height);
            ctx.lineTo(width, height);
            ctx.lineTo(width, height + outerTickSize);
        } else {
            ctx.moveTo(width + outerTickSize, 0);
            ctx.lineTo(width, 0);
            ctx.lineTo(width, height);
            ctx.lineTo(width + outerTickSize, height);
        }
        ctx.stroke();
    }

    drawTicks = (ctx, ticks) => {
        const { labelStyle, orient } = this.props;
        const { fontSize, fontFamily, tickLabelFill } = labelStyle;

        ctx.lineWidth = 1;
        ticks.forEach(tick => {
            ctx.beginPath();
            ctx.moveTo(tick.x1, tick.y1);
            ctx.lineTo(tick.x2, tick.y2);
            ctx.stroke();
        });

        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = tickLabelFill;
        ctx.textAlign = orient === 'vertical' ? 'start': 'center';
        ticks.forEach(tick => {
            ctx.beginPath();
            ctx.fillText(tick.label, tick.labelX, tick.labelY);
        });        
    }

    drawSelect = (ctx, zAttr, width, height) => {
        const { select, selectDomain } = zAttr;
        const { legendHeight, legendWidth, orient, outerTickSize, innerTickSize } = this.props;

        if (select && selectDomain && this.scale) {
            const length = orient === 'horizontal' ? legendWidth: legendHeight;
            const thickness = Math.max(outerTickSize, innerTickSize);
            const start = this.scale(selectDomain[0]);
            const end = this.scale(selectDomain[1]);
            if ( Math.abs( (end - start) - length ) > 1) {
                ctx.fillStyle = hexToRGBA('#000000', 0.3);
                orient === 'horizontal'
                    ? ctx.rect(start, height, end - start, thickness)
                    : ctx.rect(width, start, thickness, end - start);
                ctx.fill();
            }
        }
    }

    draw = (ctx, moreProps) => {
        const { orient } = this.props;
        const { zAttr } = moreProps;
        const {x, y, barWidth, barHeight} = this.getDrawRegion();

        if (isArrayOfString(zAttr.extents))
            return;
        
        const legendScale = orient === 'hrizontal'
            ? scaleSequential(interpolateViridis).domain([0, barWidth])
            : scaleSequential(interpolateViridis).domain([barHeight, 0]);

        const ticks = this.getTicks(barWidth, barHeight, zAttr.extents);

        ctx.save();
        ctx.translate(x, y);
        this.drawColorBar(ctx, barWidth, barHeight, orient, legendScale);
        this.drawMainLine(ctx, barWidth, barHeight);
        this.drawTicks(ctx, ticks);
        this.drawSelect(ctx, zAttr, barWidth, barHeight);
        ctx.restore();
    }

    componentDidMount() {
        this.scale = this.getScale();
    }

    componentWillReceiveProps(nextProps) {
        this.scale = this.getScale(nextProps);
    }

    getScale = (props = this.props) => {
        const {
            orient,
            legendHeight,
            legendWidth,
            shared: {zAttr}
        } = props;

        const { extents } = zAttr;
        const domain = extents == null || isArrayOfString(extents)
            ? orient === 'horizontal' ? [0, legendWidth]: [0, legendHeight]
            : extents.slice();
        const range = orient === 'horizontal'
            ? [0, legendWidth]
            : [legendHeight, 0];

        return scaleLinear().domain(domain).range(range);
    }


    rangeSelectHelper = (start, end) => {
        const getPos = this.props.orient === 'horizontal' ? d => d[0]: d => d[1];
        let temp, startRange = getPos(start), endRange = getPos(end);
        if (startRange > endRange) {
            temp = startRange;
            startRange = endRange;
            endRange = temp;
        }

        const { legendWidth, legendHeight, orient } = this.props;
        const scale = this.scale;        
        let startDomain, endDomain;
        startRange = Math.max(0, startRange);
        if (orient === 'horizontal') {
            endRange = Math.min(legendWidth, endRange);               
        } else {
            endRange = Math.min(legendHeight, endRange);
        }
        startDomain = scale.invert(startRange);
        endDomain = scale.invert(endRange);
        
        if (startDomain > endDomain) {
            temp = startDomain;
            startDomain = endDomain;
            endDomain = temp;
        }

        return {
            domain: [startDomain, endDomain],
            range: [startRange, endRange]
        };
    }

    handleRangeSelect = (start, end, e) => {
        const {domain, range} = this.rangeSelectHelper(start, end);

        if (this.props.shared.handleZAxisSelect)
            this.props.shared.handleZAxisSelect(domain, range, e);
    }

    handleRangeSelectEnd = (start, end, e) => {
        const {domain, range} = this.rangeSelectHelper(start, end);
        
        if (this.props.shared.handleZAxisSelect)
            this.props.shared.handleZAxisSelectEnd(domain, range, e);
    }
    
    getDrawRegion = () => {
        // only, vertical && fixed location (top-right)
        const { legendWidth, legendHeight, orient } = this.props;
        const { canvasDim } = this.props.shared;
        const margin = {left: 0, right: 20, top: 10, bottom: 0};
        
        let x, y, width, height, barWidth, barHeight, transform;
        x = canvasDim.width - margin.right - legendWidth;
        y = margin.top;

        if (orient === 'vertical') {
            barWidth = Math.floor(legendWidth / 2);
            barHeight = legendHeight;
            width = legendWidth - barWidth;
            height = legendHeight;
            transform = `translate(${x + barWidth},${y})`;
        } else { // 'hotizonal'
            barWidth = legendWidth;
            barHeight = Math.floor(legendHeight / 2);    
            width = legendWidth;
            height = legendHeight - barHeight;
            transform = `translate(${x},${y + barHeight})`
        }

        return {x, y, width, height, barWidth, barHeight, transform};
    }

    render() {
        const {
            shared: {
                handleZAxisSelectCancel,
            },
            orient
        } = this.props;

        const {width, height, transform} = this.getDrawRegion();
        const getMouseMoveDist = (xy0, xy1) => {
            if (orient === 'horizontal')
                return Math.abs(xy0[0] - xy1[0]);
            return Math.abs(xy0[1] - xy1[1]);
        }
        const cursor = orient === 'horizontal'
            ? 'react-multiview-ew-resize-cursor'
            : 'react-multiview-ns-resize-cursor';

        return (
            <g transform={transform}>
                {/* <LegendEventHandler
                    x={0}
                    y={0}
                    width={width}
                    height={height}
                    getMouseMoveDist={getMouseMoveDist}
                    selectCursorStyle={cursor}
                    onRangeSelect={this.handleRangeSelect}
                    onRangeSelectEnd={this.handleRangeSelectEnd}
                    onRangeSelectCancel={handleZAxisSelectCancel}
                /> */}
                <SubscriberExt
                    ref={node => this.node = node}
                    canvas={contexts => contexts.axes}
                    clip={false}
                    edgeClip={false}
                    draw={this.draw}
                    drawOn={["pan"]}
                    shared={this.props.shared}
                />
            </g>
        );
    }
}

export default ColorLegend;