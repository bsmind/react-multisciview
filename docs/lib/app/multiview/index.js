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
    ConfigBox,
    ScatterBox
} from './layout';


import theme from './index.css';
import get from 'lodash.get';

class MultiViewApp extends React.Component {
    constructor() {
        super();
        this.state = {
            width: 0,
            height: 0,
        }

        this.pcpAttrSelect={};
        this.__dataExtents={};
    }

    componentWillMount() {
        this.handleResize();
    }

    componentDidMount() {
        this.props.getSampleKinds();
        this.props.getAttributes();
        this.props.getColorMap();

        window.addEventListener("resize", () => this.handleResize());
    }

    componentWillUnmount() {
        window.removeEventListener("resize", () => this.handleResize());
    }

    shouldComponentUpdate(nextProps) {
        // if (nextProps.isDataLoading)
        //     return false;
        return true;
    }

    handleResize = () => {
        let width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        let height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

        width = width;
        height = height - 41.6;// - 56.81;// - 4.15;

        this.setState({width, height});
    }

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

    // update scatter plot by pcp
    handlePCPAxisSelect = (axisTitle, domain, inProgress, aux) => {
        const ScatterBoxRef = this.refs['ScatterBoxRef'].getWrappedInstance();
        const ScatterChartRef = ScatterBoxRef.refs['ScatterChartRef'].getWrappedInstance();
        const ScatterCanvasNode = ScatterChartRef.getScatterChartCanvasNode();
        ScatterCanvasNode.handleByOther({
            what: 'extents', 
            data: {[axisTitle]: domain.slice()},
            inProgress}
        );
        this.pcpAttrSelect[axisTitle] = {
            domain: domain.slice(),
            auxiliary: aux ? aux.slice(): null
        };
    }

    // todo: update pcp by scatter plot
    handleScatterPanZoom = (newDataExtents, inProgress) => {
        Object.keys(newDataExtents).forEach(key => {
            this.__dataExtents[key] = newDataExtents[key].slice();
        });

        const ConfigBoxRef = this.refs['ConfigBoxRef'].getWrappedInstance();
        if (ConfigBoxRef.refs['PCPTabRef']) {
            const pcpNode = ConfigBoxRef.refs['PCPTabRef'].refs['PCPChartRef'].node.refs['PCPCanvasRef'];
            pcpNode.handleByOtherFull(this.__dataExtents, inProgress);
        }
        //console.log(ConfigBoxRef)
        //const PCPTabRef = ConfigBoxRef.refs['PCPTabRef'].getWrappedInstance();
        //console.log(PCPTabRef);
        //console.log(newDataExtents)
        //Object.keys(newDataExtents).forEach()
    }    



    render() {
        const {width, height} = this.state;

        const scatterBoxWidth = Math.min(Math.floor(0.6 * width), Math.floor(height));
        const scatterBoxStyle = {
            width: scatterBoxWidth,
            float: 'left'
        };
        const configBoxStyle = {
            marginLeft: scatterBoxWidth
        };

        return (
            <Layout>
                <Panel>
                    <AppBar title='React-MultiView' leftIcon='menu' onLeftIconClick={null} theme={theme} fixed flat />
                </Panel>

                <div className={theme.chartbox}>
                    <div style={{width: scatterBoxWidth, float: 'left'}}>
                        <ScatterBox 
                            ref={'ScatterBoxRef'}
                            width={scatterBoxWidth} height={scatterBoxWidth} 
                            onScatterPanZoom={this.handleScatterPanZoom}
                        />
                    </div>
                    <div style={{marginLeft: scatterBoxWidth}}>
                        <ConfigBox
                            ref={'ConfigBoxRef'} 
                            height={height}
                            onPCPAxisSelect={this.handlePCPAxisSelect}
                            //pcpAttrSelect={this.pcpAttrSelect}
                            dataExtents={this.__dataExtents}
                        />
                    </div>
                </div>
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

export default connect(mapStateToProps, mapDispatchToProps, null, {withRef: true})(MultiViewApp);
