import React from 'react';
import axios from 'axios';
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import {Dialog, Input} from 'react-toolbox';
import { Button } from "react-toolbox/lib/button";
import { DirTreeView } from "./dirTreeview";
import { SyncView } from "./syncview";
import throttle from "lodash.throttle";

import {
    setValue
} from "../../actions/dataActions";


const SYNC_PROGRESS_INTERVAL = 5000;
const THROTTLE_INTERVAL = 100;


class DBView extends React.Component {
    constructor() {
        super();

        this.state = {
            isOpen: false            
        };

        this.syncInterval = null;
        this.asyncSyncer = throttle(
            this.asyncSyncer, 
            THROTTLE_INTERVAL,
            {'leading': true, 'trailing': true}
        );
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

    handleToggleSync = () => {
        const {wdir, isSyncing, syncerID} = this.props;
        const mode = isSyncing ? "STOP": "START";
        this.asyncSyncer(mode, wdir, syncerID);
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

    handleToggle = () => {
        this.setState({isOpen: !this.state.isOpen});
    }

    render() {
        const { wdir, isRecursive, setValue } = this.props;
        const { isOpen } = this.state;
        return (
            <div>
                <div style={{display: 'inline-block', width: '85%', paddingRight: '0px'}}>
                    <DirTreeView 
                        selectedDir={wdir}
                        recursive={isRecursive}
                        size={'xs'}
                        onDirSelect={setValue.bind(this, 'wdir')}
                        onTraverseModeChange={setValue.bind(this, 'isRecursive')}
                    />
                </div>
                <div style={{display: 'inline-block', width: '15%'}}>
                    <Button 
                        icon={wdir == null ? 'sync_disabled': 'sync'}
                        label={'SYNC'}
                        disabled={wdir==null}
                        primary={true}
                        onClick={this.handleToggle}
                    />
                </div>
                {/* SyncView is a dialog. */
                    // Internally, SyncView component is mounted when dbview is mounted.
                    // This is to keep the nice transition effect in Dialog component.
                    <SyncView 
                        active={isOpen}
                        selectedDir={wdir}
                        recursive={isRecursive}
                        close={this.handleToggle}
                    />
                }
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        wdir: state.data.wdir,
        isRecursive: state.data.isRecursive
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        setValue
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DBView);