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

    draw = (ctx, moreProps) => {
        const {
            legendOrigin,
            legendWidth,
            legendHeight
        } = this.props;
        const {
            zAttr
        } = moreProps;
        const legendScale = scaleSequential(interpolateViridis)
                                .domain([0, legendWidth]);

        ctx.save();
        ctx.translate(legendOrigin.x, legendOrigin.y);

        // draw bar
        const gradient = ctx.createLinearGradient(0, 0, legendWidth, 0);
        const barHeight = Math.round(legendHeight/3);
        for (let i=0; i<legendWidth; ++i) {
            gradient.addColorStop(i/legendWidth, legendScale(i));
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, legendWidth, barHeight);
        // end draw bar

        // draw domain line
        const outerTickSize = 7;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, barHeight + outerTickSize);
        ctx.lineTo(0, barHeight);
        ctx.lineTo(legendWidth, barHeight);
        ctx.lineTo(legendWidth, barHeight + outerTickSize);
        ctx.stroke();
        // end draw domain line

        // draw ticks and labels
        const {
            extents: extentsProp,
            select,
            selectDomain,
        } = zAttr;
        let extents = [0, legendWidth];
        if (extentsProp) {
            if (typeof extentsProp[0] === 'string') 
                extents = [0, extentsProp.length];
            else 
                extents = extentsProp.slice();
        }

        const getValue = i => {
            return (extents[1] - extents[0]) * i + extents[0];
        };
        
        const formatSI = d3Format('.3s');

        const fontSize = 6;
        const fontFamily = 'Roboto, sans-serif';
        const textAnchor = 'center';
        const tickLabelFill = '#000000';
        const innerTickSize = 4;
        const numTicks = 3;
        const tickStep = legendWidth / (numTicks + 2);
        const ticks = [];
        for (let i=0; i*tickStep <= legendWidth; ++i) {
            const value = getValue(i*tickStep / legendWidth);
            ticks.push({
                x1: i*tickStep,
                y1: barHeight,
                x2: i*tickStep,
                y2: barHeight + innerTickSize,
                label: formatSI(value),
                labelX: i*tickStep,
                labelY: barHeight + Math.max(outerTickSize, innerTickSize) + fontSize
            });
        }

        ctx.lineWidth = 1;
        ticks.forEach(tick => {
            ctx.beginPath();
            ctx.moveTo(tick.x1, tick.y1);
            ctx.lineTo(tick.x2, tick.y2);
            ctx.stroke();
        });

        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = tickLabelFill;
        ctx.textAlign = textAnchor;
        ticks.forEach(tick => {
            ctx.beginPath();
            ctx.fillText(tick.label, tick.labelX, tick.labelY);
        });
        // end

        // draw select range
        //if (select) {
        if (selectDomain && this.scale) {
            //console.log('draw select range')
            const start = this.scale(selectDomain[0]);
            const end = this.scale(selectDomain[1]);
            if ( Math.abs( (end - start) - legendWidth ) > 1) {
                ctx.fillStyle = hexToRGBA('#000000', 0.3);
                ctx.rect(start, barHeight, end - start, outerTickSize);
                ctx.fill();
            }
        }
        // end 

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
            legendWidth,
            shared: {zAttr}
        } = props;

        const {
            extents
        } = zAttr;

        const domain = extents == null || isArrayOfString(extents)
            ? [0, legendWidth]
            : extents.slice();

        return scaleLinear().domain(domain).range([0, legendWidth]);
    }

    handleRangeSelect = (start, end, e) => {
        const {legendWidth} = this.props;
        let temp, startRange = start, endRange = end;
        if (startRange > endRange) {
            temp = startRange;
            startRange = endRange;
            endRange = temp;
        }

        startRange = Math.max(0, startRange);
        endRange = Math.min(legendWidth, endRange);

        const scale = this.scale;
        const startDomain = scale.invert(startRange);
        const endDomain = scale.invert(endRange);

        if (this.props.shared.handleZAxisSelect)
            this.props.shared.handleZAxisSelect(
                [startDomain, endDomain],
                [startRange, endRange],
                e
            );
    }

    handleRangeSelectEnd = (start, end, e) => {
        const {legendWidth} = this.props;
        let temp, startRange = start, endRange = end;
        if (startRange > endRange) {
            temp = startRange;
            startRange = endRange;
            endRange = temp;
        }

        startRange = Math.max(0, startRange);
        endRange = Math.min(legendWidth, endRange);        

        const scale = this.scale;
        const startDomain = scale.invert(startRange);
        const endDomain = scale.invert(endRange);

        if (this.props.shared.handleZAxisSelect)
            this.props.shared.handleZAxisSelectEnd(
                [startDomain, endDomain],
                [startRange, endRange],
                e
            );
    }
    

    render() {
        const {
            legendWidth,
            legendHeight,
            legendOrigin,
            shared: {
                handleZAxisSelect,
                handleZAxisSelectEnd,
                handleZAxisSelectCancel,
            }
        } = this.props;

        const barHeight = Math.round(legendHeight/3);
        const outerTickSize = 7;
        

        return (
            <g transform={`translate(${legendOrigin.x},${legendOrigin.y})`}>
                <LegendEventHandler
                    x={0}
                    y={barHeight}
                    width={legendWidth}
                    height={outerTickSize}
                    onRangeSelect={this.handleRangeSelect}
                    onRangeSelectEnd={this.handleRangeSelectEnd}
                    onRangeSelectCancel={handleZAxisSelectCancel}
                />
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