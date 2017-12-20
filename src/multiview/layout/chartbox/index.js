import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import theme from './index.css';

class ChartBox extends React.Component {
    constructor() {
        super();
        this.state = {
            scatter: {width: 0, height: 0}
        }
    }

    componentDidMount() {
        window.addEventListener("resize", () => this.handleResize());
        this.handleResize();
    }

    componentWillUnmount() {
        window.removeEventListener("resize", () => this.handleResize());
    }

    handleResize = () => {
        if (this.scatter) {
            console.log('offsetWidth: ', this.scatter.offsetWidth);
            console.log('offsetHeight: ', this.scatter.offsetHeight);
            console.log('offsetLeft', this.scatter.offsetLeft);
            console.log('offsetTop', this.scatter.offsetTop)
            //this.setState({width: this.container.offsetWidth});
        }
    }

    // componentDidMount() {
    //     const width = this.scatter.offsetWidth;
    //     const height = this.scatter.offsetHeight;
    //     console.log(
    //         this.scatter.offsetHeight,
    //         this.scatter.offsetLeft,
    //         this.scatter.offsetTop,
    //         this.scatter.offsetWidth,
    //         this.scatter.clientHeight,
    //         this.scatter.clientLeft,
    //         this.scatter.clientTop,
    //         this.scatter.clientWidth
    //     )

    //     // console.log(this.divScatter.offsetHeight, this.divScatter.offsetWidth)
    //     // console.log(this.divScatter.height)
    //     // this.setState({scatter: {width, height}});
    // }

    render() {
        return (
            <div className={this.props.className}>
                <div className={theme.up}>
                    <div className={theme.left}>
                        projx
                    </div>
                    <div className={theme.right}>
                        up-right
                    </div>                    
                </div>
                <div className={theme.bottom}>
                    <div className={theme.left}
                        ref={c => this.scatter = c}
                    >
                        scatter
                    </div>
                    <div className={theme.right}>
                        projy
                    </div>
                </div>
            </div>
        );
    }
}

ChartBox.propTypes = {};
ChartBox.defaultProps = {};

function mapStateToProps(state) {
    return {};
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ChartBox);