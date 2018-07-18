import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import Autocomplete from "react-toolbox/lib/autocomplete";
import Button from "react-toolbox/lib/button";
import Chip from "react-toolbox/lib/chip";
import { List, ListItem, ListSubHeader } from "react-toolbox/lib/list";
import theme from "./index.css";

import { sortAlphaNum } from "../../utils";
import { hexToRGBA } from "react-multiview/lib/utils";

import {
    datatab_get_sample_status
} from "../../selectors";

import {
    get_data,
    del_data,
    changeSelectedSampleColors
} from "../../actions/dataActions";

const DataListItem = (props) => {
	const { id, name, color, onColorChange, onItemDelete, count } = props;
    const leftBtnStyle = { 
        minWidth: "10px", maxHeight: "10px", 
        backgroundColor: color ? color : "#000000" 
    };
	const rightBtnStyle = { minWidth: "10px" };
	return <ListItem theme={theme}
		caption={name}
        leftActions={[
            <Button key={`btn-l-${id}`} raised style={leftBtnStyle} 
                    onClick={() => onColorChange([name])}/>
        ]}
		rightActions={[
            <b>{count}</b>,                           
            <Button key={`btn-r-${id}`} icon="delete" style={rightBtnStyle} 
                onClick={() => onItemDelete([name])} />,
        ]}
	/>;
}


class DataTab extends React.Component {
    constructor() {
        super();
        this.query = null;
    }

    source = () => {
    	const { sampleKinds } = this.props;
    	return new Map(Object.keys(sampleKinds).map(key => [`${key}`, sampleKinds[key]]));
    }

    getQueriedList = () => {
    	if (this.query == null || this.query.length === 0) {
    		return [];
    	}

    	const src = this.source();
    	const query = this.query.toUpperCase().trim();
    	const list = {};
    	for (const [key, value] of src) {
    		if (value.toUpperCase().trim().includes(query))
    			list[key] = value; // eslint-disable-line
    	}

    	return Object.keys(list);
    }

    addSamples = (keyArray) => {
        const { sampleKinds, sampleSelected } = this.props;

    	const samplesToAdd = keyArray.map(key => {
    		const value = sampleKinds[key];
    		if (value && sampleSelected.indexOf(key) === -1) {
                return key;
            }
    	}).filter(d => d != null);

        const samplesToAddByName = samplesToAdd.map(key => {
            let name = sampleKinds[key];
            name = name.split(":")[1];
            return name.trim();
        })

    	if (this.props.onSampleAdd && samplesToAddByName.length) {
    		this.props.onSampleAdd(samplesToAddByName);
    	}
    }

    handleChange = (selectedItemKeys, event) => {
        //console.log(selectedItemKeys)
    	const targetID = event.target.id;
    	const enterKey = event.which != null && event.which === 13;
    	if (targetID != null && targetID.length) {
    		this.addSamples([targetID]);
    	} else if (enterKey) {
    		this.addSamples(this.getQueriedList());
    	}
    	this.query = null;        
    }

    renderSelectedSamples = () => {
    	const {
            sampleKinds,
    		sampleSelected: keys,
    		sampleColors: colors,
    		onColorChange,
    		onSampleDel
        } = this.props;
        const opacity = 0.5

    	const list = keys.map(key => {
            const value = sampleKinds[key];
            const tokens = value.split(":");
            const count_str = tokens[0].slice(1, tokens[0].length-1).trim();
            const name = (tokens[1]).trim();
    		return {
    			key,
                value: name,
                count: parseInt(count_str)
    		};
    	}).sort( (a, b) => sortAlphaNum(a.value, b.value));

        return list.map(d => {
    		const { key, value, count } = d;
    		return <DataListItem key={`item-${value}`}
    			id={key}
    			name={value}
                color={ hexToRGBA(colors[value], opacity) }
                count={count}
    			onColorChange={onColorChange}
    			onItemDelete={onSampleDel}
    		/>;
    	});
    }

    handleAddAll = () => {
        const keys = Object.keys(this.props.sampleKinds);
        this.addSamples(keys);
    }

    handleDelAll = () => {
        const {sampleKinds, sampleSelected} = this.props;
        const samplesToDelByName = sampleSelected.map(key => {
            let name = sampleKinds[key];
            name = name.split(":")[1];
            return name.trim();
        });
        if (samplesToDelByName.length && this.props.onSampleDel)
            this.props.onSampleDel(samplesToDelByName);
    }

    renderButtonOptions = () => {
        return (
            <table>
                <tbody>
                    <tr>
                        <th> <Button icon="select_all" label="ADD ALL" flat primary onClick={this.handleAddAll} /> </th>
                        <th> <Button icon="clear" label="DEL ALL" flat primary onClick={this.handleDelAll} /> </th>
                    </tr>
                </tbody>
            </table>
        );
    }

    renderDBOptions = () => {

    }

    renderWatcherOptions = () => {

    }
    
    render() {
        const { sampleKinds, sampleSelected, height } = this.props;
        const ListHeight = height - 180;

        return (
            <div className={theme.tabDiv}>
                {this.renderButtonOptions()}
                <Autocomplete 
                    direction="down"
                    selectedPosition="none"
                    label="Select samples"
                    suggestionMatch="anywhere"
                    source={sampleKinds}
                    value={sampleSelected}
                    onQueryChange={q => this.query = q}
                    onChange={this.handleChange}
                    theme={theme}
                />
                <List selectable>
                    <ListSubHeader caption={"Selected"} />
                    <div style={{ height: `${ListHeight}px`, overflowY: "scroll" }}>
                        {this.renderSelectedSamples()}
                    </div>                    
                </List>
            </div>
        )
    }
}

function mapStateToProps(state) {
    const {sampleKinds, sampleSelectedByIndex} = datatab_get_sample_status(state);

    return {
        sampleKinds,
        sampleSelected: sampleSelectedByIndex,
        sampleColors: state.data.sampleColors,
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        onSampleAdd: get_data,
        onSampleDel: del_data,
        onColorChange: changeSelectedSampleColors,
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DataTab);