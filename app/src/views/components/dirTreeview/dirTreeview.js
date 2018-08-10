import React from "react";
import axios from "axios";

import {Dialog, Input, Checkbox} from "react-toolbox";
import TreeView from "./treeview";

import dialogTheme from './dialog.css';


// todo: search
class DirTreeView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedDir: props.selectedDir,
            isOpen: false, 
            nodes: null,
        };
    }

    asyncUpdate = (isOpen = true, save = false) => {
        const payload = {nodeList: []};
        if (save) {
            const { nodes } = this.state;
            nodes.forEach((value, key) => {
                payload.nodeList.push([key, value]);
            });
        }

        axios.post('/api/db/fsmap', payload)
            .then(resp => {
                this.setState({nodes: new Map(resp.data), isOpen}, () => {
                    if (this.props.onDirSelect && !isOpen) {
                        this.props.onDirSelect(this.state.selectedDir)
                    }                    
                });
            })
            .catch(e => {
                console.log(e);
            });
    }

    update_db = (new_name, code, idx) => {
        const { nodes } = this.state;
        const { recursive } = this.props;

        const processed = [];
        function _recursive_update(_nodes, _key) {
            if (processed.indexOf(_key) >= 0)
                return;

            const _node = _nodes.get(_key);   
            if (!_node['fixed']) {
                let _db = _node['db'];
                if (_db == null) _db = ['null', 'null', 'null'];
                _db[idx] = new_name;
                _node['db'] = _db;
                _nodes.set(_key, _node)
            }
            processed.push(_key);

            if (recursive) {
                _node['children'].forEach(c => {
                    _recursive_update(_nodes, c);
                });
            }

            if (_node['link']) {
                _recursive_update(_nodes, _node['link']);
            }
        }
        _recursive_update(nodes, code);
        this.setState({nodes})
    }

    handleDirSelect = (dir) => {
        this.setState({selectedDir: dir});
    }

    handleDBChange = (new_name, code) => {
        this.update_db(new_name, code, 0);
    }

    handleColChange = (new_name, code) => {
        this.update_db(new_name, code, 1);
    }

    handleRefresh = () => {
        this.asyncUpdate(true, false);
    }

    handleSave = () => {
        this.asyncUpdate(true, true);
    }

    handleSaveAndClose = () => {
        this.asyncUpdate(false, true);
    }

    handleToggleWidthUpdate = () => {
        const isOpen = !this.state.isOpen;
        if (isOpen) {
            this.asyncUpdate(isOpen);
        }
        else
            this.setState({isOpen}, () => {
                if (this.props.onDirSelect) {
                    this.props.onDirSelect(this.state.selectedDir)
                }
            });
    }

    handleToggle = () => {
        this.setState({isOpen: !this.state.isOpen}, () => {
            if (this.props.onDirSelect) {
                this.props.onDirSelect(this.state.selectedDir)
            }
        });
    }

    render() {
        const { recursive, disabled, size } = this.props;
        const { onTraverseModeChange } = this.props;
        const { nodes, isOpen, selectedDir } = this.state;
        return (
            <div>
                <div 
                    style={{
                        display: 'inline-block',
                        width: '80%',
                        paddingRight: '10px'
                    }}
                >
                    <Input 
                        label={"Selected directory"}
                        value={selectedDir || 'Select a directory to retrieve'}
                        onClick={this.handleToggleWidthUpdate}
                        readOnly={true}
                        style={{cursor: 'pointer'}}
                        disabled={disabled}
                        theme={dialogTheme}
                    />
                </div>
                <div
                    style={{
                        display: 'inline-block',
                        width: '20%',
                    }}
                >
                    <Checkbox 
                        checked={recursive}
                        label="recursive"
                        onChange={onTraverseModeChange}
                    />
                </div>
                <Dialog
                    active={isOpen}
                    actions={[
                        {label: 'REFRESH', onClick: this.handleRefresh},
                        {label: 'SAVE', onClick: this.handleSave},
                        {label: 'SAVE & CLOSE', onClick: this.handleSaveAndClose},
                        {label: 'CLOSE', onClick: this.handleToggle}
                    ]}
                    onEscKeyDown={this.handleToggle}
                    onOverlayClick={this.handleToggle}
                    title={'Select a directory to retrieve'}
                    theme={dialogTheme}
                >
                    {nodes &&
                        <TreeView 
                            nodes={nodes}
                            selectedNode={selectedDir}
                            size={size}
                            onDBChange={this.handleDBChange}
                            onColChange={this.handleColChange}
                            onNodeSelect={this.handleDirSelect}
                        />
                    }
                </Dialog>
            </div>
        );
    }
}

export default DirTreeView;