import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {
    getColorMap,
    getSampleKinds,
    getAttributes,
    AddData,
    handleColorChange,
    updateSelectedSamples,
} from './actions/dataActions';

import {
    AddDelSamples,
    changeSampleColor,
    setAttr
} from './actions/visActions';

import {Layout, Panel, NavDrawer} from 'react-toolbox/lib/layout';
import {AppBar} from 'react-toolbox/lib/app_bar';
import Button from 'react-toolbox/lib/button';


import {
    DataBox,
    DataDialog,
    ToolBox,
    ControlBox,
    ChartBox,
} from './layout';


import theme from './index.css';

import get from 'lodash.get';

class MultiViewApp extends React.Component {
    constructor() {
        super();
        this.state = {
            toolSelected: 0,
            //width: 0,
            //height: 0,
            showDataDialog: false
        }
    }

    componentWillMount() {
        //this.handleResize();
    }

    componentDidMount() {
        this.props.getSampleKinds();
        this.props.getAttributes();
        this.props.getColorMap();

        //window.addEventListener("resize", () => this.handleResize());
    }

    componentWillUnmount() {
        //window.removeEventListener("resize", () => this.handleResize());
    }

    shouldComponentUpdate(nextProps) {
        if (nextProps.isDataLoading)
            return false;
        return true;
    }

    // handleResize = () => {
    //     let width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    //     let height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    //     //width = width - 200;
    //     height = height - 41.6 - 56.81 - 4.15;

    //     this.setState({width, height});
    // }

    handleSampleChange = (action, keys) => {
        this.props.AddDelSamples(action, keys);

        const sampleNames = keys.map(key => this.props.sampleKinds[key]);
        this.props.AddData(action, sampleNames);
    }

    handleAttrChange = (dim, value) => {
        if (value.length === 0) return;
        const {
            attr,
            attrFormat,
            attrKinds
        } = this.props;

        const oldAttr = attrFormat(get(attr, dim));
        if (value !== oldAttr && this.props.setAttr) {
            const attrKeys = Object.keys(attrKinds);
            const index = attrKeys.findIndex(key => key.includes(value));
            //console.log(attrKinds[attrKeys[index]])
            this.props.setAttr(dim, attrKeys[index]);
        }
    }

    handleToolChange = (toolid) => {
        this.setState({toolSelected: toolid});
    }

    handleSampleUpdate = (doUpdate, selected, colors) => {
        if (doUpdate && this.props.updateSelectedSamples) {
            this.props.updateSelectedSamples(selected, colors);
        }
        this.setState({showDataDialog: !this.state.showDataDialog});        
    }

    onToggleDataDialog = () => {
        this.setState({showDataDialog: !this.state.showDataDialog});
    }

    render() {
        //const {width} = this.state;

        //console.log(this.props.attrKinds)

        return (
            <Layout>
                <NavDrawer active={false} onOverlayClick={null} pinned={false}>
                    settings go here
                </NavDrawer>
                <Panel>
                    <AppBar title='React-MultiView' leftIcon='menu' onLeftIconClick={null} theme={theme} fixed flat>
                        {/* <ControlBox className={theme.ctlbox} toolId={this.state.toolSelected} /> */}
                    </AppBar>
                </Panel>

                {/* <DataBox className={theme.databox} width={200} height={height}
                    sampleKinds={this.props.sampleKinds}
                    samples={this.props.sampleSelected}
                    colors={this.props.sampleColors}
                    onSampleChange={this.handleSampleChange}
                    onColorChange={key => this.props.changeSampleColor(key)}
                /> */}

                {/* <ToolBox className={theme.toolbox}
                    toolid={this.state.toolSelected}
                    attrKinds={this.props.attrKinds}
                    attr={this.props.attr}
                    onAttrChange={this.handleAttrChange}
                    onToolChange={this.handleToolChange}
                /> */}
                <ToolBox className={theme.toolbox} 
                    onToggleDataDialog={this.onToggleDataDialog}
                    attrKinds={this.props.attrKinds}
                    attrFormat={this.props.attrFormat}
                    attr={this.props.attr}
                    onAttrChange={this.handleAttrChange}                    
                />


                <DataDialog 
                    title='Data Selector'
                    active={this.state.showDataDialog}
                    samples={this.props.sampleKinds}
                    sampleSelected={this.props.sampleSelected}
                    sampleColors={this.props.sampleColors}
                    sampleColorOpacity={this.props.sampleColorOpacity}
                    onColorChange={this.props.handleColorChange}
                    onSampleUpdate={this.handleSampleUpdate}
                    onToggleDataDialog={this.onToggleDataDialog}
                />

                <ChartBox className={theme.chartbox} />

                {/* <div className={theme.footer} /> */}

            </Layout>
        );
    }
}

function mapStateToProps(state) {
    return {
        sampleKinds: state.data.sampleKinds,
        sampleColors: state.data.sampleColors,
        sampleColorOpacity: state.data.sampleColorOpacity,
        sampleSelected: state.data.samples,
        attrKinds: state.data.attrKinds,
        attrFormat: state.data.attrFormat,

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
        //changeSampleColor,
        handleColorChange,
        updateSelectedSamples,
        getColorMap
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(MultiViewApp);
