import React from 'react';
import PropTypes from 'prop-types';

import Autocomplete from 'react-toolbox/lib/autocomplete';
import Button from 'react-toolbox/lib/button';

import theme from './index.css';

import get from 'lodash.get';


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

    render () {

        let tools = [
            {primary: true, accent: false},
            {primary: true, accent: false},
            {primary: true, accent: false},
            {primary: true, accent: false}
        ];

        const toolid = (this.props.toolid == null) ? 0: this.props.toolid;
        tools[this.props.toolid] = {primary: false, accent: true}
        
        return (
            <div className={this.props.className}>
                <div style={{height: '25.83px'}}>
                    <table>
                        <tbody>
                            <tr>
                                <th>
                                    <Button icon='grain' label='SCATTER' {...tools[0]} 
                                        onClick={() => this.props.onToolChange(0)}
                                    />
                                </th>
                                <th>
                                    <Button icon='image' label='IMAGE' {...tools[1]} 
                                        onClick={() => this.props.onToolChange(1)}
                                    />
                                </th>
                                <th>
                                    <Button icon='poll' label='PROJECTION' {...tools[2]} 
                                        onClick={() => this.props.onToolChange(2)}
                                    />
                                </th>
                            </tr>
                        </tbody>                    
                    </table>

                </div>
                <div style={{height: '30.99px'}}>
                    {this.renderAttrSelectors()}
                </div>
            </div>
        );
    }
}

export default ToolBox;