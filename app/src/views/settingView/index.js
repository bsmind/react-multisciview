import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import {
    setValue
} from "../../actions/settingActions"

import {Button} from "react-toolbox/lib/button";
import {Slider} from "react-toolbox/lib/slider";
import {Dialog} from "react-toolbox";

class SettingView extends React.Component {
    constructor() {
        super();
        this.state = {
            isOpen: false
        };
    }

    handleToggle = (e) => {
        this.setState({isOpen: !this.state.isOpen});
    }

    renderSlider = (label, config, val, onChange) => {
        return (
            <div>
                <p>{label}</p>
                <Slider 
                    {...config}
                    value={val}
                    onChange={onChange}
                />
            </div>
        );
    }

    renderSliderButtonLabel = (label, config, val, onChange, btnLabel, btnOnClick) => {
        return (
            <div>
                <p>{label}</p>
                <div style={{display: 'inline-block', width: '10%'}}>
                    <Button label={btnLabel} onClick={btnOnClick} />
                </div>
                <div style={{display: 'inline-block', width: '90%'}}>
                    <Slider 
                        {...config}
                        value={val}
                        onChange={onChange}
                    />
                </div>
            </div>
        );
    }

    renderSetting = () => {
        return (
            <div>
                {this.renderSlider('Scatter Font Size', {
                    min: 6, max: 20, step: 1,
                    pinned: true, snaps: true, editable: true
                }, this.props.fontSize, v => this.props.setValue('fontSize', v))}
                {this.renderSliderButtonLabel('Scatter Icon Type & Size',{
                    min: 6, max: 20, step: 1,
                    pinned: true, snaps: true, editable: true
                }, this.props.iconSize, v => this.props.setValue('iconSize', v),
                this.props.iconType, e => this.props.setValue('iconType', this.props.iconType === 'square' ? 'circle': 'square'))}
                {this.renderSlider('Scatter Zoom Sensitivity', {
                    min: 1, max: 10, step: 1,
                    pinned: true, snaps: true, editable: true
                }, this.props.zoomSensitivity, v => this.props.setValue('zoomSensitivity', v))}
                {this.renderSlider('Image Scale (negative: 1/n, zero: 1, positive: n)', {
                    min: 0.001, max: 5, editable: true
                }, this.props.imageScale, v => this.props.setValue('imageScale', v))}
                {this.renderSlider('PCP Font Size', {
                    min: 6, max: 20, step: 1,
                    pinned: true, snaps: true, editable: true
                }, this.props.pcpFontSize, v => this.props.setValue('pcpFontSize', v))}
                
            </div>
        );
    }

    render() {
        return (
            <div style={{display: 'inline-block'}}>
                <Button
                    label='Settings'
                    onClick={this.handleToggle}
                />
                <Dialog
                    active={this.state.isOpen}
                    onEscKeyDown={this.handleToggle}
                    onOverlayClick={this.handleToggle}
                    title="Setting Manager"
                    type="normal"
                >
                    {this.renderSetting()}
                </Dialog>
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        fontSize: state.env.fontSize,
        iconSize: state.env.iconSize,
        iconType: state.env.iconType,
        pcpFontSize: state.env.pcpFontSize,
        zoomSensitivity: state.env.zoomSensitivity,
        imageScale: state.env.imageScale,
    };
};

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        setValue
    }, dispatch);
};

export default connect(mapStateToProps, mapDispatchToProps)(SettingView);