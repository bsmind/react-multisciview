import React from 'react';
import axios from 'axios';
import {Dialog, Input} from 'react-toolbox';
import dialogTheme from './dialog.css';

class SyncView extends React.Component {
    constructor() {
        super();
        this.state = {
            dir_file_map: {},
            file_dir_map: {},
            err: false
        };
    }

    asyncGetSampleFiles = (wdir, recursive) => {
        if (wdir == null) return;

        const payload = {wdir, recursive};
        axios.post('/api/syncer/samples', payload)
            .then(resp => {
                const dir_file_map = resp.data;
                const file_dir_map = {};
                Object.keys(dir_file_map).forEach(dir => {
                    const file = dir_file_map[dir];
                    file_dir_map.hasOwnProperty(file) 
                        ? file_dir_map[file].d.push(dir)
                        : file_dir_map[file] = {d: [dir], sep: ''};
                });

                this.setState({dir_file_map, file_dir_map});
            })
            .catch(e => {
                console.log(e);
            });
    }

    componentDidMount() {
        const {selectedDir, recursive, active} = this.props;
        this.asyncGetSampleFiles(selectedDir, recursive);
    }

    componentWillReceiveProps(nextProps) {
        const {selectedDir, recursive} = nextProps;
        if ((selectedDir !== this.props.selectedDir ||
            recursive !== this.props.recursive))
            this.asyncGetSampleFiles(selectedDir, recursive);
    }

    handleStart = () => {
        const { file_dir_map, dir_file_map } = this.state;

        let err = false;
        Object.keys(file_dir_map).forEach(file => {
            if (file_dir_map[file].sep.length == 0)
                err = true;
        });

        if (err) {
            this.setState({err});
            return;
        }

        const payload = {};
        Object.keys(dir_file_map).forEach(dir => {
            const file = dir_file_map[dir];
            payload[dir] = file_dir_map[file].sep;
        });

        axios.post('/api/syncer/start', payload)
            .then(resp => {
                console.log(resp.data)
                // update state && store (syncer id)
            })
            .catch(e => {
                console.log(e);
            })

        this.setState({err});
    }

    handleSeparator = (file, sep) => {
        const { file_dir_map } = this.state;
        file_dir_map[file].sep = sep.replace(/ /g, "");
        this.setState({file_dir_map});
    }

    renderSampleFiles = () => {
        const { file_dir_map } = this.state;
        
        function _parse(_fn, _sep) {
            return _fn.split(_sep)[0];
        }

        const rows = Object.keys(file_dir_map).map(file => {
            const item = file_dir_map[file];
            return (
                <div>
                    <div style={{display: 'inline-block', width: '60%', paddingRight: '15px'}}>
                        <Input 
                            key={`${file}-before`}
                            label={'before'}
                            value={file}
                            readOnly={true}
                        />
                    </div>
                    <div style={{display: 'inline-block', width: '15%', paddingRight: '15px'}}>
                        <Input 
                            key={`${file}-sep`}
                            label={'separator'}
                            value={item.sep}
                            onChange={this.handleSeparator.bind(this, file)}
                        />
                    </div>
                    <div style={{display: 'inline-block', width: '25%', paddingRight: '0px'}}>
                        <Input 
                            key={`${file}-after`}
                            label={'after'}
                            value={_parse(file, item.sep)}
                            readOnly={true}
                        />
                    </div>
                </div>
            );
        });

        return rows;
    }

    render() {
        const {active, close} = this.props;
        const { err } = this.state;
        return (
            <Dialog
                active={active}
                actions={[
                    {label: 'START', onClick: this.handleStart},
                    {label: 'CLOSE', onClick: close}
                ]}
                onEscKeyDown={close}
                onOverlayClick={close}
                title={'Syncronize DB with filesystem'}
                theme={dialogTheme}
            >
                <p><span style={{color: err ? "red": "black"}}>Set missing separators</span></p>
                {this.renderSampleFiles()}
            </Dialog>
        );
    }
}

export default SyncView;