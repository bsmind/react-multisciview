import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import {
    get_current_data_stat,
    monitor_new_data,
    get_color_map,
} from "./actions/dataActions";

import { Layout, Panel } from "react-toolbox/lib/layout";
import { AppBar } from "react-toolbox/lib/app_bar";
import { Button } from "react-toolbox/lib/button";
import Navigation from "react-toolbox/lib/navigation";
import theme from "./appIndex.css";

import OptionView from "./views/optionView";
import ScatterView from "./views/scatterView";

class MultiViewApp extends React.Component {
    constructor(){
        super();
        this.state = {
            width: 0,
            height: 0,
        };

        this.pcpAttrSelect = {};
        this.__dataExtents = {};
    }

    componentWillMount() {
        this.handleResize();
    }

    componentDidMount() {
        // --------------------------------------------------------
        // Query for initial DB conditions
        // --------------------------------------------------------
        this.props.get_current_data_stat();
        this.props.get_color_map();
        this.interval = setInterval(this.props.monitor_new_data, 20000);
        // --------------------------------------------------------
        window.addEventListener("resize", () => this.handleResize());
    }

    componentWillUnmount() {
        clearInterval(this.interval);
        window.removeEventListener("resize", () => this.handleResize());
    }

    handleResize = () => {
        let w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        let h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

        const app_bar_h = 41.6
        h = h - app_bar_h

        this.setState({width: w, height: h});
    }

    handlePCPAxisSelect = (axisTitle, domain, inProgress, aux) => {
        const ScatterViewRef = this.refs["ScatterViewRef"].getWrappedInstance();
        const ScatterChartRef = ScatterViewRef.refs["ScatterChartRef"].getWrappedInstance();
        const ScatterCanvasNode = ScatterChartRef.getScatterChartCanvasNode();
        ScatterCanvasNode.handleByOther({
            what: "extents",
            data: {[axisTitle]: domain.slice()},
            inProgress
        });
        this.pcpAttrSelect[axisTitle] = {
            domain: domain.slice(),
            auxiliary: aux ? aux.slice() : null
        };
        this.__dataExtents[axisTitle] = domain.slice();
    }

    handleScatterPanZoom = (newDataExtents, inProgress) => {
        Object.keys(newDataExtents).forEach(key => {
            this.__dataExtents[key] = newDataExtents[key].slice();
        });
        const OptionViewRef = this.refs["OptionViewRef"].getWrappedInstance();
        if (OptionViewRef.refs["PCPTabRef"]) {
            const PCPTabRef = OptionViewRef.refs["PCPTabRef"].getWrappedInstance();
            const PCPChartRef = PCPTabRef.refs["PCPChartRef"];
            const PCPNode = PCPChartRef.node;
            const PCPCanvasRef = PCPNode.refs["PCPCanvasRef"];
            PCPCanvasRef.handleByOtherFull(this.__dataExtents, inProgress);
        }
    }

    renderHeader = () => {
        const imgReqOnProgress = this.props.imgReqOnProgress;
        return (
            <Panel>
                <AppBar title="React-MultiSciView"
                        leftIcon="menu" onLeftIconClick={null} theme={theme} fixed flat
                >
                    <Navigation type="horizontal">
                        <ul style={{listStyle: 'none'}}>
                                {imgReqOnProgress > 0 &&
									<li className={theme.hLi}>
										<Button icon='cloud_upload' label={`${imgReqOnProgress}`} accent />
									</li>									
								}                        
                            <li className={theme.hLi}>
                                <a style={{textDecoration: 'none'}}
                                    href="https://github.com/ComputationalScienceInitiative/react-multiview"
                                    target="_blank"
                                >
                                    Github
                                </a>
                            </li>
                        </ul>
                    </Navigation>
                </AppBar>
            </Panel>
        );
    }

    renderOptionView = (height) => {
        return <OptionView 
            ref={"OptionViewRef"}
            height={height} 
            onPCPAxisSelect={this.handlePCPAxisSelect}
            dataExtents={this.__dataExtents}
        />;
    }

    renderScatterView = (width, height) => {
        return <ScatterView
            ref={"ScatterViewRef"}
            width={width}
            height={height}
            onScatterPanZoom={this.handleScatterPanZoom}
        />;
    }

    render() {
        const {width, height} = this.state;
        const l_width = Math.min(Math.floor(0.6 * width), Math.floor(height))
        const r_width = Math.floor(width - l_width)
        const {imgReqOnProgress, showImage} = this.props;
        return (
            <Layout>
                {this.renderHeader()}

				{imgReqOnProgress > 0 && showImage &&
					<div 
						className={theme.myProgressBarWithAnimation} 
						style={{position: 'absolute'}} 
					/>
				}
                
                <div className={theme.chartbox}>
                    <div style={{width: l_width, float: "left"}}>
                        {this.renderScatterView(l_width, l_width)}
                    </div>
                    <div style={{marginLeft: l_width}}>
                        {this.renderOptionView(height)}
                    </div>
                </div>
            </Layout>
        );
    }
}

function mapStateToProps(state) {
    return {
        imgReqOnProgress: state.data.numImageRequested,
        showImage: state.data.showImage,
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        get_current_data_stat,
        monitor_new_data,
        get_color_map,
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps, null, {withRef: true})(MultiViewApp);




