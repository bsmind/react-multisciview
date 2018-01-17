import React from 'react';

import {
    mousePosition,
    d3Window
} from '../utils';

import {
    select,
    event as d3Event,
    mouse
} from 'd3-selection';

class LegendEventHandler extends React.Component {
    constructor() {
        super();
        this.state = {
            mouseInside: false,
            startX: null
        };
    }

    componentDidMount() {
        if (this.node)
            select(this.node)
                .on('mouseenter', this.handleEnter)
                .on('mouseleave', this.handleLeave);
    }

    componentWillUnmount() {
        if (this.node) {
            select(this.node)
                .on('mouseenter', null)
                .on('mouseleave', null);
        }
    }

    handleEnter = () => {
        this.setState({mouseInside: true});
    }

    handleLeave = () => {
        this.setState({mouseInside: false});
    }
    
    handleMouseDown = (e) => {
        if (e.button !== 0) return;
        if (!this.state.mouseInside) return;

        const mouseXY = mousePosition(e);
        select(d3Window(this.node))
            .on('mousemove', this.handleRangeSelect)
            .on('mouseup', this.handleRangeSelectEnd);

        this.setState({startX: mouseXY[0]});
        e.preventDefault();        
    }

    handleRangeSelect = () => {
        const e = d3Event;

        const mouseXY = mouse(this.node);
        if (this.props.onRangeSelect) {
            this.props.onRangeSelect(this.state.startX, mouseXY[0], e);
        }
    }

    handleRangeSelectEnd = () => {
        const e = d3Event;
        const mouseXY = mouse(this.node);//this.getMouseY();

        if (Math.abs(mouseXY[0] - this.state.startX) < 1e-3) {
            this.setState({startX: null});
            if (this.props.onRangeSelectCancel)
                this.props.onRangeSelectCancel(e);            
        } else {
            //this.setState({endX: mouseXY[0]});
            if (this.props.onRangeSelect)
                this.props.onRangeSelectEnd(this.state.startX, mouseXY[0], e);
        }

        select(d3Window(this.node))
            .on('mousemove', null)
            .on('mouseup', null);

        this.setState({startX: null});
    }    

    render() {
        const cursor = this.state.mouseInside
        ? 'react-multiview-ew-resize-cursor'
        : 'react-multiview-default-cursor'
    
        return <rect
            ref={node => this.node = node}
            className={`react-multiview-enable-interaction ${cursor}`}
            x={this.props.x}
            y={this.props.y}
            width={this.props.width}
            height={this.props.height}
            style={{fill: "green", opacity: 0.}}
            onMouseDown={this.handleMouseDown}
        />;
    }
}

export default LegendEventHandler;