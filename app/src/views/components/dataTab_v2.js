import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import axios from "axios";

import Autocomplete from "react-toolbox/lib/autocomplete";
import { Button } from "react-toolbox/lib/button";
import { List, ListItem, ListSubHeader } from "react-toolbox/lib/list";
import DBView from "./dbview";
import DataMgrView from "./dataMgrView";
import theme from "./index.css"

import { sortAlphaNum } from "../../utils";
import { hexToRGBA } from "react-multiview/lib/utils";
import throttle from "lodash.throttle";

import {
    get_data,
    del_data,
    changeSelectedSampleColors,
    setValue
} from "../../actions/dataActions";

import {
    getSelectedSamples,
    getSelectedSamplesCounts
} from "../../selectors";

const THROTTLE_INTERVAL = 100;

const DataListItem = (props) => {
	const { id, name, color, onColorChange, onItemDelete, count } = props;
    const leftBtnStyle = { 
        minWidth: "10px", maxHeight: "10px", 
        backgroundColor: color ? color : "#000000" 
    };
	const rightBtnStyle = { minWidth: "10px" };
	return <ListItem theme={theme}
		caption={name}
        leftActions={[
            <Button key={`btn-l-${id}`} raised style={leftBtnStyle} 
                    onClick={() => onColorChange([name])}/>
        ]}
		rightActions={[
            <b>{count}</b>,                           
            <Button key={`btn-r-${id}`} icon="delete" style={rightBtnStyle} 
                onClick={() => onItemDelete([name])} />,
        ]}
	/>;
}


class DataTab extends React.Component {
    constructor() {
        super();
        this.state = {
            sampleList: []
        }

        this.q_sample = null;
        this.asyncUpdateSampleList = throttle(
            this.asyncUpdateSampleList, 
            THROTTLE_INTERVAL,
            {'leading': true, 'trailing': true}
        );
    }

    asyncUpdateSampleList = (props = this.props) => {
        const {wdir, isRecursive} = props;
        if (wdir == null) {
            return;
        }

        const { 
            sampleSelected, 
            sampleSelectedCounts,
        } = props;

        const payload = {
            path: wdir,
            recursive: isRecursive
        }

        axios.post("/api/data/samplelist", payload)
            .then(resp => {
                // if the number of samples are different, add samples.
                const data = resp.data;
                const sampleList = [];
                const samplesToAdd = Object.keys(data).map(key => {
                    const count = data[key];

                    sampleList.push({
                        '_id': key,
                        'count': count
                    });

                    const idx = sampleSelected.indexOf(key);
                    if (idx >= 0 && sampleSelectedCounts[idx] != count) {
                        return key;
                    }
                }).filter(d => d!=null);

                this.setState({sampleList}, () => {
                    if (samplesToAdd.length && props.onSampleAdd) {
                        props.onSampleAdd(samplesToAdd, wdir, isRecursive);
                    }
                });
            })
            .catch(e => {
                console.log(e)
            });
    }

    componentDidMount() {
        this.asyncUpdateSampleList()
    }

    componentWillReceiveProps(nextProps) {
        this.asyncUpdateSampleList(nextProps)
    }

    addSamples = (keyArray) => {
        const { sampleList } = this.state;
        const { sampleSelected, wdir, isRecursive } = this.props;

        const samplesToAdd = keyArray.map(key => {
            const {_id, count} = sampleList[key];
            if (sampleSelected.indexOf(_id) === -1) 
                return _id;
        }).filter(d => d != null);

        if (samplesToAdd.length && this.props.onSampleAdd) {
            this.props.onSampleAdd(samplesToAdd, wdir, isRecursive);
        }
    }

    handleAddAll = () => {
        const { sampleList } = this.state;
        const { sampleSelected } = this.props;
        const samplesToAdd = sampleList.map( sample => {
            const {_id, count} = sample;
            if (sampleSelected.indexOf(_id) == -1)
                return _id;
        }).filter(d => d != null);

        const { wdir, isRecursive, onSampleAdd} = this.props;
        if (onSampleAdd) {
            onSampleAdd(samplesToAdd, wdir, isRecursive);
        }
    }

    handleDelAll = () => {
        const { sampleSelected } = this.props;
        if (sampleSelected.length && this.props.onSampleDel) {
            this.props.onSampleDel(sampleSelected);
        }
    }

