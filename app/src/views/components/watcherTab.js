import React from "react";
import axios from "axios";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import {
    set_watcher_nodekey,
    get_watcher_connect,
    get_watcher_disconnect,
    set_sync_info
} from "../../actions/dataActions";

import {TreeView} from "rt-treeview";
import TreeViewDialog from "./rtDialog";
import Dialog from "react-toolbox/lib/dialog";
import Button from "react-toolbox/lib/button";
import ProgressBar from "react-toolbox/lib/progress_bar";
import theme from "./index.css";

class WatcherTab extends React.Component {
    constructor() {
        super();
        this.state = {
            id: null,
            total: 0
        }

        this.interval = null
    }

    componentWillUnmount() {
        if (this.interval) clearInterval(this.interval);
    }

    componentDidMount() {
        const {sID} = this.props;
        if (this.interval == null && sID != null) {
            this.updateSyncProgress(sID);
            this.interval = setInterval(this.updateSyncProgress.bind(this, sID), 3000);
        } else if (this.interval) {
            clearInterval(this.interval);
        }
    }

    getNode = () => {
        const {wNodeKey, wNodeMap} = this.props;
        return wNodeMap.get(wNodeKey);
    }

    handleConnect = () => {
        const node = this.getNode();
        this.props.get_watcher_connect(node.path);
    }

    handleDisconnect = () => {
        const node = this.getNode();
        this.props.get_watcher_disconnect(node.path);
    }

    updateSyncProgress = (id) => {
        axios.get('/api/sync/progress', {params:{id}})
            .then(resp => {
                const { id, processed, total, finished } = resp.data;
                if (finished) {
                    clearInterval(this.interval);
                    this.interval = null
                }
                this.props.set_sync_info(finished ? null: id, processed, total)
            })
            .catch(e => {
                console.log(e);
            });
    }

    handleSync = () => {
        const node = this.getNode();
        // const wdir = this.nodes.get(this.state.selectedNodeKey).path;    
        axios.get('/api/sync', {params:{wdir:node.path}})
            .then(resp => {
                const {id, total} = resp.data;
                if (this.interval) {
                    clearInterval(this.interval);
                    this.interval = null
                }
                this.interval = setInterval(this.updateSyncProgress.bind(this,id), 3000);
                this.props.set_sync_info(id, 1, total);
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

    handleNodeSelect = (nodeKey, node) => {
        this.props.set_watcher_nodekey(nodeKey);
    }

    render() {
        const { isConnect, wNodeMap } = this.props;
        const { sID, total, processed } = this.props;
        const node = this.getNode();

        return (
            <div>
                <div className={theme.tabDiv}>
                    <TreeViewDialog
                        inputValue={node ? node.path: "Unknown"}
                        inputLabel="Selected directory"
                        dialogTitle="Select working directory"
                        disabled={isConnect}
                    >
                        <TreeView
                            nodes={wNodeMap}
                            search={true}
                            onNodeSelect={this.handleNodeSelect}
                            size={'xs'}
                        />
                    </TreeViewDialog>
                </div>
                <div className={theme.tabDiv}>
                    <Button label='CONNECT' flat primary onClick={this.handleConnect} disabled={isConnect}/>
                    <Button label='DISCONNECT' flat primary onClick={this.handleDisconnect} disabled={!isConnect}/>
                    <Button label='SYNC. START' flat primary onClick={this.handleSync} disabled={!isConnect}/>
                    <Button label="SYNC. STOP" flat primary onClick={this.handleSyncStop} disabled={sID==null}/>
                    <ProgressBar type="linear" mode="determinate" value={processed} min={0} max={total} disabled={sID==null}/>
                </div>
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        isConnect: state.data.isConnected,
        wNodeKey: state.data.wNodeKey,
        wNodeList: state.data.wNodeList,
        wNodeMap: state.data.wNodeMap,
        sID: state.data.sID,
        total: state.data.total,
        processed: state.data.processed            
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        set_watcher_nodekey,
        get_watcher_connect,
        get_watcher_disconnect,
        set_sync_info
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(WatcherTab);
