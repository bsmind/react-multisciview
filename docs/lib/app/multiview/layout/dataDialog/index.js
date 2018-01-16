import React from 'react';
import PropTypes from 'prop-types';

import Dialog from 'react-toolbox/lib/dialog';
import Autocomplete from 'react-toolbox/lib/autocomplete';
import { List, ListItem, ListSubHeader } from 'react-toolbox/lib/list';
import Button from 'react-toolbox/lib/button';

import { sortAlphaNum } from '../../utils';
import { hexToRGBA } from 'react-multiview/lib/utils';


import { getRandomColor } from '../../reducers/dataHelper/getSampleKinds';

import theme from './index.css'

class DataListItem extends React.Component {
    render() {
        const  { id, name, color, onColorChange, onItemDelete } = this.props;

        return (
            <ListItem 
                theme={theme}
                caption={name}
                leftActions={[
                    <Button 
                        raised
                        style={{
                            minWidth: '10px',
                            maxHeight: '10px',
                            backgroundColor: color ? color : 'black'
                        }}
                        onClick={() => onColorChange(name)}
                    />
                ]}
                rightActions={[
                    <Button 
                        icon='delete'
                        style={{
                            minWidth: '10px'
                        }}
                        onClick={() => onItemDelete(id)}
                    />
                ]}
            />
        );
    }
}

class DataList extends React.Component {
    constructor(props) {
        super(props);

        this.state={
            selectedItems: props.selected,
            selectedItemColors: props.colors,
            opacity: props.opacity
        }
        this.query = null;
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            selectedItems: nextProps.selected,
            selectedItemColors: nextProps.colors,
            opacity: nextProps.opacity
        });
    }

    source = () => {
        const { items } = this.props;
        return new Map(Object.keys(items).map(key => [`${key}`, items[key]]));
    }

    getQueriedList = () => {
        if (this.query == null || this.query.length === 0) {
            return {...this.props.items};
        }

        const src = this.source();
        const query = this.query.toUpperCase().trim();
        const list = {};
        for (const [key, value] of src) {
            if (value.toUpperCase().trim().includes(query))
                list[key] = value;
        }

        return list;
    }

    addItems = (keyArray) => {
        const prev = this.state.selectedItems.slice();
        keyArray.forEach(key => {
            const value = this.props.items[key];
            if (value != null && prev.indexOf(key) === -1)
                prev.push(key);
        });

        if (this.props.onSampleChange)
            this.props.onSampleChange(prev);
        this.setState({ selectedItems: prev });
    }    

    handleChange = (selectedItemKeys, event) => {
        const targetID = event.target.id;
        const enterKey = event.which != undefined && event.which === 13;
        if (targetID != null && targetID.length) {
            this.addItems([targetID]);
        } else if (enterKey) {
            const filteredSrc = this.getQueriedList();
            this.addItems(Object.keys(filteredSrc));
        } 
        this.query = null;
    }

    handleQueryChange = (queryString) => {
        this.query = queryString;
    }

    handleItemDelete = (key) => {
        let selectedItems = this.state.selectedItems.slice();
        const index = selectedItems.indexOf(key);
        
        if (index > -1) {
            selectedItems.splice(index, 1)
            if (this.props.onSampleChange) 
                this.props.onSampleChange(selectedItems);
            this.setState({
                selectedItems
            });
        }
    }

    handleColorChange = (itemName) => {
        const colors = {...this.state.selectedItemColors};
        const prev = colors[itemName];
        let newColor;
        do {
            newColor = getRandomColor();
        } while (newColor === prev);

        colors[itemName] = newColor;
        this.setState({
            selectedItemColors: colors
        });

        if (this.props.onColorChange)
            this.props.onColorChange(colors);
    }

    renderListItems = () => {
        const { 
            selectedItems: itemKeys, 
            selectedItemColors: colors,
            opacity 
        } = this.state;
        //const { onColorChange } = this.props;
        const itemList = itemKeys.map(key => {
            return {
                key,
                value: this.props.items[key]
            }
        }).sort((a,b) => sortAlphaNum(a.value, b.value));

        // const itemValues = itemKeys.map(key => this.props.items[key])
        //                             .sort(sortAlphaNum);

        return itemList.map(d => {
            const {key, value} = d;
            return <DataListItem key={`item-${value}`}
                id={key}
                name={value}
                color={ hexToRGBA(colors[value], opacity) }
                onColorChange={this.handleColorChange}
                onItemDelete={this.handleItemDelete}
            />
        });
    }

    addAll = () => {
        const selected = Object.keys(this.props.items);
        if (this.props.onSampleChange)
            this.props.onSampleChange(selected);
        this.setState({
            selectedItems: selected
        });
    }

    delAll = () => {
        if (this.props.onSampleChange)
            this.props.onSampleChange([]);
        this.setState({
            selectedItems: []
        });
    }

    renderTwoButtons = () => {
        return (
            <table>
                <tbody>
                    <tr>
                        <th>
                            <Button icon='select_all' label='ADD ALL' flat primary 
                                onClick={this.addAll}
                            />
                        </th>
                        <th>
                            <Button icon='clear' label='DEL ALL' flat primary 
                                onClick={this.delAll}
                            />
                        </th>
                    </tr>
                </tbody>
            </table>
        );
    }

    render() {
        return (
            <div>
                {this.renderTwoButtons()}
                <Autocomplete
                    direction='down'
                    selectedPosition='none'
                    label='Choose samples'
                    source={this.props.items}
                    value={this.state.selectedItems}
                    suggestionMatch='anywhere'
                    onQueryChange={this.handleQueryChange}
                    onBlur={this.handleBlur}
                    onChange={this.handleChange}
                    theme={theme}
                />
                <List selectable>
                    <ListSubHeader caption={this.props.title} />
                    {this.renderListItems()}
                </List>
            </div>
        );
    }
}

