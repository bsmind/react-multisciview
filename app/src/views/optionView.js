import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import {Tab, Tabs} from "react-toolbox";
import {
    DataTab,
    CoordTab,
    ImageTab,
    PcpTab,
    SettingTab
} from "./components";

class OptionView extends React.Component {
    constructor() {
        super();
        this.state = {
            tabIndex: 1,
        };
    }

    handleTabChange = (idx) => {
        this.setState({tabIndex: idx});
    }

    render() {
        return (
            <Tabs fixed
                style={{outline: "none"}}
                index={this.state.tabIndex}
                onChange={this.handleTabChange}
            >
                <Tab label="SETTING">
                    <SettingTab />
                </Tab>
                <Tab label="DATA"> 
                    <DataTab height={this.props.height}/> 
                </Tab>
                <Tab label="COORD/IMAGE"> 
                    <CoordTab />
                    <ImageTab /> 
                </Tab>
                <Tab label="PCP"> 
                    <PcpTab 
                        ref={"PCPTabRef"}
                        onPCPAxisSelect={this.props.onPCPAxisSelect}
                        dataExtents={this.props.dataExtents || {}}
                    /> 
                </Tab>
            </Tabs>
        );
    }
}

export default connect(null, null, null, {withRef: true})(OptionView);