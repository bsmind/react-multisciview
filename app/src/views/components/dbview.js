import React from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

import {Dialog, Input} from 'react-toolbox';
import { Button, IconButton } from "react-toolbox/lib/button";
import { TreeView } from 'rt-treeview';

import dialogTheme from './dialog.css';

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

            newDBName: 'Type_new_db_name',
            newColName: 'Type_new_collection_name'
        };
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
                this.setState({newDBName: 'Type_new_db_name', newColName: 'Type_new_collection_name'})
            })
            .catch(e => {
                console.log(e);
            });
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

    render() {
        const { wNodeMap } = this.state;
        const { wdir, db, col } = this.props;
        const divStyle = {
            display: 'inline-block',
            width: '50%',
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
                        <TreeView 
                            nodes={wNodeMap}
                            search={true}
                            onNodeSelect={this.handleNodeSelect}
                            size={'xs'}
                        />
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

        )
    }
}

export default DBView;