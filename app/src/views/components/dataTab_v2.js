import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import axios from "axios";

import Autocomplete from "react-toolbox/lib/autocomplete";
import { Button, IconButton } from "react-toolbox/lib/button";
import { List, ListItem, ListSubHeader } from "react-toolbox/lib/list";
import DBView from "./dbview";
import theme from "./index.css"

import { sortAlphaNum } from "../../utils";
import { hexToRGBA } from "react-multiview/lib/utils";
import throttle from "lodash.throttle";

import {
    get_data,
    del_data,
    changeSelectedSampleColors,
    //update_db_info,

    // for watcher view
    set_working_directory,
    get_watcher_connect,
    get_watcher_disconnect,
    set_watcher_update_flag,

    set_sync_info
} from "../../actions/dataActions";

import {
    getSelectedSamples,
    getSelectedSamplesCounts
} from "../../selectors";

const THROTTLE_INTERVAL = 100;

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
        this.state = {
            sampleList: [],
            db: null,
            col: null,
        }

        this.q_sample = null;
        this.asyncUpdateSampleList = throttle(
            this.asyncUpdateSampleList, 
            THROTTLE_INTERVAL,
            {'leading': true, 'trailing': true}
        );

        // interval id to get progress of a syncer
        this.interval = null;
    }

    asyncUpdateSampleList = (props = this.props) => {
        const {wdir, db, col} = props;
        if (wdir == null || db == null || col == null) {
            return;
        }

        const { 
            sampleSelected, 
            sampleSelectedCounts,
        } = props;

        axios.get("/api/db/samplelist", {params:{db, col}})
            .then(resp => {
                // if the number of samples are different, add samples..
                const sampleList = resp.data;
                const samplesToAdd = sampleList.map(item => {
                    const {_id, count} = item;
                    const key = `[${db}][${col}]${_id}`;
                    const idx = sampleSelected.indexOf(key);
                    if (idx >= 0 && sampleSelectedCounts[idx] != count) {
                        return _id;
                    }
                }).filter(d => d!=null);
                this.setState({sampleList, db, col});
                if (samplesToAdd.length && props.onSampleAdd) {
                    props.onSampleAdd(db, col, samplesToAdd);
                }
            })
            .catch(e => {
                console.log(e)
            });
    }

    componentDidMount() {
        this.asyncUpdateSampleList()
    }

    componentWillReceiveProps(nextProps) {
        this.asyncUpdateSampleList(nextProps)
    }

    componentWillUnmount() {
        // const {db, col} = this.state;
        // if (this.props.onUpdateDB)
        //     this.props.onUpdateDB(db, col);

        if (this.interval) clearInterval(this.interval);
    }

    // watcher --------------------------------------------------------------
    handleConnect = () => {
        const { wdir } = this.props;
        const { db, col } = this.state;
        if (this.props.get_watcher_connect)
            this.props.get_watcher_connect(wdir, db, col);
    }

    handleDisconnect = () => {
        const { wdir } = this.props;
        const { db, col } = this.state;
        if (this.props.get_watcher_disconnect)
            this.props.get_watcher_disconnect(wdir, db, col);
    }
    // end of watcher --------------------------------------------------------
    

    addSamples = (keyArray) => {
        const { sampleList, db:dbState, col:colState } = this.state;
        const { sampleSelected, db:dbProp, col:colProp } = this.props;

        const samplesToAdd = keyArray.map(key => {
            const {_id, count} = sampleList[key];
            const name = `[${dbState}][${colState}]${_id}`;
            if (sampleSelected.indexOf(name) === -1) 
                return _id;
        }).filter(d => d != null);

        if (samplesToAdd.length && this.props.onSampleAdd) {
            this.props.onSampleAdd(dbState, colState, samplesToAdd);
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
        const { sampleList, db:dbState, col:colState } = this.state;
        const { height, sampleSelected, db:dbProp, col:colProp } = this.props;
        const ListHeight = height - 300;

        const samples = {};
        const local_selected = sampleList.map( (sample, idx) => {
            const {_id, count} = sample;
            samples[idx] = `[${count}] ${_id}`;

            const key = `[${dbState}][${colState}]${_id}`;
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

    renderDBView = () => {
        const { 
            wdir, isRecursive, db, col, 
            isSyncing, syncerID, syncTotal, syncProcessed,
            isMonitoring,
            isConnected,
            set_working_directory,
            set_sync_info,
        } = this.props;
        const divStyle = {
            display: 'inline-block',
            width: '50%',
            paddingRight: '10px'    
        }
        return (
            <div className={theme.tabDiv}>
                <DBView
                    db={db}
                    col={col}
                    inputLabel="Selected directory"
                    dialogTitle="Select a working directory"
                    updateWorkDir={set_working_directory}
                    disabled={false}
                    isSyncing={isSyncing}
                    syncerID={syncerID}
                    syncTotal={syncTotal}
                    syncProcessed={syncProcessed}
                    updateSyncInfo={set_sync_info}
                    isMonitoring={isMonitoring}
                />
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

        wdir: state.data.wdir,
        isRecursive: state.data.isRecursive,

        db: state.data.dbName,
        col: state.data.colName,

        isSyncing: state.data.isSyncing,
        syncerID: state.data.syncerID,
        syncTotal: state.data.syncTotal,
        syncProcessed: state.data.syncProcessed,

        isMonitoring: state.data.isMonitoring,


        isConnected: state.data.isConnected,


        // for watcher view
        watcherFlag: state.data.isUpdatedByWatcher,
        // sID: state.data.sID,
        // total: state.data.total,
        // processed: state.data.processed            
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        onSampleAdd: get_data,
        onSampleDel: del_data,
        onColorChange: changeSelectedSampleColors,

        set_working_directory,
        set_sync_info,



        get_watcher_connect,
        get_watcher_disconnect,
        set_watcher_update_flag,
        
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DataTab);