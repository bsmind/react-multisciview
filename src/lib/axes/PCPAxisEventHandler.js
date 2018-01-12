import React from 'react';
import PropTypes from 'prop-types';

import {
    mousePosition,
    d3Window
} from '../utils';

import {
    select,
    event as d3Event,
    mouse,
    touches
} from 'd3-selection';

class PCPAxisEventHandler extends React.Component {
    constructor() {
        super();
        this.state = {
            startX: null
        };
        //this.mouseInteraction = false;
    }

    handleMouseDown = (e) => {
        e.preventDefault();

        const { topHeight, tx } = this.props;
        const mouseXY = mousePosition(e);
        //console.log(tx)

        if (mouseXY[1] < topHeight) {
            console.log('handle filtering')
        } else {
            //console.log('move axis')
            const x = mouseXY[0];
            const xAtCanvas = x + tx;

            select(d3Window(this.node))
                .on('mousemove.axismove', this.handleDrag, false)
                .on('mouseup.axismove', this.handleDragEnd, false);

            this.setState({
                startX: xAtCanvas
            });
        }
    }

    handleDrag = () => {
        const { startX } = this.state;
        const { tx } = this.props;
        const e = d3Event;

        if (startX) {
            const mouseXY = mouse(this.node);
            const diff = (mouseXY[0] + tx) - startX;
            if (this.props.onAxisMove) {
                this.props.onAxisMove(diff, e);
            }
        }
    }

    handleDragEnd = () => {
        select.apply(d3Window(this.node))
            .on('mousemove.axismove', null)
            .on('mouseup.axismove', null);

        

        this.setState({startX: null});
    }


    render () {
        const cursor = this.state.startX
            ? this.props.moveCursorClassName
            : 'react-multiview-default-cursor'

        return <rect 
            ref={node => this.node = node}
            className={`react-multiview-enable-interaction ${cursor}`}
            x={this.props.x}
            y={this.props.y}
            width={this.props.width}
            height={this.props.height}
            style={{fill: "black", opacity: 0.3}}
            //onMouseDown={this.handleMouseDown}
        />
    }
}

export default PCPAxisEventHandler;