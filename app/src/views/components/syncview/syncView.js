import React from 'react';
import classNames from 'classnames';
import axios from 'axios';
import {Dialog, Input, Button, IconButton} from 'react-toolbox';
import theme from './syncview.css';
import dialogTheme from './dialog.css';

const SYNC_PROGRESS_INTERVAL = 1000;

const SyncNode = (props) => {
    const {code, onSeparatorChange, onGroupNameChange, status} = props; 
    const {total, processed, timestamp} = props;
    const {onNodeDelete, onStartSync} = props;

    let label = props.file_name, 
        value = props.path_name, 
        readOnly = true;
    if (status === 'INIT' || status === 'COMPLETED') {
        label = props.path_name;
        value = props.file_name;
        readOnly = false;
    }

    const percent = total ? Math.round(100 * processed / total): 0;

    return (
        <div className={classNames(theme.node)}>
            <div className={classNames(theme.infonode)}>
                <div className={classNames(theme.nameInput)}>
                    <Input 
                        label={label} 
                        value={value} 
                        readOnly={true} 
                        theme={theme} 
                    />
                </div>
                <div className={classNames(theme.sepInput)}>
                    <Input 
                        label={`key`} 
                        value={props.sep}
                        readOnly={readOnly}
                        onChange={onSeparatorChange.bind(this, code)}
                        theme={theme}
                    />
                </div>
                <div className={classNames(theme.groupInput)}>
                    <Input 
                        label={'group name'} 
                        value={props.group_name} 
                        readOnly={readOnly} 
                        onChange={onGroupNameChange.bind(this, code)}
                        theme={theme} 
                    />
                </div>
                <div className={classNames(theme.statusInput)}>
                    <Input 
                        label={timestamp == null ? 'status': timestamp} 
                        value={status} 
                        readOnly={true} 
                        theme={theme} 
                    />
                </div>
            </div>
            <div className={classNames(theme.cmdnode)}>
                <IconButton 
                    icon={'delete'} 
                    onClick={e => onNodeDelete(e, code)}
                />
                <IconButton 
                    icon={'sync'} 
                    accent={status === 'RUNNING'}
                    onClick={
                        status === 'RUNNING' 
                        ? null: e => onStartSync(e, code)
                    }
                />                
                <span style={{fontSize: '8px'}}>{`${percent}%`}</span>
            </div>
        </div>
    );
}


class SyncView extends React.Component {
    /**
     * 
     * syncInfo (object)
     * 
     * This object is to communicate with Web Server. It is initiated from
     * this SyncView class and updated during the communication. Its structure
     * is as follows:
     * {
     *      'path/to/sync': {
     *          'path_name': str, path name to display,
     *          'file_name': str, sample file name to determine separator (for grouping),
     *          'group_name': str, group name in this folder,
     *          'sep': str, separator (keyword),
     *          'status': int, index of one of [RUNNING, QUEUED, COMPLETED, ERROR],
     *          'total': int, the number of files to be synced,
     *          'processed': int, the number of files prossessed,
     *      }
     * }
     */
    constructor(props) {
        super(props);

        this.state = {
            syncInfo: {...props.syncInfo},
        };
        this.interval = null;
    }

    asyncGetSampleFiles = (wdir, recursive) => {
        if (wdir == null) return;

        const payload = {wdir, recursive};
        axios.post('/api/syncer/init', payload)
            .then(resp => {
                // override existing syncInfo
                const data = resp.data;
                this.setState({
                    syncInfo: {...this.state.syncInfo, ...data}
                }, () => {
                    if (this.interval == null) {
                        this.interval = setInterval(
                            this.asyncSyncProgress,
                            SYNC_PROGRESS_INTERVAL
                        );
                    }
                });
            })
            .catch(e => {
                console.log(e);
            });
    }

    asyncSyncProgress = () => {
        const { syncInfo } = this.state;

        const payload = {};
        let count = 0
        Object.keys(syncInfo).forEach(path => {
            const info = syncInfo[path];
            if (info.status === 'RUNNING') {
                payload[path] = {...info};
                count = count + 1;
            }
        });

        if (count) {
            axios.post('/api/syncer/progress', payload)
                .then(resp => {
                    const data = resp.data;
                    this.setState({
                        syncInfo: {...this.state.syncInfo, ...data}
                    });
                })
                .catch(e => {
                    console.log(e);
                });
        }
        else {
            if (this.interval) clearInterval(this.interval);
            this.interval = null;
        }
    }

