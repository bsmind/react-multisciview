import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import { ColorAxis } from "react-multiview/lib/axes";
import { Button } from "react-toolbox/lib/button";
import Autocomplete from "react-toolbox/lib/autocomplete";
import Slider from "react-toolbox/lib/slider";
import theme from "./index.css";

import { sortAlphaNum, colorInterpolators, getColorInterpolator } from "../../utils";

import {
	coordtab_get_dataattr,
	getScatterColorScheme,
} from "../../selectors";

import {
	changeDataAttr,
	changeScatterColorScheme,
	changeScatterColorDomain,
} from "../../actions/dataActions";

class CoordTab extends React.Component {

    renderAttrSelector = (axis) => {
    	const { attr, dataAttr, handleAttrChange } = this.props;
    	return <Autocomplete
    		direction="down"
    		selectedPosition="none"
    		label={`Select ${axis}-axis`}
    		hint="Select one..."
    		multiple={false}
    		source={dataAttr}
    		value={attr[axis]}
    		showSuggestionsWhenValueIsSet
    		onChange={d => handleAttrChange(axis, dataAttr[d])}
			suggestionMatch="anywhere"
			theme={theme}
    	/>;
	}    

    render() {
		const { zColorScheme, onColorDomainChange, onColorSchemeChange } = this.props;
        return (
            <div tabIndex={-1}>
                <div className={theme.tabDiv}>
                    {this.renderAttrSelector("x")}
                    {this.renderAttrSelector("y")}
                </div>
                <div className={theme.tabDiv}>
					{this.renderAttrSelector("z")}
					<Autocomplete 
						direction="down"
						selectedPosition="none"
						label={`Select z-axis color scheme`}
						hint="Select color scheme..."
						multiple={false}
						source={colorInterpolators}
						value={ zColorScheme.type }
						showSuggestionsWhenValueIsSet
						onChange={onColorSchemeChange}
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
						onColorDomainChange={onColorDomainChange}
					/>					
                </div>
            </div>
        );
    }
}

function mapStateToProps(state) {
	const {dataAttr, attr} = coordtab_get_dataattr(state);
    return {
		dataAttr,
		attr,
		zColorScheme: getScatterColorScheme(state),
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
		handleAttrChange: changeDataAttr,
		onColorSchemeChange: changeScatterColorScheme,
		onColorDomainChange: changeScatterColorDomain,
    }, dispatch);
}


export default connect(mapStateToProps, mapDispatchToProps)(CoordTab);