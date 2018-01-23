import React from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {
    getAttrX,
    getAttrY,
    getAttrZ,
    getAttrKinds,
    getSampleKinds,
    getSelectedSampleColors,
    getSampleColorOpacity,
    getSelectedSampleKeys,
    getShowImageSwitch,
    // for pcp
    getSelectedDataArray,
    getPCPSelectedDimension
} from '../../selectors';

import {
    addSelectedSamples,
    delSelectedSamples,
    changeSelectedSampleColors
} from '../../actions/dataActions';

import {
    setAttr,
    setSwitch,
    updateAttrSelect
} from '../../actions/visActions';

import {Tab, Tabs} from 'react-toolbox';
import DataTab from './DataTab';
import ScatterTab from './ScatterTab';
import PcpTab from './pcpTab';

import Dropdown from 'react-toolbox/lib/dropdown';


class ConfigBox extends React.Component {
    constructor() {
        super();
        this.state = {
            index: 0,
        }
    }
    
    handleTabChange = (index) => {
        this.setState({index});
    }

    handleAttrChange = (dim, value) => {
        if (value.length === 0) return;
        const {
            attr,
            attrFormat,
            attrKinds
        } = this.props;

        const oldAttr = attrFormat(attr[dim]);
        if (value !== oldAttr && this.props.setAttr) {
            const attrKeys = Object.keys(attrKinds);
            const index = attrKeys.findIndex(key => key.includes(value));
            this.props.setAttr(dim, attrKeys[index]);
        }        
    }

    render() {
        return (
            <Tabs fixed
                style={{outline: 'none'}}
                index={this.state.index} 
                onChange={this.handleTabChange}>
                <Tab label='DATA'>
                    <DataTab 
                        height={this.props.height}
                        samples={this.props.sampleKinds}
                        sampleSelected={this.props.sampleSelected}
                        sampleColors={this.props.sampleColors}
                        sampleColorOpacity={this.props.sampleColorOpacity}
                        onColorChange={this.props.changeSelectedSampleColors}
                        onSampleAdd={this.props.addSelectedSamples}
                        onSampleDel={this.props.delSelectedSamples}
                    />
                </Tab>
                <Tab label='SCATTER'>
                    <ScatterTab
                        attrKinds={this.props.attrKinds}
                        attr={this.props.attr}
                        attrFormat={this.props.attrFormat}
                        showImage={this.props.showImage}
                        onAttrChange={this.handleAttrChange}
                        onSwitchChange={this.props.setSwitch}
                    />
                </Tab>
                <Tab label='PCP'>
                    <PcpTab
                        dimKinds={this.props.attrKinds}
                        dimOrder={this.props.dimOrder}
                        dimension={this.props.dimension}
                        data={this.props.data}
                        attrFormat={this.props.attrFormat}
                        zAttr={this.props.attr.z}
                        colorsBySampleNames={this.props.sampleColors}
                        onColorAttrChange={this.handleAttrChange}
                        onAttrSelectChange={this.props.updateAttrSelect}
                    />
                </Tab>
            </Tabs>
        );
    }
}

function mapStateToProps(state) {
    const {id, samples, data, extents: dimension} = getSelectedDataArray(state);
    const pcpDimension = getPCPSelectedDimension(state);
    // const pcpExtents = {};
    // pcpDimension.forEach(dimName => {
    //     pcpExtents[dimName] = dimension[dimName];
    // });
    //console.log(getAttrKinds(state))

    return {
        sampleKinds: getSampleKinds(state),
        sampleColors: getSelectedSampleColors(state),
        sampleColorOpacity: getSampleColorOpacity(state),
        sampleSelected: getSelectedSampleKeys(state),

        attrKinds: getAttrKinds(state),
        attr: {
            x: getAttrX(state),
            y: getAttrY(state),
            z: getAttrZ(state)
        },
        attrFormat: state.data.attrFormat,

        showImage: getShowImageSwitch(state),

        // for pcp
        dimOrder: pcpDimension,
        dimension: dimension,
        data,

        // data,
        // colorAccessor,
        // titleFormat,
        // onPCPAxisSelect,
    
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        addSelectedSamples,
        delSelectedSamples,
        changeSelectedSampleColors,
        setAttr,
        setSwitch,
        updateAttrSelect
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ConfigBox);