import React from 'react';
import PropTypes from 'prop-types';

class EventHandlerSVG extends React.Component {
    constructor() {
        super();
        this.state = {
            panInProgress: false
        }
    }

    render() {
        const className = this.state.panInProgress
            ? 'react-multiview-grabbing-cursor'
            : 'react-multiview-crosshair-curosr';

        return <rect 
            ref={node => this.node = node}
            className={className}
            width={this.props.width}
            height={this.props.height}
            style={{fill: "red", opacity: 0.3 }}
        />;
    }
}

export default EventHandlerSVG;