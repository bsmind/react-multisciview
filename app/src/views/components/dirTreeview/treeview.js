import React from 'react';
import classNames from 'classnames';

import Node from './node';
import theme from './treeview.css';

class TreeView extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            selectedNode: props.selectedNode,
            expandedNodes: []
        }
    }

    handleNodeClick = (code, node) => {
        const { expandedNodes } = this.state;
        if (node.children.length == 0) {
            // do nothing
        } else {
            const idx = expandedNodes.indexOf(code);
            if (idx > -1) {
                expandedNodes.splice(idx, 1);
            } else {
                expandedNodes.push(code);
            }    
        }

        this.setState({
            expandedNodes,
            selectedNode: code
        }, () => {
            if (this.props.onNodeSelect) {
                this.props.onNodeSelect(code);
            }
        });
    }

    renderNodes = (nodeKeys) => {
        const { nodes, size, onDBChange, onColChange } = this.props;
        const { expandedNodes, selectedNode } = this.state;
        return (
            <ul>
                {
                    nodeKeys.map(key => {
                        const node = nodes.get(key);
                        const selected = selectedNode && selectedNode === key;
                        return (
                            <Node
                                key={key}
                                code={key}
                                node={node}
                                size={size}
                                expanded={expandedNodes.indexOf(key) > -1}
                                selected={selected}
                                onNodeClick={this.handleNodeClick}
                                onDBChange={(new_name, code, node) => onDBChange(new_name, code)}
                                onColChange={(new_name, code, node) => onColChange(new_name, code)}
                            >
                                {node.children && node.children.length > 0 ?
                                    this.renderNodes(node.children) : null
                                }
                            </Node>
                        );
                    })
                }
            </ul>
        );
    }

    render() {
        const { nodes } = this.props;
        const roots = Array.from(nodes.keys()).filter(key => !nodes.get(key).parent);
        
        return (
            <div className={classNames(theme.treeView)}>
                {this.renderNodes(roots)}
            </div>
        );
    }
}

export default TreeView;