    componentDidMount() {
        const {selectedDir, recursive} = this.props;
        this.asyncGetSampleFiles(selectedDir, recursive);
    }

    componentWillReceiveProps(nextProps) {
        const {selectedDir, recursive} = nextProps;
        const isSameDir = selectedDir === this.props.selectedDir;
        const isSameMode = recursive === this.props.recursive;
        if (!(isSameDir && isSameMode))
            this.asyncGetSampleFiles(selectedDir, recursive);
    }

    componentWillUnmount() {
        if (this.props.updateSyncInfo) {
            this.props.updateSyncInfo({...this.state.syncInfo});
        }
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    handleStart = () => {
        // const { file_dir_map, dir_file_map } = this.state;

        // let err = false;
        // Object.keys(file_dir_map).forEach(file => {
        //     if (file_dir_map[file].sep.length == 0)
        //         err = true;
        // });

        // if (err) {
        //     this.setState({err});
        //     return;
        // }

        // const payload = {};
        // Object.keys(dir_file_map).forEach(dir => {
        //     const file = dir_file_map[dir];
        //     payload[dir] = file_dir_map[file].sep;
        // });

        // axios.post('/api/syncer/start', payload)
        //     .then(resp => {
        //         console.log(resp.data)
        //         // update state && store (syncer id)
        //     })
        //     .catch(e => {
        //         console.log(e);
        //     })

        // this.setState({err});
    }

    handleSeparatorChange = (path, new_sep) => {
        new_sep = new_sep.replace(/ /g, "");
        const { syncInfo } = this.state;
        if (syncInfo.hasOwnProperty(path)) {
            syncInfo[path].sep = new_sep;
            syncInfo[path].group_name = 
                syncInfo[path].file_name.split(new_sep)[0];
            this.setState({syncInfo});
        }
    }

    handleGroupNameChange = (path, new_name) => {
        new_name = new_name.replace(/ /g, "");
        const { syncInfo } = this.state;
        if (syncInfo.hasOwnProperty(path)) {
            syncInfo[path].group_name = new_name;
            this.setState({syncInfo});
        }
    }

    handleStartSync = (e, path) => {
        const { syncInfo } = this.state;
        if (syncInfo.hasOwnProperty(path)) {
            if (syncInfo[path].group_name != null) {
                
                const payload = {[path]: syncInfo[path]}
                axios.post('/api/syncer/start', payload)
                    .then(resp => {
                        // override
                        const data = resp.data;
                        this.setState({
                            syncInfo: {...this.state.syncInfo, ...data}
                        }, () => {
                            if (this.interval == null) {
                                this.interval = setInterval(
                                    this.asyncSyncProgress,
                                    SYNC_PROGRESS_INTERVAL
                                );
                            }
                        });
                    })
                    .catch(e => {
                        console.log(e)
                    });

            }
        }
    }

    handleNodeDelete = (e, path) => {
        const { syncInfo } = this.state;
        if (syncInfo.hasOwnProperty(path)) {
            delete syncInfo[path];
            this.setState({syncInfo});
        }
    }

    renderUnqueued = () => {
        const { syncInfo } = this.state;

        const items = Object.keys(syncInfo)
                .map(path => {
                    const info = syncInfo[path];
                    return <li>
                        <SyncNode 
                            key={path}
                            code={path}
                            {...info}
                            onGroupNameChange={this.handleGroupNameChange}
                            onSeparatorChange={this.handleSeparatorChange}
                            onStartSync={this.handleStartSync}
                            onNodeDelete={this.handleNodeDelete}
                        />
                    </li>;
                });

        return (
            <div className={classNames(theme.syncview)}> 
                <ul>
                    {items}
                </ul>
            </div>
        );
    }

    render() {
        const {active, close} = this.props;
        return (
            <Dialog
                active={active}
                actions={[
                    {label: 'CLOSE', onClick: close}
                ]}
                onEscKeyDown={close}
                onOverlayClick={close}
                title={'Syncronize DB with filesystem'}
                theme={dialogTheme}
            >
                {this.renderUnqueued()}
                {/* {this.renderProgress()} */}
                {/* when syncer is not running */}
                {/* <p><span style={{color: err ? "red": "black"}}>Set missing separators</span></p> */}
                {/* {this.renderSampleFiles()} */}

                {/* when syncer is running */}
            </Dialog>
        );
    }
}

export default SyncView;