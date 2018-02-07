import React from 'react';
import PropTypes from 'prop-types';

import { ColorAxis } from 'react-multiview/lib/axes';

import Autocomplete from "react-toolbox/lib/autocomplete";
import { Button } from "react-toolbox/lib/button";
import Slider from "react-toolbox/lib/slider";
import { getColorInterpolator, colorInterpolators } from '../../utils';

import theme from './index.css';

class ImageTab extends React.Component {
    render() {
		const { 
			showImage, minPoints, minImageSize,
			onSwitchChange, onSliderChange 
		} = this.props;
		
        return (<div>
    		<div style={{borderRadius: '10px', border: '1px dotted #707070', padding: '0px 5px 0px 5px', marginBottom: '5px'}}>
				<Button icon="photo" label="Show Image" accent={showImage}
					onClick={() => onSwitchChange("showImage", !showImage)} />				
    			<p style={{fontFamily: 'Roboto, Helvetica, Arial, sans-serif', fontSize: '8px'}}>MIN. # POINTS (on scatter plot to show images):</p>
    			<Slider pinned min={20} max={400} step={10} value={minPoints} disabled={!showImage} theme={theme}
    				onChange={value => onSliderChange("minPoints", value)} />
    			<p style={{fontFamily: 'Roboto, Helvetica, Arial, sans-serif', fontSize: '8px'}}>MIN. IMAGE SIDE (initial):</p>
    			<Slider pinned min={5} max={40} step={5} value={minImageSize} disabled={!showImage} theme={theme}
    				onChange={value => onSliderChange("minImageSize", value)} />
    		</div>
    		<div style={{borderRadius: '10px', border: '1px dotted #707070', padding: '0px 5px 0px 5px', marginBottom: '5px'}}>
				<Autocomplete 
					direction="down"
					selectedPosition="none"
					label={`Select image color scheme`}
					hint="Choose color scheme..."
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
					colorBarDomain={this.props.imgDomain}
					colorOpaticy={1}
					reverse={false}
					interpolator={this.props.imgColorInterpolator}
					postProcessor={this.props.postProcessor}
					onColorDomainChange={this.props.onImageDomainChange}
				/>
			</div>			
        </div>);
    }
}

export default ImageTab;