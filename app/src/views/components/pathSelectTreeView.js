import React from "react";

import {Dialog, Input} from "react-toolbox";
import {TreeView} from "../../components/treeview"

import dialogTheme from "./dialog.css";

class PathNode extends React.Component {
    constructor(props) {
        super(props);
        const db = props.node.db;
        this.state = {
            db: db ? db[0]: 'null',
            col: db ? db[1]: 'null'
        }
    }

    componentWillReceiveProps(nextProps) {
        const {node} = nextProps;
        this.setState({
            db: node.db ? node.db[0]: 'null',
            col: node.db ? node.db[1]: 'null'
        });
    }

    handleDBNameChange = (value) => {
        value = value.replace(/ /g, "_");
        //this.setState({db: value});
        this.props.onDBNameChange(this.props.node.path, value);
    }

    handleColNameChange = (value) => {
        value = value.replace(/ /g, "_");
        //this.setState({col: value});
        this.props.onColNameChange(this.props.node.path, value);
    }

    render() {
        const { node } = this.props;
        return (
            <div>
                {/* path */}
                <div style={{display: 'inline-block', width: '50%', paddingRight: '5px'}}>
                    <Input 
                        label={'path'}
                        value={node.name}
                        readOnly={true}
                        theme={dialogTheme}
                        onClick={e => e.stopPropagation()}
                    />
                </div>
                {/* db name */}
                <div style={{display: 'inline-block', width: '20%', paddingRight: '5px'}}>
                    <Input
                        label={'db'}
                        value={this.state.db}
                        theme={dialogTheme}
                        onClick={e => e.stopPropagation()}
                        onChange={this.handleDBNameChange}
                        readOnly={node.fixed}
                    />
                </div>
                {/* collection name */}
                <div style={{display: 'inline-block', width: '20%', paddingRight: '5px'}}>
                    <Input 
                        label={'collection'}
                        value={this.state.col}
                        theme={dialogTheme}
                        onClick={e => e.stopPropagation()}
                        onChange={this.handleColNameChange}
                        readOnly={node.fixed}
                    />
                </div>
            </div>
        );
    }
}

class PathSelectTreeView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            nodes: props.nodes
        }
    }

    handleNodeSelect = (nodeKey, node) => {
        
    }

    update = (key, value, idx) => {
        const { nodes } = this.state;
        const { recursive } = this.props;

        function _recursive_update(_nodes, _key){
            const _node = _nodes.get(_key);
            let _db = _node['db'];
            if (_db == null) {
                _db = ['null', 'null', 'null'];
            }
            _db[idx] = value; // update db 
            _node['db'] = _db; // update node
            _nodes.set(_key, _node); // update nodes

            if (recursive)
                _node['children'].forEach(c => {
                    _recursive_update(_nodes, c);
                });
        }
        _recursive_update(nodes, key);
        this.setState({nodes});
    }

    handleDBNameChange = (key, value) => {
        this.update(key, value, 0);
    }

    handleColNameChange = (key, value) => {
        this.update(key, value, 1)
    }

    render() {
        const nodeName = node => {
            return <PathNode 
                node={node}
                onDBNameChange={this.handleDBNameChange}
                onColNameChange={this.handleColNameChange}
            />;
        };

        return (
            <TreeView 
                nodes={this.state.nodes}
                nodeName={nodeName}
                search={this.props.search}
                onNodeSelect={this.handleNodeSelect}
                size={this.props.size}
            />
        );
    }
};

export default PathSelectTreeView;