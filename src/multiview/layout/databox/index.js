import React from 'react';
import PropTypes from 'prop-types';

import Autocomplete from 'react-toolbox/lib/autocomplete';
import { List, ListItem, ListSubHeader } from 'react-toolbox/lib/list';
import Button from 'react-toolbox/lib/button';

import theme from './index.css';

import keys from 'lodash.keys';
import forEach from 'lodash.foreach';

import sortAlphaNum from '../../utils/sortAlphaNum';

class DataBox extends React.Component {
    handleBlur = (event, active) => {
        if (this.query && this.query.length) {
            
            const queryString = this.query.toUpperCase().trim();
            const allKeys = [];

            forEach(this.props.sampleKinds, (value, key) => {
                const val = value.toUpperCase().trim();
                if (val.includes(queryString) && 
                    this.props.samples.indexOf(key) === -1) 
                {
                    allKeys.push(key);
                }
            });

            Object.assign(this, {query: null});            
            this.handleSampleChange('ADD', allKeys);
        } else if (active && active.length) {
            this.handleSampleChange('ADD', [active]);
        }
    }

    handleQueryChange = (queryString) => {
        Object.assign(this, {query: queryString})
    }

    handleSampleChange = (action, sampleKeys) => {
        if (sampleKeys.length === 0) return;
        if (this.props.onSampleChange)
            this.props.onSampleChange(action, sampleKeys);
    }

    handleColorChange = (sampleKey) => {
        if (this.props.onColorChange)
            this.props.onColorChange(sampleKey);
    }

    renderSampleList = () => {
        if (this.props.samples.length === 0) return;

        const keys = this.props.samples.slice().sort(sortAlphaNum);
        const items = [];

        keys.forEach( (key, index) => {
            const clr = this.props.colors[key],
                  leftBtnStyle = {minWidth: '10px', maxHeight: '10px', backgroundColor: clr},
                  rightBtnStyle = {minWidth: '10px'};

            let sampleName = this.props.sampleKinds[key];
            items.push(
                <ListItem key={key} theme={theme} caption={sampleName}
                    leftActions={[
                        <Button key={`item-clr-${key}`} raised style={leftBtnStyle}
                            onClick={this.handleColorChange.bind(this, key)}
                        />
                    ]}
                    rightActions={[
                        <Button key={`item-del-${key}`} icon='delete' style={rightBtnStyle}
                            onClick={this.handleSampleChange.bind(this, 'DEL', [key])}
                        />
                    ]}
                />
            );
        });

        return items;
    }
        
    render() {
        return (
            <div className={this.props.className}>
                <div style={{height: '5%'}}>
                    <table>
                        <tbody>
                            <tr>
                                <th> 
                                    <Button icon='select_all' label='ADD ALL' flat primary 
                                        onMouseUp={this.handleSampleChange.bind(this, 'ADD', keys(this.props.sampleKinds))}
                                    />
                                </th>
                                <th>
                                    <Button icon='clear' label='DEL ALL' flat primary 
                                        onMouseUp={this.handleSampleChange.bind(this, 'DEL', this.props.samples)}
                                    />
                                </th>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style={{height: '6%'}}>
                    <Autocomplete 
                        direction='down'
                        selectedPosition='none'
                        label='Choose samples'
                        source={this.props.sampleKinds}
                        value={this.props.samples}
                        onBlur={this.handleBlur}
                        theme={theme}
                        suggestionMatch='anywhere'
                        onQueryChange={this.handleQueryChange}
                    />
                </div>

                <div style={{overflowY: 'scroll', height: '60%'}}>
                    <List selectable>
                        <ListSubHeader caption='Selected samples' />
                        {this.renderSampleList()}
                    </List>
                </div>

                <div style={{height: '29%', padding: '2px 5px 2px 5px'}}>
                    reserved to show sample information
                </div>
            </div>
        );
    }
};

DataBox.propTypes = {
    className: PropTypes.string,
};
DataBox.defaultProps = {
    className: '',
};

export default DataBox;