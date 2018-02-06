import React from "react";
import PropTypes from "prop-types";

import Autocomplete from "react-toolbox/lib/autocomplete";
import { List, ListItem, ListSubHeader } from "react-toolbox/lib/list";
import Button from "react-toolbox/lib/button";

import { sortAlphaNum } from "../../utils";
import { hexToRGBA } from "react-multiview/lib/utils"; // eslint-disable-line
import theme from "./index.css";

function DataListItem(props) {
	const { id, name, color, onColorChange, onItemDelete } = props;
	const leftBtnStyle = { minWidth: "10px", maxHeight: "10px", backgroundColor: color ? color : "#000000" };
	const rightBtnStyle = { minWidth: "10px" };
	return <ListItem theme={theme}
		caption={name}
		leftActions={[<Button key={`btn-l-${id}`} raised style={leftBtnStyle} onClick={() => onColorChange([name])}/>]}
		rightActions={[<Button key={`btn-r-${id}`} icon="delete" style={rightBtnStyle} onClick={() => onItemDelete([id])} />]}
	/>;
}

class DataTab extends React.Component {
	constructor() {
		super();
		this.query = null;
	}

    handleQueryChange = (queryString) => {
    	this.query = queryString;
    }

    source = () => {
    	const { samples } = this.props;
    	return new Map(Object.keys(samples).map(key => [`${key}`, samples[key]]));
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
    	const prev = this.props.sampleSelected.slice();

    	const samplesToAdd = keyArray.map(key => {
    		const value = this.props.samples[key];
    		if (value && prev.indexOf(key) === -1)
    			return key;
    	}).filter(d => d != null);

    	if (this.props.onSampleAdd && samplesToAdd.length) {
    		this.props.onSampleAdd(samplesToAdd);
    	}
    }

    handleChange = (selectedItemKeys, event) => {
    	const targetID = event.target.id;
    	const enterKey = event.which != null && event.which === 13;
    	if (targetID != null && targetID.length) {
    		this.addSamples([targetID]);
    	} else if (enterKey) {
    		this.addSamples(this.getQueriedList());
    	}
    	this.query = null;
    }

    renderListItems = () => {
    	const {
    		sampleSelected: keys,
    		sampleColors: colors,
    		sampleColorOpacity: opacity,
    		onColorChange,
    		onSampleDel
    	} = this.props;
    	const list = keys.map(key => {
    		return {
    			key,
    			value: this.props.samples[key]
    		};
    	}).sort( (a, b) => sortAlphaNum(a.value, b.value));

    	return list.map(d => {
    		const { key, value } = d;
    		return <DataListItem key={`item-${value}`}
    			id={key}
    			name={value}
    			color={ hexToRGBA(colors[value], opacity) }
    			onColorChange={onColorChange}
    			onItemDelete={onSampleDel}
    		/>;
    	});
    }

    addAll = () => {
    	const all = Object.keys(this.props.samples);
    	if (this.props.onSampleAdd && all.length)
    		this.props.onSampleAdd(all);
    }

    delAll = () => {
    	if (this.props.onSampleDel && this.props.sampleSelected.length)
    		this.props.onSampleDel(this.props.sampleSelected);
    }

    renderTwoButtons = () => {
    	return (
    		<table>
    			<tbody>
    				<tr>
    					<th>
    						<Button icon="select_all" label="ADD ALL" flat primary
    							onClick={this.addAll}
    						/>
    					</th>
    					<th>
    						<Button icon="clear" label="DEL ALL" flat primary
    							onClick={this.delAll}
    						/>
    					</th>
    				</tr>
    			</tbody>
    		</table>
    	);
    }

    render() {
    	const ListHeight = this.props.height - 180;
    	return (
    		<div style={{borderRadius: '10px', border: '1px dotted #707070', padding: '0px 5px 0px 5px', marginBottom: '5px'}}>
    			{this.renderTwoButtons()}
    			<Autocomplete
    				direction="down"
    				selectedPosition="none"
    				label="Choose samples"
    				source={this.props.samples}
    				value={this.props.sampleSelected}
    				suggestionMatch="anywhere"
    				onQueryChange={this.handleQueryChange}
    				onChange={this.handleChange}
    				theme={theme}
    			/>
    			<List selectable>
    				<ListSubHeader caption={"Selected"} />
    				<div style={{ height: `${ListHeight}px`, overflowY: "scroll" }}>
    					{this.renderListItems()}
    				</div>
    			</List>
    		</div>
    	);
    }
}

DataTab.propTypes = {
	samples: PropTypes.object.isRequired,
	sampleColors: PropTypes.object.isRequired,
	sampleSelected: PropTypes.array,
	sampleColorOpacity: PropTypes.number,
	onSampleAdd: PropTypes.func.isRequired,
	onSampleDel: PropTypes.func.isRequired,
	onColorChange: PropTypes.func.isRequired,
	height: PropTypes.number
};

DataTab.defaultProps = {
	sampleSelected: [],
	sampleColorOpacity: 0.5
};

DataListItem.propTypes = {
	id: PropTypes.any,
	name: PropTypes.string,
	color: PropTypes.string,
	onColorChange: PropTypes.func,
	onItemDelete: PropTypes.func,
};

export default DataTab;