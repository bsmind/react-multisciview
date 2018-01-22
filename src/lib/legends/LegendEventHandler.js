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
            startXY: null,
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

        this.setState({startXY: mouseXY});
        e.preventDefault();        
    }

    handleRangeSelect = () => {
        const e = d3Event;

        const mouseXY = mouse(this.node);
        if (this.props.onRangeSelect) {
            this.props.onRangeSelect(this.state.startXY, mouseXY, e);
        }
    }

    handleRangeSelectEnd = () => {
        const e = d3Event;
        const mouseXY = mouse(this.node);//this.getMouseY();

        const dist = this.props.getMouseMoveDist(mouseXY, this.state.startXY);
        if (dist < 1) {
            if (this.props.onRangeSelectCancel)
                this.props.onRangeSelectCancel(e);            
        } else {
            if (this.props.onRangeSelectEnd)
                this.props.onRangeSelectEnd(this.state.startXY, mouseXY, e);
        }

        select(d3Window(this.node))
            .on('mousemove', null)
            .on('mouseup', null);

        this.setState({startXY: null});
    }    

    render() {
        const cursor = this.state.mouseInside
        ? this.props.selectCursorStyle
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