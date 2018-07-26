import React from 'react';
import axios from 'axios';

import {Dialog, Input} from 'react-toolbox';
import { Button } from "react-toolbox/lib/button";
import { TreeView } from 'rt-treeview';
import throttle from "lodash.throttle";


import dialogTheme from './dialog.css';

const SYNC_PROGRESS_INTERVAL = 5000;
const THROTTLE_INTERVAL = 100;


class DBView extends React.Component {
    constructor() {
        super();

        this.state = {
            wNodeMap: null,
            isOpen: false,

            isOpenOptionDialog: false,
            optionAction: null,
            optionTitle: '',
            optionMessage: '',

            newDBName: 'Type_new_name',
            newColName: 'Type_new_name'
        };

        this.syncInterval = null;
        this.asyncSyncer = throttle(
            this.asyncSyncer, 
            THROTTLE_INTERVAL,
            {'leading': true, 'trailing': true}
        );
    }

    asyncCreateDB = (wdir, db, col) => {
        if (wdir == null || db == null || col == null || db.length == 0 || col.length == 0) {
            console.log('todo: show message - invalid arguments for DB creation')
            return;
        }
        axios.get('/api/db/create', {params:{wdir, db, col}})
            .then(resp => {
                const { status } = resp.data;
                if (status) {
                    this.handleNodeSelect(null, {path: wdir, db: [db, col]});
                }
                else {
                    console.log('todo: show message - fail to update db')
                }
                this.setState({newDBName: 'Type_new_name', newColName: 'Type_new_name'})
            })
            .catch(e => {
                console.log(e);
            });
    }

    asyncSyncer = (mode, wdir, syncerID) => {
        axios.get('/api/syncer', {params: {mode, wdir, syncerID}})
            .then(resp => {
                const data = resp.data;
                if (data.status) {
                    const {status, id, total, processed, completed} = data;
                    // set interval to track process ...
                    if (id!=null && !completed && status) {
                        if (id == syncerID) {
                            if (this.syncInterval == null)
                                this.syncInterval = setInterval(
                                    this.asyncSyncer.bind(this, 'PROGRESS', wdir, id), 
                                    SYNC_PROGRESS_INTERVAL
                                );
                        }
                        else {
                            if (this.syncInterval) clearInterval(this.syncInterval);
                            this.syncInterval = setInterval(
                                this.asyncSyncer.bind(this, 'PROGRESS', wdir, id), 
                                SYNC_PROGRESS_INTERVAL
                            );    
                        }
                    } else {
                        if (this.syncInterval) clearInterval(this.syncInterval);
                        this.syncInterval = null;
                    }
                    if (this.props.updateSyncInfo) {
                        this.props.updateSyncInfo(id!=null, id, processed, total);
                    }
                } else {   
                    console.log('todo: show error message - ', data.message);
                    if (this.syncInterval) clearInterval(this.syncInterval);
                    this.syncInterval = null;

                    if (this.props.updateSyncInfo) {
                        this.props.updateSyncInfo(false, null, 0, 0);
                    }
                }
            })
            .catch(e => {
                console.log(e)
            });
    }

    componentDidMount() {
        const {wdir, isSyncing, syncerID} = this.props;
        if (isSyncing) {
            this.asyncSyncer('PROGRESS', wdir, syncerID);
        }
    }

    componentWillUnmount() {
        if (this.syncInterval) clearInterval(this.syncInterval);
        this.syncInterval = null;
    }

    handleToggleWithUpdate = () => {
        const isOpen = !this.state.isOpen;
        if (isOpen)
            axios.get('/api/db/fsmap')
                .then(resp => {
                    this.setState({wNodeMap: new Map(resp.data), isOpen});
                })
                .catch(e => {
                    console.log(e);
                });
        else
            this.setState({isOpen});
    }

    handleToggle = (flag = false, event) => {
        if (flag) {
            const { wdir, db, col } = this.props;
            this.asyncCreateDB(wdir, db, col);
        }
        this.setState({isOpen: !this.state.isOpen});
    }

    handleNodeSelect = (nodeKey, node) => {
        if (this.props.updateWorkDir) {
            this.props.updateWorkDir(node.path, node.db)
        }
    }

    handleCreateDB = () => {
        const { wdir } = this.props;
        const { newDBName, newColName } = this.state;
        if (wdir == null || newDBName.length == 0 || newColName.length == 0) {
            console.log('todo: show message - invalid arguments for DB creation')
            return;
        }
        this.asyncCreateDB(wdir, newDBName, newColName);
    }

    handleToggleSync = () => {
        const {wdir, isSyncing, syncerID} = this.props;
        const mode = isSyncing ? "STOP": "START";
        this.asyncSyncer(mode, wdir, syncerID);
    }

