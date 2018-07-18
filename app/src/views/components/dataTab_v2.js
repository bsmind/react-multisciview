import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import axios from "axios";

import Autocomplete from "react-toolbox/lib/autocomplete";
import { Button, IconButton } from "react-toolbox/lib/button";
import { List, ListItem, ListSubHeader } from "react-toolbox/lib/list";
import theme from "./index.css"

import { sortAlphaNum } from "../../utils";
import { hexToRGBA } from "react-multiview/lib/utils";

import {
    get_data,
    del_data,
    changeSelectedSampleColors,
    update_db_info,
} from "../../actions/dataActions";

import {
    getSelectedSamples,
    getSelectedSamplesCounts
} from "../../selectors";


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
    constructor(props) {
        super(props);
        this.state = {
            db: props.db,
            col: props.col,

            dbList: [],
            colList: [],
            sampleList: []
        }

        this.q_db = null
        this.q_col = null
        this.q_sample = null
    }

    asyncUpdateDBInfo = (db, col) => {
        axios.get("/api/db", {params: {db,  col}})
            .then(resp => {
                const data = resp.data;
                this.setState({...data});
            })
            .catch(e => {
                console.log(e)
            });
    }

    componentDidMount() {
        const {db, col} = this.state;
        this.asyncUpdateDBInfo(db, col);
    }

    componentWillUnmount() {
        const {db, col} = this.state;
        if (this.props.onUpdateDB)
            this.props.onUpdateDB(db, col);
    }

    handleDBChange = (selectedDB, event) => {
        if (selectedDB == null) selectedDB = "";

        const isEnterKey = event.which != null && event.which === 13;
        const isNewDB = selectedDB.length === 0 && this.q_db != null && this.q_db.length;
        const { dbList } = this.state;

        if (isEnterKey && isNewDB) {
            const newDB = this.q_db.trim().replace(/ /g, "_");
            this.asyncUpdateDBInfo(newDB, null);
        } else if (dbList.indexOf(selectedDB) >= 0) {
            this.asyncUpdateDBInfo(selectedDB, null)
        } else {
            console.log('[handleDBChange] Unexpected cases');
        }

        this.q_db = null;
    }

    handleColChange = (selectedCol, event) => {
        if (selectedCol == null) selectedCol = "";
        const { db, colList } = this.state;
        if (db == null)
            return;

        const isEnterKey = event.which != null && event.which === 13;
        const isNewCol = selectedCol.length === 0 && this.q_col != null && this.q_col.length;

        if (isEnterKey && isNewCol) {
            const newCol = this.q_col.trim().replace(/ /g, "_");
            this.asyncUpdateDBInfo(db, newCol);
        } else if (colList.indexOf(selectedCol) >= 0) {
            this.asyncUpdateDBInfo(db, selectedCol);
        } else {
            console.log("[handleColChange] Unexpected cases");
        }

        this.q_col = null;
    }

    addSamples = (keyArray) => {
        const { sampleList, db, col } = this.state;
        const { sampleSelected } = this.props;

        const samplesToAdd = keyArray.map(key => {
            const {_id, count} = sampleList[key];
            const name = `[${db}][${col}]${_id}`;
            if (sampleSelected.indexOf(name) === -1) 
                return _id;
        }).filter(d => d != null);

        if (samplesToAdd.length && this.props.onSampleAdd) {
            this.props.onSampleAdd(db, col, samplesToAdd);
        }
    }

    handleSampleChange = (_, event) => {
        const targetID = event.target.id;
        const enterKey = event.which != null && event.which === 13;
        const validQuery = this.q_sample != null && this.q_sample.length;
        
        if (targetID != null && targetID.length) {
            this.addSamples([targetID]);
        } else if (enterKey && validQuery) {
            const query = this.q_sample.trim().replace(/ /g, "_").toUpperCase();
            const indices = this.state.sampleList.map( (sample, idx) => {
                const {_id, count} = sample;
                if (_id.trim().toUpperCase().includes(query))
                    return idx
            }).filter(d => d != null);
            this.addSamples(indices);
        } else {
            console.log("[handleSampleChange] Unexpected cases!")
        }

        this.q_sample = null;
    }

    renderDBView = () => {
        const {db, dbList, col, colList} = this.state;
        const divStyle = {
            display: 'inline-block',
            width: '42%',
            marginRight: '10px'    
        }
        return (
            <div className={theme.tabDiv}>
                <div style={divStyle}>
                    <Autocomplete 
                        direction="down"
                        selectedPosition="none"
                        label="Select or Write a DB name"
                        suggestionMatch="anywhere"
                        source={dbList}
                        value={db}
                        multiple={false}
                        showSuggestionsWhenValueIsSet={true}
                        onQueryChange={q => this.q_db = q}
                        onChange={(selected, e) => this.handleDBChange(selected, e)}
                        theme={theme}
                    />
                </div>
                <div style={divStyle}>
                    <Autocomplete 
                        direction="down"
                        selectedPosition="none"
                        label="Select or Write a collection name"
                        suggestionMatch="anywhere"
                        source={colList}
                        value={col}
                        multiple={false}
                        showSuggestionsWhenValueIsSet={true}
                        onQueryChange={q => this.q_col = q}
                        onChange={(selected, e) => this.handleColChange(selected, e)}
                        theme={theme}                
                    />
                </div>
                <div style={{...divStyle, width: '10%', marginRight: '0px'}}>
                    <IconButton icon='refresh' />
                </div>
            </div>
        );
    }

    renderSelectedSamples = () => {
        const { 
            sampleSelected, 
            sampleSelectedCounts,
            sampleColors, 
            onColorChange, 
            onSampleDel 
        } = this.props;
        const opacity = 0.5;
        
        const list = sampleSelected.map((name, idx) => {
            return {
                key: name,
                value: name,
                count: sampleSelectedCounts[idx]
            };
        }).sort( (a, b) => sortAlphaNum(a.value, b.value) );

        return list.map(d => {
            const {key, value, count} = d;
            return <DataListItem 
                key={`item-${value}`} 
                id={key}
                name={value}
                color={ hexToRGBA(sampleColors[value], opacity)}
                count={count}
                onColorChange={onColorChange}
                onItemDelete={onSampleDel}
            />
        });
    }

    renderSampleView = () => {
        const divStyle = {
            display: 'inline-block',
            width: '65%',
            marginRight: '10px'    
        }
        const {db, col, sampleList} = this.state;
        const { height, sampleSelected } = this.props;
        const ListHeight = height - 200;

        const samples = {};
        const local_selected = sampleList.map( (sample, idx) => {
            const {_id, count} = sample;
            samples[idx] = `[${count}] ${_id}`;

            const key = `[${db}][${col}]${_id}`;
            if (sampleSelected.indexOf(key) >= 0)
                return idx;
        }).filter(d => d != null);

        return (
            <div className={theme.tabDiv}>
                <div style={divStyle}>
                    <Autocomplete 
                        direction="down"
                        selectedPosition="none"
                        label="Select samples"
                        suggestionMatch="anywhere"
                        source={samples}
                        value={local_selected}
                        onQueryChange={q => this.q_sample = q}
                        onChange={this.handleSampleChange}
                        theme={theme}
                    />
                </div>
                <div style={{...divStyle, width: '15%', marginRight: '5px'}}>
                    <Button 
                        icon="select_all" 
                        label="ADD ALL" 
                        flat 
                        primary 
                        onClick={this.handleAddAll} 
                    />
                </div>
                <div style={{...divStyle, width: '15%', marginRight: '0px'}}>
                    <Button 
                        icon="clear" 
                        label="DEL ALL" 
                        flat 
                        primary 
                        onClick={this.handleDelAll} 
                    /> 
                </div>
                <List selectable>
                    <ListSubHeader caption={"Selected Samples"} />
                    <div style={{
                        height: `${ListHeight}px`,
                        overflowY: "scroll"
                    }}>
                        {this.renderSelectedSamples()}
                    </div>
                </List>
            </div>
        );
    }

    render() {
        return (
            <div>
                {this.renderDBView()}
                {this.renderSampleView()}
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        sampleSelected: getSelectedSamples(state),
        sampleSelectedCounts: getSelectedSamplesCounts(state),
        sampleColors: state.data.sampleColors,
        db: state.data.dbName,
        col: state.data.colName
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        onUpdateDB: update_db_info,
        onSampleAdd: get_data,
        onSampleDel: del_data,
        onColorChange: changeSelectedSampleColors,
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DataTab);