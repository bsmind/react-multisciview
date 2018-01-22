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
    getShowImageSwitch
} from '../../selectors';

import {
    addSelectedSamples,
    delSelectedSamples,
    changeSelectedSampleColors
} from '../../actions/dataActions';

import {
    setAttr,
    setSwitch
} from '../../actions/visActions';

import {Tab, Tabs} from 'react-toolbox';
import DataTab from './DataTab';
import ScatterTab from './ScatterTab';

class ConfigBox extends React.Component {
    constructor() {
        super();
        this.state = {
            index: 0
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
            <Tabs index={this.state.index} onChange={this.handleTabChange} fixed>
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
                <Tab label='PCP'><small>PCP</small></Tab>
            </Tabs>
        );
    }
}

function mapStateToProps(state) {
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
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        addSelectedSamples,
        delSelectedSamples,
        changeSelectedSampleColors,
        setAttr,
        setSwitch
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ConfigBox);