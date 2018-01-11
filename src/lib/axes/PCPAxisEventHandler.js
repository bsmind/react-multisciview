import React from 'react';
import PropTypes from 'prop-types';

class PCPAxisEventHandler extends React.Component {
    render () {

        return <rect 
            ref={node => this.node = node}
            className={''}
            x={this.props.x}
            y={this.props.y}
            width={this.props.width}
            height={this.props.height}
            style={{fill: "green", opacity: 0.3}}
        />
    }
}

export default PCPAxisEventHandler;