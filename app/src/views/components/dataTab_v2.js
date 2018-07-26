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

            id: null,
            total: 0
        }

        this.q_sample = null;

        // interval id to get progress of a syncer
        this.interval = null;
    }

    asyncUpdateSampleList = (props = this.props) => {
        const {wdir, db, col} = props;
        if (wdir == null || db == null || col == null) {
            return;
        }
        axios.get("/api/db/samplelist", {params:{db, col}})
            .then(resp => {
                this.setState({sampleList: resp.data})
            })
            .catch(e => {
                console.log(e)
            });
    }

    componentDidMount() {
        this.asyncUpdateSampleList()

        // const {sID} = this.props;
        // if (this.interval == null && sID != null) {
        //     this.updateSyncProgress(sID);
        //     this.interval = setInterval(this.updateSyncProgress.bind(this, sID), 3000);
        // } else if (this.interval) {
        //     clearInterval(this.interval);
        // }        
    }

    componentWillReceiveProps(nextProps) {
        this.asyncUpdateSampleList(nextProps)
        // if there are updates by wacher, need to refresh db information
        // const { watcherFlag, db, col, set_watcher_update_flag } = nextProps;
        // if (watcherFlag && set_watcher_update_flag) {
        //     set_watcher_update_flag(false);
        //     this.asyncUpdateDBInfo()
        // }
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

    // syncer --------------------------------------------------------------
    handleSyncStart = () => {
        if (this.interval) {
            console.log('Unexpected error! Syncer is already running!');
            console.log('Maybe restart???')
            return;
        }

        const { wdir } = this.props;
        const { db, col } = this.state;
        axios.get('/api/sync', {params:{wdir, db, col}})
            .then(resp => {
                const data = resp.data;
                this.interval = setInterval(this.updateSyncProgress.bind(this, wdir, db, col), 3000);
                this.props.get_syncer_connect(wdir, db, col);
            })
            .catch(e => {
                console.log(e);
            });        
    }


    updateSyncProgress = (wdir, db, col) => {
        axios.get('/api/sync/progress', {params:{wdir, db, col}})
            .then(resp => {
                const data = resp.data;
                // need a flag to know if syncing is done or not
                // if (finished) {
                //     clearInterval(this.interval);
                //     this.interval = null
                // }
                this.props.get_sync_info(finished ? null: id, processed, total)
            })
            .catch(e => {
                console.log(e);
            });
    }


    handleSyncStop = () => {
        const {sID} = this.props;
        if (sID == null) return;

        const node = this.getNode();
        axios.get('/api/sync/stop', {params:{id:sID}})
            .then(resp => {
                if (this.interval) clearInterval(this.interval);
                this.props.set_sync_info(null, 0, 0)
            })
            .catch(e => {
                console.log(e);
            });
    }
    // end of watcher ----------------------------------------------------------------
    

    // db -------------------------------------------------------------------
    // end of db ------------------------------------------------------------

    // samples --------------------------------------------------------------
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
    // end of samples -------------------------------------------------------

    renderDBView = () => {
        const { 
            wdir, db, col, 
            isConnected,
            set_working_directory,
        } = this.props;
        return (
            <div className={theme.tabDiv}>
                <DBView
                    wdir={wdir}
                    db={db}
                    col={col}
                    inputLabel="Selected directory"
                    dialogTitle="Select a working directory"
                    updateWorkDir={set_working_directory}
                    disabled={isConnected}
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
        db: state.data.dbName,
        col: state.data.colName,

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
        //onUpdateDB: update_db_info,
        onSampleAdd: get_data,
        onSampleDel: del_data,
        onColorChange: changeSelectedSampleColors,

        // for watcher view
        set_working_directory,

        get_watcher_connect,
        get_watcher_disconnect,
        set_watcher_update_flag,
        set_sync_info
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DataTab);