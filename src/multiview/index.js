import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {
    getSampleKinds,
    getAttributes
} from './actions/dataActions';

import {
    AddDelSamples,
    changeSampleColor,
    setAttr
} from './actions/visActions';

import {Layout, Panel, NavDrawer} from 'react-toolbox/lib/layout';
import {AppBar} from 'react-toolbox/lib/app_bar';

import {
    DataBox,
    ToolBox,
    ControlBox,
    ChartBox
} from './layout';

import theme from './index.css';

import get from 'lodash.get';

class MultiViewApp extends React.Component {
    constructor() {
        super();
        this.state = {
            toolSelected: 0
        }
    }

    componentDidMount() {
        this.props.getSampleKinds();
        this.props.getAttributes();
    }

    handleSampleChange = (action, keys) => {
        this.props.AddDelSamples(action, keys);
    }

    handleAttrChange = (dim, value) => {
        if (value.length === 0) return;
        const {attr} = this.props;
        const oldAttr = get(attr, dim);
        if (value !== oldAttr && this.props.setAttr)
            this.props.setAttr(dim, value);
    }

    handleToolChange = (toolid) => {
        this.setState({toolSelected: toolid});
    }

    render() {
        return (
            <Layout>
                <NavDrawer active={false} onOverlayClick={null} pinned={false}>
                    settings go here
                </NavDrawer>
                <Panel>
                    <AppBar title='React-MultiView' leftIcon='menu' onLeftIconClick={null} theme={theme}>
                        <ControlBox className={theme.ctlbox} toolId={this.state.toolSelected} />
                    </AppBar>
                </Panel>
                    <DataBox className={theme.databox}
                        sampleKinds={this.props.sampleKinds}
                        samples={this.props.sampleSelected}
                        colors={this.props.sampleColors}
                        onSampleChange={this.handleSampleChange}
                        onColorChange={key => this.props.changeSampleColor(key)}
                    />
                    <ToolBox className={theme.toolbox}
                        toolid={this.state.toolSelected}
                        attrKinds={this.props.attrKinds}
                        attr={this.props.attr}
                        onAttrChange={this.handleAttrChange}
                        onToolChange={this.handleToolChange}                    
                    />
                    <ChartBox className={theme.chartbox} />                
                    <div className={theme.footer} />
            </Layout>
        );
    }
}

function mapStateToProps(state) {
    return {
        sampleKinds: state.data.sampleKinds,
        sampleSelected: state.vis.samples,
        sampleColors: state.vis.sampleColors,

        attrKinds: state.data.attrKinds,
        attr: {
            x: state.vis.attrx,
            y: state.vis.attry,
            z: state.vis.attrz
        },
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        getSampleKinds,
        getAttributes,
        setAttr,
        AddDelSamples,
        changeSampleColor
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MultiViewApp);