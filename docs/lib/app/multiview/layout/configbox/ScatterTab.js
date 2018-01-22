import React from 'react';
import PropTypes from 'prop-types';

import Autocomplete from 'react-toolbox/lib/autocomplete';
import {Button} from 'react-toolbox/lib/button';
import sortAlphaNum from '../../utils/sortAlphaNum';



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
            attrFormat
        } = this.props;

        const attrKinds = Object.keys(attrKindsProp).map(attrKey => {
            return attrFormat(attrKindsProp[attrKey]);
        }).sort(sortAlphaNum);

        return (<div tabIndex={-1}>
            {this.renderAttrSelector('x', attrKinds)}
            {this.renderAttrSelector('y', attrKinds)}
            {this.renderAttrSelector('z', attrKinds)}
            <Button icon='photo' label="Show Image" accent={this.props.showImage}
                onClick={() => this.props.onSwitchChange('showImage', !this.props.showImage)} />
        </div>);
    }
}

ScatterTab.propTypes = {

};

ScatterTab.defaultProps = {

};

export default ScatterTab;