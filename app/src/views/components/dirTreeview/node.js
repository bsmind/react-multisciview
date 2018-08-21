import React from 'react';
import classNames from 'classnames';

import { FontIcon, Input } from "react-toolbox";

import theme from './treeview.css';
import dialogTheme from './dialog.css';

class Node extends React.Component {

    handleDBChange = (value) => {
        value = value.replace(/ /g, "_");
        const {node, code, onDBChange} = this.props;
        if (onDBChange) {
            onDBChange(value, code, node);
        }
    }

    handleColChange = (value) => {
        value = value.replace(/ /g, "_");
        const {node, code, onColChange} = this.props;
        if (onColChange) {
            onColChange(value, code, node);
        }
    }

    handleNodeClick = (e) => {
        e.stopPropagation();
        const {node, code, onNodeClick} = this.props;
        if (onNodeClick) {
            onNodeClick(code, node)
        }
    }

    renderNode() {
        const { node, expanded, size, selected } = this.props;
        return (
            <div className={classNames(theme.node)}>
                <div
                    style={{overflow: 'hidden'}}
                    className={classNames(theme.header, {
                        [theme.selected]: selected,
                        [size ? theme[size]: theme['sm']]: true
                    })}
                >
                    <div style={{display: 'inline-block', width:'90%'}}>
                        <div style={{
                            display: 'inline-block', 
                            width: '55%', 
                            paddingRight: '5px',
                            paddingLeft: '5px'
                        }}>
                            <Input 
                                label={'path'}
                                value={node.name}
                                readOnly={true}
                                style={{cursor: 'pointer'}}
                                theme={dialogTheme}
                                onClick={this.handleNodeClick}
                            />
                        </div>
                        <div style={{display: 'inline-block', width: '20%', paddingRight: '5px'}}>
                            <Input
                                label={'db'}
                                value={node.db ? node.db[0] : 'null'}
                                theme={dialogTheme}
                                onClick={e => e.stopPropagation()}
                                onChange={this.handleDBChange}
                                readOnly={node.fixed}
                            />
                        </div>
                        <div style={{display: 'inline-block', width: '20%', paddingRight: '5px'}}>
                            <Input 
                                label={'collection'}
                                value={node.db ? node.db[1] : 'null'}
                                theme={dialogTheme}
                                onClick={e => e.stopPropagation()}
                                onChange={this.handleColChange}
                                readOnly={node.fixed}
                            />
                        </div>                        
                    </div>
                    <div 
                        className={classNames(theme.arrow, {
                            [theme.arrowExpanded]: expanded
                        })}
                        style={{display: 'inline-block', width:'10%'}}
                    >
                        {node.children && node.children.length > 0 
                            ? <FontIcon value='keyboard_arrow_down' />
                            : null
                        }
                    </div>
                </div>
            </div>
        );
    }

    render() {
        const { expanded } = this.props;
        return (
            <li onClick={this.handleNodeClick}>
                {this.renderNode()}
                <div
                    style={{overflow: 'hidden'}}
                    className={classNames(theme.children, {
                        [theme.childrenExpanded]: expanded
                    })}
                >
                    {expanded ? this.props.children: null}
                </div>
            </li>

        );
    }
}

export default Node;
