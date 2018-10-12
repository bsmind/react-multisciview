import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import {
    setValue
} from '../../actions/settingActions';

import Slider from 'react-toolbox/lib/slider';

class SettingView extends React.Component {
    render () {
        const { setValue, fontSize } = this.props;
        return (
            <div>
                <Slider pinned snaps 
                    min={6} max={20} step={1} editable 
                    value={fontSize} 
                    onChange={setValue.bind(this, 'fontSize')} />
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        fontSize: state.env.fontSize
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        setValue
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SettingView);