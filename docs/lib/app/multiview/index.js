import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import {
	getColorMap,
	getSampleKinds,
	getAttributes,
	AddData,
	handleColorChange,
	updateSelectedSamples,
	imageRequestOnProgress
} from "./actions/dataActions";

import {
	setAttr
} from "./actions/visActions";

import { Layout, Panel } from "react-toolbox/lib/layout";
import { AppBar } from "react-toolbox/lib/app_bar";
import Navigation from "react-toolbox/lib/navigation";
import Link from "react-toolbox/lib/link";
import { Button } from 'react-toolbox/lib/button';
import { NavDrawer } from 'react-toolbox';

import { ConfigBox, ScatterBox } from "./layout";

import theme from "./index.css";
import get from "lodash.get";



class MultiViewApp extends React.Component {
	constructor() {
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
		this.props.getSampleKinds();
		this.props.getAttributes();
		this.props.getColorMap();

		window.addEventListener("resize", () => this.handleResize());
	}

	componentWillUnmount() {
		window.removeEventListener("resize", () => this.handleResize());
	}

	shouldComponentUpdate() {
		// if (nextProps.isDataLoading)
		//     return false;
		return true;
	}

    handleResize = () => {
    	const width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    	let height = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    	// width = width;
    	height = height - 41.6;// - 56.81;// - 4.15;

    	this.setState({ width, height });
    }

    handleSampleChange = (action, keys) => {
    	this.props.AddDelSamples(action, keys);

    	const sampleNames = keys.map(key => this.props.sampleKinds[key]);
    	this.props.AddData(action, sampleNames);
    }

    handleAttrChange = (dim, value) => {
    	if (value.length === 0) return;
    	const {
    		attr,
    		attrFormat,
    		attrKinds
    	} = this.props;

    	const oldAttr = attrFormat(get(attr, dim));
    	if (value !== oldAttr && this.props.setAttr) {
    		const attrKeys = Object.keys(attrKinds);
    		const index = attrKeys.findIndex(key => key.includes(value));
    		// console.log(attrKinds[attrKeys[index]])
    		this.props.setAttr(dim, attrKeys[index]);
    	}
    }

    handleToolChange = (toolid) => {
    	this.setState({ toolSelected: toolid });
    }

    handleSampleUpdate = (doUpdate, selected, colors) => {
    	if (doUpdate && this.props.updateSelectedSamples) {
    		this.props.updateSelectedSamples(selected, colors);
    	}
    	this.setState({ showDataDialog: !this.state.showDataDialog });
    }

    onToggleDataDialog = () => {
    	this.setState({ showDataDialog: !this.state.showDataDialog });
    }

    // update scatter plot by pcp
    handlePCPAxisSelect = (axisTitle, domain, inProgress, aux) => {
    	const ScatterBoxRef = this.refs["ScatterBoxRef"].getWrappedInstance(); // eslint-disable-line
    	const ScatterChartRef = ScatterBoxRef.refs["ScatterChartRef"].getWrappedInstance();
    	const ScatterCanvasNode = ScatterChartRef.getScatterChartCanvasNode();
    	ScatterCanvasNode.handleByOther({
    		what: "extents",
    		data: { [axisTitle]: domain.slice() },
    		inProgress }
    	);
    	this.pcpAttrSelect[axisTitle] = {
    		domain: domain.slice(),
    		auxiliary: aux ? aux.slice() : null
    	};
    	this.__dataExtents[axisTitle] = domain.slice();
    }

    // todo: update pcp by scatter plot
    handleScatterPanZoom = (newDataExtents, inProgress) => {
    	Object.keys(newDataExtents).forEach(key => {
    		this.__dataExtents[key] = newDataExtents[key].slice();
    	});

    	const ConfigBoxRef = this.refs["ConfigBoxRef"].getWrappedInstance(); // eslint-disable-line
    	if (ConfigBoxRef.refs["PCPTabRef"]) {
    		const pcpNode = ConfigBoxRef.refs["PCPTabRef"].refs["PCPChartRef"].node.refs["PCPCanvasRef"];
    		pcpNode.handleByOtherFull(this.__dataExtents, inProgress);
    	}
    }



    render() {
		const { width, height } = this.state;
		const { showImage } = this.props;

		const scatterBoxWidth = Math.min(Math.floor(0.6 * width), Math.floor(height));
		const configBoxWidth = Math.floor(width - scatterBoxWidth);

		const imgReqOnProgress = imageRequestOnProgress();
    	return (
    		<Layout>
				<NavDrawer active={True}
					pinned={False} permanentAt='xxxl'
					onOverlayClick={null}
				>
					<p>
						Navigation, account switcher, etc, go here
					</p>
				</NavDrawer>
    			<Panel>
					<AppBar title="React-MultiView" 
						leftIcon="menu" onLeftIconClick={null} 
						theme={theme} fixed flat 
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
										href="https://github.com/ComputationalScienceInitiative/react-multiview" target="_blank">
										Github
									</a>
								</li>
							</ul>
						</Navigation>
					</AppBar>
    			</Panel>

				{imgReqOnProgress > 0 && showImage &&
					<div 
						className={theme.myProgressBarWithAnimation} 
						style={{position: 'absolute'}} 
					/>
				}

    			<div className={theme.chartbox}>
    				<div style={{ width: scatterBoxWidth, float: "left" }}>
    					<ScatterBox
    						ref={"ScatterBoxRef"} // eslint-disable-line
    						width={scatterBoxWidth} height={scatterBoxWidth}
    						onScatterPanZoom={this.handleScatterPanZoom}
    					/>
    				</div>
    				<div style={{ marginLeft: scatterBoxWidth }}>
    					<ConfigBox
							ref={"ConfigBoxRef"} // eslint-disable-line
							height={height}
							width={configBoxWidth}
    						onPCPAxisSelect={this.handlePCPAxisSelect}
    						// pcpAttrSelect={this.pcpAttrSelect}
    						dataExtents={this.__dataExtents}
    					/>
    				</div>
    			</div>
    		</Layout>
    	);
    }
}

function mapStateToProps(state) {
	return {
		sampleKinds: state.data.sampleKinds,
		sampleColors: state.data.sampleColors,
		sampleColorOpacity: state.data.sampleColorOpacity,
		sampleSelected: state.data.samples,
		attrKinds: state.data.attrKinds,
		attrFormat: state.data.attrFormat,

		attr: {
			x: state.vis.attrx,
			y: state.vis.attry,
			z: state.vis.attrz
		},

		isDataLoading: state.data.numQueried > 0,
		showImage: state.vis.showImage
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({
		getSampleKinds,
		getAttributes,
		AddData,
		setAttr,
		handleColorChange,
		updateSelectedSamples,
		getColorMap
	}, dispatch);
}

MultiViewApp.propTypes = {
	getSampleKinds: PropTypes.func,
	getAttributes: PropTypes.func,
	getColorMap: PropTypes.func,

};

export default connect(mapStateToProps, mapDispatchToProps, null, { withRef: true })(MultiViewApp);
