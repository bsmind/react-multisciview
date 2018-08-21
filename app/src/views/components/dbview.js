import React from 'react';
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import { Button } from "react-toolbox/lib/button";
import { DirTreeView } from "./dirTreeview";
import { SyncView } from "./syncview";

import {
    setValue
} from "../../actions/dataActions";

class DBView extends React.Component {
    constructor() {
        super();
        this.state = {
            isOpen: false            
        };
    }

    handleToggle = () => {
        this.setState({isOpen: !this.state.isOpen});
    }

    render() {
        const { wdir, isRecursive, setValue, syncInfo } = this.props;
        const { isOpen } = this.state;
        return (
            <div>
                <div style={{
                    display: 'inline-block', 
                    width: '85%', 
                    paddingRight: '0px'}}
                >
                    <DirTreeView 
                        selectedDir={wdir}
                        recursive={isRecursive}
                        size={'xs'}
                        onDirSelect={setValue.bind(this, 'wdir')}
                        onTraverseModeChange={
                            setValue.bind(this, 'isRecursive')}
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
                    // Internally, SyncView component is mounted when dbview 
                    // is mounted. This is to keep the nice transition effect 
                    // in Dialog component.
                    <SyncView 
                        active={isOpen}
                        selectedDir={wdir}
                        recursive={isRecursive}
                        syncInfo={syncInfo}
                        updateSyncInfo={setValue.bind(this, 'syncInfo')}
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
        isRecursive: state.data.isRecursive,
        syncInfo: state.data.syncInfo,
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        setValue,
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DBView);