class DataDialog extends React.Component {
    constructor() {
        super();
        this.selected = [];
        this.colors = {};
    }

    componentDidMount(){
        this.updateSeleted();
        this.updateColors();
    }

    componentWillReceiveProps(nextProps) {
        this.updateSeleted(nextProps);
        this.updateColors(nextProps);
    }

    updateSeleted = (props = this.props) => {
        this.selected = props.sampleSelected.slice();
    }

    updateColors = (props = this.props) => {
        this.colors = {...props.sampleColors};
    }

    handleSampleChange = (selected) => {
        this.selected = selected.slice();
    }

    handleColorChange = (colors) => {
        this.colors = {...colors};
    }

    handleUpdateChange = () => {
        let colorChanged = false;
        const colorKeys = Object.keys(this.colors).forEach(key => {
            if (this.colors[key] !== this.props.sampleColors[key])
                colorChanged = true;
        });

        let sampleChanged = this.selected.length !== this.props.sampleSelected.length;
        if (!sampleChanged) {
            const sortedNew = this.selected.sort(sortAlphaNum);
            const sortedOld = this.props.sampleSelected.sort(sortAlphaNum);
            sampleChanged = !sortedNew.every((key, index) => key === sortedOld[index]);
        }

        this.props.onSampleUpdate(
            colorChanged || sampleChanged,
            this.selected,
            this.colors
        );
    }

    render () {
        const actions = [
            { 
                label: "Cancel", 
                onClick: () => this.props.onSampleUpdate(false)
            },
            { 
                label: "Save", 
                onClick: this.handleUpdateChange
            }
        ];

        return(
            <Dialog
                actions={actions}
                active={this.props.active}
                onEscKeyDown={this.props.onToggleDataDialog}
                onOverlayClick={this.props.onToggleDataDialog}
                title={this.props.title}
            >
                    <div style={{
                        height: '300px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        overflowY: 'scroll',
                        //border: 'solid black 1px',
                        //borderRadius: '5px'
                    }}
                    >
                        <DataList 
                            title='Selected samples'
                            items={this.props.samples}
                            selected={this.props.sampleSelected}
                            colors={this.props.sampleColors}
                            opacity={this.props.sampleColorOpacity}
                            onColorChange={this.handleColorChange}
                            onSampleChange={this.handleSampleChange}
                        />
                    </div>
            </Dialog>
        );
    }
}

export default DataDialog;