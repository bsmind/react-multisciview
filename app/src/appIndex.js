import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import {
    add_data,
    get_color_map,
    close_message,
} from "./actions/dataActions";

import { Layout, Panel } from "react-toolbox/lib/layout";
import { AppBar } from "react-toolbox/lib/app_bar";
import { Button } from "react-toolbox/lib/button";
import { Snackbar } from "react-toolbox/lib/snackbar";
import Navigation from "react-toolbox/lib/navigation";
import theme from "./appIndex.css";

import OptionView from "./views/optionView";
import ScatterView from "./views/scatterView";

const github="https://github.com/ComputationalScienceInitiative/react-multiview"


class MultiViewApp extends React.Component {
    constructor(){
        super();
        this.state = {
            width: 0,
            height: 0,
        };

        this.pcpAttrSelect = {};
        this.__dataExtents = {};
        this.evtSource = null;
    }

    componentWillMount() {
        this.handleResize();
    }

    componentDidMount() {
        this.props.get_color_map();
        window.addEventListener("resize", () => this.handleResize());

        this.evtSource = new EventSource('/stream');
        this.evtSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (this.props.add_data) {
                this.props.add_data(data);
            }
        }
    }

    componentWillUnmount() {
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
        // console.log('handlePCPAxisSelect: ', axisTitle, domain, inProgress, aux)
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
        //console.log('handleScatterPanZoom: ', newDataExtents, inProgress)
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
                        leftIcon="menu" 
                        onLeftIconClick={null} 
                        theme={theme} 
                        fixed flat
                >
                    <Navigation type="horizontal">
                        <ul style={{listStyle: 'none'}}>
                                {imgReqOnProgress > 0 &&
									<li className={theme.hLi}>
                                        <Button 
                                            icon='cloud_upload' 
                                            label={`${imgReqOnProgress}`} 
                                            accent 
                                        />
									</li>									
								}                        
                            <li className={theme.hLi}>
                                <a style={{textDecoration: 'none'}}
                                    href={github}
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
            dataExtents={this.__dataExtents}
        />;
    }

    render() {
        const {width, height} = this.state;
        const MAX_TABVIEW_WIDTH = 416;
        const r_width = Math.min(Math.floor(0.35 * width), MAX_TABVIEW_WIDTH);
        const l_width = width - r_width;
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
                        {this.renderScatterView(l_width, height)}
                    </div>
                    <div style={{marginLeft: l_width}}>
                        {this.renderOptionView(height)}
                    </div>
                </div>
                <Snackbar 
                    label={this.props.message}
                    action="Dismiss"
                    active={this.props.messageReady}
                    type={this.props.messageType}
                    timeout={60000}
                    onClick={(event, instance) => this.props.close_message()}
                    onTimeout={(event, instance) => this.props.close_message()}
                />
            </Layout>
        );
    }
}

function mapStateToProps(state) {
    return {
        imgReqOnProgress: state.data.numImageRequested,
        showImage: state.data.showImage,
        message: state.data.message,
        messageReady: state.data.messageReady,
        messageType: state.data.messageType
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        add_data,
        get_color_map,
        close_message
    }, dispatch);
}

export default connect(
    mapStateToProps, mapDispatchToProps, 
    null, {withRef: true})(MultiViewApp);