    renderDatabaseView = () => {
        const { wNodeMap } = this.state;
        
        const dbmap = {}
        wNodeMap.forEach((value, key) => {
            if (value.db != null) {
                const db = value.db;
                const dbKey = `${db[0]}_${db[1]}`;
                if (!dbmap.hasOwnProperty(dbKey)) {
                    dbmap[dbKey] = {
                        key: dbKey,
                        name: db[1],
                        parent: db[0],
                        children: []
                    };
                    if (!dbmap.hasOwnProperty(db[0])) {
                        dbmap[db[0]] = {
                            key: db[0],
                            name: db[0],
                            parent: null,
                            children: [dbKey]    
                        };
                    }
                    else {
                        dbmap[db[0]]['children'].push(dbKey);    
                    }
                }
            }
        });

        const dbMap = new Map(Object.keys(dbmap).map(key => {
            return [key, dbmap[key]];
        }));

        const divStyle = {
            display: 'inline-block',
            width: '50%',
            paddingRight: '10px'    
        }
        return <div>
            <div style={divStyle}>
                <Input 
                    label={"Selected DB Name"}
                    value={this.state.newDBName}
                    onChange={value => this.setState({newDBName: value.replace(/ /g,"_")})} 
                />
            </div>
            <div style={divStyle}>
                <Input 
                    label={"Selected DB Name"}
                    value={this.state.newColName}
                    onChange={value => this.setState({newColName: value.replace(/ /g,"_")})} 
                />
            </div>
            <TreeView 
                nodes={dbMap}
                search={false}
                onNodeSelect={(nodeKey, node) => {
                    if (node.parent != null) 
                        this.setState({
                            newDBName: node.parent,
                            newColName: node.name})
                    else 
                        this.setState({newDBName: node.name})
                }}
                size={'xs'}
            />
        </div>

    }

    renderDirectoryView = () => {
        const { wNodeMap } = this.state;
        const { wdir, db, col } = this.props;

        const divStyle = {
            display: 'inline-block',
            width: '50%',
            paddingRight: '10px'    
        }

        return (
            <div>
                <div style={divStyle}>
                    <Input 
                        label={"Selected DB Name"}
                        value={db || "Undefined"}
                        readOnly={true}
                    />
                </div>
                <div style={divStyle}>
                    <Input 
                        label={"Selected DB Name"}
                        value={col || "Undefined"}
                        readOnly={true} 
                    />
                </div>
        
                <TreeView 
                    nodes={wNodeMap}
                    search={true}
                    onNodeSelect={this.handleNodeSelect}
                    size={'xs'}
                />
            </div>
        );
    }

    renderSelectedDB = (style) => {
        const { wdir, db, col } = this.props;
        const divStyle = {
            display: 'inline-block',
            width: '50%',
            paddingRight: '10px'    
        }
        return (
            <div style={style}>
                <div style={divStyle}>
                    <Input 
                        label={"DB Name"} 
                        value={db || this.state.newDBName} 
                        onChange={value => this.setState({newDBName: value.replace(/ /g,"_")})} 
                        readOnly={true} 
                    />
                </div>
                <div style={divStyle}>
                    <Input 
                        label={"Collection Name"} 
                        value={col || this.state.newColName} 
                        onChange={value => this.setState({newColName: value.replace(/ /g,"_")})} 
                        readOnly={true} 
                    />
                </div>
            </div>
        );
    }

    renderOptions = (style) => {
        const {isSyncing, syncTotal, syncProcessed} = this.props;
        const divStyle = {
            display: 'inline-block',
            width: '30%',
            paddingRight: '10px'    
        }

        const syncLabel = isSyncing ? "SYNC.STOP ": "SYNC.START";
        const progress = syncTotal ? Math.trunc(syncProcessed / syncTotal * 100): 0;
        return (
            <div style={style}>
                <div style={divStyle}>
                    <Button 
                        primary={!isSyncing} 
                        accent={isSyncing} 
                        label={syncLabel}
                        onClick={this.handleToggleSync} 
                    />
                </div>
                <div style={divStyle}>
                    <Button flat primary label={"MONITOR"} />
                </div>
                {isSyncing &&
                    <div style={{...divStyle, width:'30%', paddingRight: '0px'}}>
                        <span style={{color:'red'}}>{`${progress}%`}</span>
                    </div>
                }
            </div>
        );
    }

    render() {
        const { wNodeMap } = this.state;
        const { wdir, db, col } = this.props;
        const divStyle = {
            display: 'inline-block',
            width: '60%',
            paddingRight: '10px'    
        }
        return (
            <div>
                <Input
                    label={this.props.inputLabel}
                    value={wdir || 'Select a directory to retrieve/monitor/sync'}
                    onClick={this.handleToggleWithUpdate}
                    readOnly={true}
                    style={{cursor: 'pointer'}}
                    disabled={this.props.disabled}
                    theme={dialogTheme}
                />
                <Dialog
                    active={this.state.isOpen}
                    actions={[
                        { label: "PUSH", onClick: this.handleToggle.bind(this, true) },
                        { label: "CLOSE", onClick: this.handleToggle.bind(this, false) }
                    ]}
                    onEscKeyDown={this.handleToggle.bind(this, false)}
                    onOverlayClick={this.handleToggle.bind(this, false)}
                    title={this.props.dialogTitle ? this.props.dialogTitle : ""}
                    theme={dialogTheme}
                >
                    { wNodeMap != null &&
                        this.renderDirectoryView()
                    }
                </Dialog>
                <Dialog
                    active={!this.state.isOpen && wdir != null && db == null}
                    title={"DATABASE"}
                    actions={[
                        { label: "APPLY", onClick: this.handleCreateDB }
                    ]}
                >
                    { wNodeMap != null && !this.state.isOpen && wdir != null && db == null &&
                        this.renderDatabaseView()
                    }
                </Dialog>
                {this.renderSelectedDB(divStyle)}
                {this.renderOptions({...divStyle, width:'40%', paddingRight: '10px'})}
            </div>

        )
    }
}

export default DBView;