import React from 'react';
import PropTypes from 'prop-types';

import Autocomplete from 'react-toolbox/lib/autocomplete';
import {Button} from 'react-toolbox/lib/button';
import Slider from 'react-toolbox/lib/slider';
import sortAlphaNum from '../../utils/sortAlphaNum';

import theme from './index.css';

class ScatterTab extends React.Component {
    renderAttrSelector = (axis, attrKinds) => {
        const { attrFormat, onAttrChange } = this.props;

        return <Autocomplete
            direction="down"
            selectedPosition='none'
            label={`Select ${axis}-axis`} 
            hint="Choose one..."
            multiple={false}                           
            source={attrKinds}
            value={ attrFormat(this.props.attr[axis]) }
            showSuggestionsWhenValueIsSet
            onChange={(value) => onAttrChange(axis, value)}
            suggestionMatch='anywhere'     
        />;
    }

    render() {
        const {
            attrKinds: attrKindsProp,
            attrFormat,
            showImage,
            minPoints,
            minImageSize,
            onSwitchChange,
            onSliderChange
        } = this.props;

        const attrKinds = Object.keys(attrKindsProp).map(attrKey => {
            return attrFormat(attrKindsProp[attrKey]);
        }).sort(sortAlphaNum);

        return (<div tabIndex={-1}>
            {this.renderAttrSelector('x', attrKinds)}
            {this.renderAttrSelector('y', attrKinds)}
            {this.renderAttrSelector('z', attrKinds)}
            <Button icon='photo' label="Show Image" accent={showImage}
                onClick={() => onSwitchChange('showImage', !showImage)} />

            <div>
                <p>MIN. # POINTS:</p>
                <Slider pinned min={5} max={100} step={5} value={minPoints} disabled={!showImage} theme={theme}
                    onChange={value => onSliderChange('minPoints', value)} />
                <p>MIN. IMAGE SIDE:</p>
                <Slider pinned min={5} max={40} step={5} value={minImageSize} disabled={!showImage} theme={theme}
                    onChange={value => onSliderChange('minImageSize', value)} />
            </div>

        </div>);
    }
}

ScatterTab.propTypes = {

};

ScatterTab.defaultProps = {

};

export default ScatterTab;