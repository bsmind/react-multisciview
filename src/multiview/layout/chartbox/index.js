import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import theme from './index.css';

import TestSizeMe from './testSizeMe';
import MyComponent from './myComponent';

class ChartBox extends React.Component {
    constructor() {
        super();
        this.state = {
            width: 0,
            height: 0
        };
    }

    // componentDidMount() {
    //     window.addEventListener("resize", () => this.handleResize());
    //     this.handleResize();
    // }

    // componentWillUnmount() {
    //     window.removeEventListener("resize", () => this.handleResize());
    // }

    // handleResize = () => {
    //     if (this.rect) {
    //         const width = this.rect.clientWidth;
    //         const height = this.rect.clientHeight;
    //         console.log(document.documentElement.clientWidth);
    //         console.log(document.documentElement.clientHeight);
    //         this.setState({width, height});
    //     }                
    // }

    render() {
        const {width, height} = this.props;

        const scatter_width = Math.floor(width - 100 - 20);
        const scatter_height = Math.floor(height - 100 - 10);

        return (
            <div className={this.props.className}>
                <div className={theme.up}>
                    <div className={theme.left}> 
                        <svg width={scatter_width} height={100}
                            style={{backgroundColor: 'green', opacity: 0.5}} />
                    </div>
                    <div className={theme.right}> 
                        up-right
                    </div>                    
                </div>

                <div className={theme.bottom}>
                    <div className={theme.left}> 
                        <svg width={scatter_width} height={scatter_height} 
                            style={{backgroundColor: 'blue', opacity: 0.5}}
                        />
                    </div>
                    <div className={theme.right}> 
                        <svg width={100} height={scatter_height}
                            style={{backgroundColor: 'red', opacity: 0.5}} />
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