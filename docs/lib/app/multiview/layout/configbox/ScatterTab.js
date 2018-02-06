import React from "react";
import PropTypes from "prop-types";

import { ColorAxis } from 'react-multiview/lib/axes';

import Autocomplete from "react-toolbox/lib/autocomplete";
import { Button } from "react-toolbox/lib/button";
import Slider from "react-toolbox/lib/slider";
import { sortAlphaNum, colorInterpolators, getColorInterpolator } from '../../utils';

import theme from "./index.css";


class ScatterTab extends React.Component {
    renderAttrSelector = (axis, attrKinds) => {
    	const { attrFormat, onAttrChange } = this.props;

    	return <Autocomplete
    		direction="down"
    		selectedPosition="none"
    		label={`Select ${axis}-axis`}
    		hint="Choose one..."
    		multiple={false}
    		source={attrKinds}
    		value={ attrFormat(this.props.attr[axis]) }
    		showSuggestionsWhenValueIsSet
    		onChange={(value) => onAttrChange(axis, value)}
			suggestionMatch="anywhere"
			theme={theme}
    	/>;
	}
	
	handleColorDomainChange = (newDomain) => {
		const { attr } = this.props;
		//console.log(attr.z, newDomain)
		if (this.props.onColorDomainChange)
			this.props.onColorDomainChange(attr['z'], newDomain);
	}

    render() {
    	const {
			attrKinds: attrKindsProp,
			attrFormat,
			zColorScheme,
    		showImage,
    		minPoints,
    		minImageSize,
    		onSwitchChange,
			onSliderChange,
			onColorSchemeChange,
			width
		} = this.props;

		const attrz = this.props.attr['z'];
		//console.log(zColorScheme)

    	const attrKinds = Object.keys(attrKindsProp).map(attrKey => {
    		return attrFormat(attrKindsProp[attrKey]);
    	}).sort(sortAlphaNum);

    	return (<div tabIndex={-1}>
			<div  style={{borderRadius: '10px', border: '1px dotted #707070', padding: '0px 5px 0px 5px', marginBottom: '5px'}}>
				{this.renderAttrSelector("x", attrKinds)}
				{this.renderAttrSelector("y", attrKinds)}
			</div>

			<div style={{borderRadius: '10px', border: '1px dotted #707070', padding: '0px 5px 0px 5px', marginBottom: '5px'}}>
				{this.renderAttrSelector("z", attrKinds)}
				<Autocomplete 
					direction="down"
					selectedPosition="none"
					label={`Select z-axis color scheme`}
					hint="Choose color scheme..."
					multiple={false}
					source={colorInterpolators}
					value={ zColorScheme.type }
					showSuggestionsWhenValueIsSet
					onChange={(value) => onColorSchemeChange(attrz, value)}
					suggestionMatch="anywhere"
					theme={theme}					
					disabled={!zColorScheme.active}
				/>
				<ColorAxis 
					//width={width - 10}
					minDomain={zColorScheme.minDomain}
					maxDomain={zColorScheme.maxDomain}
					colorBarDomain={zColorScheme.colorDomain}
					colorOpacity={zColorScheme.opacity}
					reverse={zColorScheme.reverse}
					interpolator={getColorInterpolator(zColorScheme.type)}
					onColorDomainChange={this.handleColorDomainChange}
				/>
			</div>
    	</div>);
    }
}

ScatterTab.propTypes = {
	attrFormat: PropTypes.func,
	onAttrChange: PropTypes.func,
	attr: PropTypes.shape({
		x: PropTypes.string,
		y: PropTypes.string,
		z: PropTypes.string
	}),
	attrKinds: PropTypes.array,
	showImage: PropTypes.bool,
	minPoints: PropTypes.number,
	minImageSize: PropTypes.number,
	onSwitchChange: PropTypes.func,
	onSliderChange: PropTypes.func,
};


export default ScatterTab;