    handleSampleChange = (_, event) => {
        const targetID = event.target.id;
        const enterKey = event.which != null && event.which === 13;
        const validQuery = this.q_sample != null && this.q_sample.length;
        
        if (targetID != null && targetID.length) {
            this.addSamples([targetID]);
        } else if (enterKey && validQuery) {
            const query = this.q_sample.trim().replace(/ /g, "_").toUpperCase();
            const indices = this.state.sampleList.map( (sample, idx) => {
                const {_id, count} = sample;
                if (_id.trim().toUpperCase().includes(query))
                    return idx
            }).filter(d => d != null);
            this.addSamples(indices);
        } else {
            console.log("[handleSampleChange] Unexpected cases!")
        }

        this.q_sample = null;
    }

    renderSelectedSamples = () => {
        const { 
            sampleSelected, 
            sampleSelectedCounts,
            sampleColors, 
            onColorChange, 
            onSampleDel 
        } = this.props;
        const opacity = 0.5;
        
        const list = sampleSelected.map((name, idx) => {
            return {
                key: name,
                value: name,
                count: sampleSelectedCounts[idx]
            };
        }).sort( (a, b) => sortAlphaNum(a.value, b.value) );

        return list.map(d => {
            const {key, value, count} = d;
            return <DataListItem 
                key={`item-${value}`} 
                id={key}
                name={value}
                color={ hexToRGBA(sampleColors[value], opacity)}
                count={count}
                onColorChange={onColorChange}
                onItemDelete={onSampleDel}
            />
        });
    }

    renderSampleView = () => {
        const divStyle = {
            display: 'inline-block',
            width: '65%',
            marginRight: '10px'    
        }
        const { sampleList } = this.state;
        const { height, sampleSelected } = this.props;
        const ListHeight = height - 200;

        const samples = {};
        const local_selected = sampleList.map( (sample, idx) => {
            const {_id, count} = sample;
            samples[idx] = `[${count}] ${_id}`;
            if (sampleSelected.indexOf(_id) >= 0)
                return idx;
        }).filter(d => d != null);

        return (
            <div className={theme.tabDiv}>
                <div style={divStyle}>
                    <Autocomplete 
                        direction="down"
                        selectedPosition="none"
                        label="Select samples"
                        suggestionMatch="anywhere"
                        source={samples}
                        value={local_selected}
                        onQueryChange={q => this.q_sample = q}
                        onChange={this.handleSampleChange}
                        theme={theme}
                    />
                </div>
                <div style={{...divStyle, width: '15%', marginRight: '5px'}}>
                    <Button 
                        icon="select_all" 
                        label="ADD ALL" 
                        flat 
                        primary 
                        onClick={this.handleAddAll} 
                    />
                </div>
                <div style={{...divStyle, width: '15%', marginRight: '0px'}}>
                    <Button 
                        icon="clear" 
                        label="DEL ALL" 
                        flat 
                        primary 
                        onClick={this.handleDelAll} 
                    /> 
                </div>
                <List selectable>
                    <ListSubHeader caption={"Selected Samples"} />
                    <div style={{
                        height: `${ListHeight}px`,
                        overflowY: "scroll"
                    }}>
                        {this.renderSelectedSamples()}
                    </div>
                </List>
            </div>
        );
    }

    renderDBView = () => {
        return (
            <div className={theme.tabDiv}>
                <DBView
                    inputLabel="Selected directory"
                    dialogTitle="Select a working directory"
                    disabled={false}
                />
            </div>
        );
    }

    renderDataMgrView = () => {
        return (
            <div className={theme.tabDiv}>
                <DataMgrView />
            </div>
        );
    }

    render() {
        return (
            <div>
                {/* {this.renderDBView()} */}
                {this.renderDataMgrView()}
                {this.renderSampleView()}
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        sampleSelected: getSelectedSamples(state),
        sampleSelectedCounts: getSelectedSamplesCounts(state),
        sampleColors: state.data.sampleColors,
        wdir: state.data.wdir,
        isRecursive: state.data.isRecursive,
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        onSampleAdd: get_data,
        onSampleDel: del_data,
        onColorChange: changeSelectedSampleColors,
        onWdirChange: setValue
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DataTab);