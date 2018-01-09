import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {
    getSampleKinds,
    getAttributes,
    AddData
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
            toolSelected: 0,
            width: 0,
            height: 0
        }
    }

    componentWillMount() {
        this.handleResize();
    }

    componentDidMount() {
        this.props.getSampleKinds();
        this.props.getAttributes();

        window.addEventListener("resize", () => this.handleResize());
    }

    componentWillUnmount() {
        window.removeEventListener("resize", () => this.handleResize());
    }

    shouldComponentUpdate(nextProps) {
        if (nextProps.isDataLoading)
            return false;
        return true;
    }

    handleResize = () => {
        let width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        let height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

        width = width - 200;
        height = height - 41.6 - 56.81 - 4.15;

        this.setState({width, height});
    }

    handleSampleChange = (action, keys) => {
        this.props.AddDelSamples(action, keys);

        const sampleNames = keys.map(key => this.props.sampleKinds[key]);
        this.props.AddData(action, sampleNames);
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
        const {width, height} = this.state;

        return (
            <Layout>
                <NavDrawer active={false} onOverlayClick={null} pinned={false}>
                    settings go here
                </NavDrawer>
                <Panel>
                    <AppBar title='React-MultiView' leftIcon='menu' onLeftIconClick={null} theme={theme} fixed>
                        <ControlBox className={theme.ctlbox} toolId={this.state.toolSelected} />
                    </AppBar>
                </Panel>

                <DataBox className={theme.databox} width={200} height={height}
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

                <ChartBox className={theme.chartbox} width={width} height={height} />

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

        isDataLoading: state.data.numQueried > 0,
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        getSampleKinds,
        getAttributes,
        AddData,
        setAttr,
        AddDelSamples,
        changeSampleColor
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MultiViewApp);
