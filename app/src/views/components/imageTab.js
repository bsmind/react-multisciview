import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import Autocomplete from "react-toolbox/lib/autocomplete";
import Slider from "react-toolbox/lib/slider";
import { ColorAxis } from "react-multiview/lib/axes";
import { Button } from "react-toolbox/lib/button";
import { getColorInterpolator, colorInterpolators } from '../../utils';
import theme from './index.css';

import {
    getImageColorInterpolator
} from "../../selectors";

import {
    setValue,
    changeImgColorScheme,
    changeImgDomain,
} from "../../actions/dataActions";

import { setValue as setEnvValue } from "../../actions/settingActions"; 


class ImageTab extends React.Component {
    render() {
        const {showImage, minPoints, minImageSize, imageScale} = this.props;
        const {onSwitchChange, onSliderChange, onImageScaleChange} = this.props;

        return (
            <div>
                <div className={theme.tabDiv}>
                    <Button icon="photo" label="Show Image" accent={showImage}
                        onClick={() => onSwitchChange("showImage", !showImage)} />				
                    <p style={{fontFamily: 'Roboto, Helvetica, Arial, sans-serif', fontSize: '11px'}}>MIN. # POINTS (on scatter plot to show images):</p>
                    <Slider pinned min={20} max={400} step={10} value={minPoints} disabled={!showImage} theme={theme}
                        onChange={value => onSliderChange("minPoints", value)} />
                    <p style={{fontFamily: 'Roboto, Helvetica, Arial, sans-serif', fontSize: '11px'}}>Image scale:</p>
                    <Slider min={0.001} max={5} value={imageScale} disabled={!showImage} theme={theme} 
                        onChange={v => onImageScaleChange("imageScale", v)}
                    />
                    {/* <Slider pinned min={5} max={40} step={5} value={minImageSize} disabled={!showImage} theme={theme}
                        onChange={value => onSliderChange("minImageSize", value)} /> */}
                </div>
                <div className={theme.tabDiv}>
                    <Autocomplete 
                        direction="down"
                        selectedPosition="none"
                        label={`Select image color scheme`}
                        hint="Select color scheme..."
                        multiple={false}
                        source={[...colorInterpolators, 'Custom']}
                        value={this.props.imgColorScheme}
                        showSuggestionsWhenValueIsSet
                        onChange={(value) => this.props.onImgColorSchemeChange(value)}
                        suggestionMatch="anywhere"
                        theme={theme}					
                        //disabled={!zColorScheme.active}
                    />		
                    <ColorAxis 
                        minDomain={this.props.imgMinDomain}
                        maxDomain={this.props.imgMaxDomain}
                        colorBarDomain={this.props.imgDomain || [0, 1]}
                        colorOpaticy={1}
                        reverse={false}
                        interpolator={this.props.imgColorInterpolator}
                        postProcessor={this.props.postProcessor}
                        onColorDomainChange={this.props.onImageDomainChange}
                    />                    	                
                </div>
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        showImage: state.data.showImage,
        minPoints: state.data.minPoints,
        minImageSize: state.data.minImageSize,
        imgMinDomain: state.data.imgMinDomain,
        imgMaxDomain: state.data.imgMaxDomain,
        imgDomain: state.data.imgDomain,
        imgColorScheme: state.data.imgColorScheme,
        imgColorInterpolator: getImageColorInterpolator(state),

        imageScale: state.env.imageScale,

        postProcessor: state.data.getOrigImgValue,
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        onSwitchChange: setValue,
        onSliderChange: setValue,
        onImgColorSchemeChange: changeImgColorScheme,
        onImageDomainChange: changeImgDomain,
        onImageScaleChange: setEnvValue,
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ImageTab);