import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {
    getSampleKinds
} from './actions/dataActions';

import {
    AddDelSamples,
    changeSampleColor
} from './actions/visActions';

import {Layout, Panel, NavDrawer} from 'react-toolbox/lib/layout';
import {AppBar} from 'react-toolbox/lib/app_bar';

import {
    DataBox
} from './layout';

import theme from './index.css';

class MultiViewApp extends React.Component {
    constructor() {
        super();
        this.state = {
            toolSelected: 0
        }
    }

    componentDidMount() {
        this.props.getSampleKinds();
    }

    handleSampleChange = (action, keys) => {
        this.props.AddDelSamples(action, keys);
    }

    render() {
        return (
            <Layout>
                <NavDrawer active={false} onOverlayClick={null} pinned={false}>
                    settings go here
                </NavDrawer>
                <Panel>
                    <AppBar title='React-MultiView' leftIcon='menu' onLeftIconClick={null} theme={theme}>
                    </AppBar>
                </Panel>
                <DataBox className={theme.databox}
                    sampleKinds={this.props.sampleKinds}
                    samples={this.props.sampleSelected}
                    colors={this.props.sampleColors}
                    onSampleChange={this.handleSampleChange}
                    onColorChange={key => this.props.changeSampleColor(key)}
                />
            </Layout>
        );
    }
}

function mapStateToProps(state) {
    return {
        sampleKinds: state.data.sampleKinds,
        sampleSelected: state.vis.samples,
        sampleColors: state.vis.sampleColors,
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        getSampleKinds,
        AddDelSamples,
        changeSampleColor
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MultiViewApp);