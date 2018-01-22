import React from 'react';
import PropTypes from 'prop-types';

import Autocomplete from 'react-toolbox/lib/autocomplete';
import Button from 'react-toolbox/lib/button';

import theme from './index.css';

import get from 'lodash.get';

import { sortAlphaNum } from '../../utils';


class ToolBox extends React.Component {
    onAttrChange = (dim, value) => {
        if (this.props.onAttrChange)
            this.props.onAttrChange(dim, value);
    }

    renderAttrSelectors = () => {
        const numSelectors = 3;
        const labels = [
            'Select x-axis',
            'Select y-axis',
            'Select z-axis'
        ];
        
        const axisKinds = ['x', 'y', 'z'];
        const selectors = [];

        for (let i=0; i<numSelectors; ++i) {
            selectors.push(
                <div key={`selector-${i}`} className={theme.dropdownbox}>
                    <Autocomplete 
                        direction="down"
                        selectedPosition='none'
                        label={labels[i]} 
                        hint="Choose one..."
                        multiple={false}                           
                        source={this.props.attrKinds}
                        value={get(this.props.attr, axisKinds[i])}
                        showSuggestionsWhenValueIsSet
                        onChange={this.onAttrChange.bind(this, axisKinds[i])}
                        theme={theme}
                        suggestionMatch='anywhere'
                    />                    
                </div>
            );
        }

        return selectors;
    }

    renderAttrSelector = (axis, attrKinds) => {
        const {attrFormat} = this.props;

        return (
            <Autocomplete 
                direction="down"
                selectedPosition='none'
                label={`Select ${axis}-axis`} 
                hint="Choose one..."
                multiple={false}                           
                source={attrKinds}
                value={ attrFormat(get(this.props.attr, axis)) }
                showSuggestionsWhenValueIsSet
                onChange={this.onAttrChange.bind(this, axis)}
                theme={theme}
                suggestionMatch='anywhere'
            />
        );
    }

    render () {
        const { 
            attrKinds: attrKindsProp, 
            //attr: attrProp,
            attrFormat 
        } = this.props;

        const attrKinds = Object.keys(attrKindsProp).map(attrKey => {
            return attrFormat(attrKindsProp[attrKey]);
        }).sort(sortAlphaNum);


        return (
            <div className={this.props.className}>
                <table style={{
                    width: '100%'
                }}>
                    <tbody>
                        <tr>
                            <td style={{width: '20px'}}>
                                <Button label='DATA DIALOG' onClick={this.props.onToggleDataDialog} />   
                            </td>
                            <td>
                                {this.renderAttrSelector('x', attrKinds)}
                            </td>
                            <td>
                                {this.renderAttrSelector('y', attrKinds)}
                            </td>
                            <td>
                                {this.renderAttrSelector('z', attrKinds)}
                            </td>
                        </tr>
                    </tbody>
                </table>
                    
            </div>
        );
    }
}

export default ToolBox;