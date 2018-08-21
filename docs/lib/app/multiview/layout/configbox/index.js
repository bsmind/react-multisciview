import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import {
	getAttrX,
	getAttrY,
	getAttrZ,
	getAttrKinds,
	getSampleKinds,
	getSelectedSampleColors,
	getSampleColorOpacity,
	getSelectedSampleKeys,
	getShowImageSwitch,
	getMinPoints,
	getMinImageSize,
	// for pcp
	getSelectedDataArray,
	getPCPSelectedDimension,
	// for colorScheme
	getColorScheme,
	// for image
	getImageDomain,
	getImageColorInterpolator
	//getImageColorTable
} from "../../selectors";

import {
	addSelectedSamples,
	delSelectedSamples,
	changeSelectedSampleColors,
	setImageDomain,
	changeImgColorScheme
} from "../../actions/dataActions";

import {
	setAttr,
	setSwitch,
	setSlider,
	updateAttrSelect,
	setZColorScheme,
	setZColorDomain,
} from "../../actions/visActions";

import { Tab, Tabs } from "react-toolbox";
import DataTab from "./DataTab";
import ScatterTab from "./ScatterTab";
import PcpTab from "./pcpTab";
import ImageTab from "./ImageTab";


class ConfigBox extends React.Component {
	constructor() {
		super();
		this.state = {
			index: 0,
		};
	}

    handleTabChange = (index) => {
    	this.setState({ index });
    }

    handleAttrChange = (dim, value) => {
    	if (value.length === 0) return;
    	const {
    		attr,
    		attrFormat,
			attrKinds,
    	} = this.props;

		const oldAttr = attrFormat(attr[dim]);
    	if (value !== oldAttr && this.props.setAttr) {
    		const attrKeys = Object.keys(attrKinds);
    		const index = attrKeys.findIndex(key => key.includes(value));
    		this.props.setAttr(dim, attrKeys[index]);
		}
    }

    render() {
    	return (
    		<Tabs fixed
    			style={{ outline: "none" }}
    			index={this.state.index}
    			onChange={this.handleTabChange}>
    			<Tab label="DATA">
    				<DataTab
    					height={this.props.height}
    					samples={this.props.sampleKinds}
    					sampleSelected={this.props.sampleSelected}
    					sampleColors={this.props.sampleColors}
    					sampleColorOpacity={this.props.sampleColorOpacity}
    					onColorChange={this.props.changeSelectedSampleColors}
    					onSampleAdd={this.props.addSelectedSamples}
    					onSampleDel={this.props.delSelectedSamples}
    				/>
    			</Tab>
    			<Tab label="AXIS">
    				<ScatterTab
						width={this.props.width}
    					attrKinds={this.props.attrKinds}
    					attr={this.props.attr}
						attrFormat={this.props.attrFormat}
						zColorScheme={this.props.zColorScheme}
    					onAttrChange={this.handleAttrChange}
    					onSwitchChange={this.props.setSwitch}
						onSliderChange={this.props.setSlider}
						onColorSchemeChange={this.props.setZColorScheme}
						onColorDomainChange={this.props.setZColorDomain}
    				/>
    			</Tab>
				<Tab label="IMAGE">
					<ImageTab
    					showImage={this.props.showImage}
    					minPoints={this.props.minPoints}
    					minImageSize={this.props.minImageSize}
    					onSwitchChange={this.props.setSwitch}
						onSliderChange={this.props.setSlider}
					
						imgMinDomain={this.props.imgMinDomain}
						imgMaxDomain={this.props.imgMaxDomain}
						imgDomain={this.props.imgDomain}
						imgColorScheme={this.props.imgColorScheme}
						imgColorInterpolator={this.props.imgColorInterpolator}
						postProcessor={this.props.getOrigImgValue}
						onImageDomainChange={this.props.setImageDomain}
						onImgColorSchemeChange={this.props.changeImgColorScheme}
					/>
				</Tab>
    			<Tab label="PCP">
    				<PcpTab
    					ref={"PCPTabRef"} // eslint-disable-line
    					dimKinds={this.props.attrKinds}
    					dimOrder={this.props.dimOrder}
    					dimension={this.props.dimension}
    					data={this.props.data}
    					attrFormat={this.props.attrFormat}
    					zAttr={this.props.attr.z}
						colorsBySampleNames={this.props.sampleColors}
						colorScheme={this.props.zColorScheme}
    					onColorAttrChange={this.handleAttrChange}
    					onAttrSelectChange={this.props.updateAttrSelect}
    					onPCPAxisSelect={this.props.onPCPAxisSelect}
    					// pcpAttrSelect={this.props.pcpAttrSelect}
    					dataExtents={this.props.dataExtents}
    				/>
    			</Tab>
    		</Tabs>
    	);
    }
}

function mapStateToProps(state) {
	const { data, extents: dimension } = getSelectedDataArray(state);
	const pcpDimension = getPCPSelectedDimension(state);

	//console.log(getImageColorTable(state));
	//getImageColorInterpolator(state);

	return {
		sampleKinds: getSampleKinds(state),
		sampleColors: getSelectedSampleColors(state),
		sampleColorOpacity: getSampleColorOpacity(state),
		sampleSelected: getSelectedSampleKeys(state),

		attrKinds: getAttrKinds(state),
		attr: {
			x: getAttrX(state),
			y: getAttrY(state),
			z: getAttrZ(state)
		},
		attrFormat: state.data.attrFormat,

		showImage: getShowImageSwitch(state),
		minPoints: getMinPoints(state),
		minImageSize: getMinImageSize(state),
		imgMinDomain: state.data.imgMinDomain,
		imgMaxDomain: state.data.imgMaxDomain,
		imgDomain: getImageDomain(state),
		imgColorScheme: state.data.imgColorScheme,
		imgColorInterpolator: getImageColorInterpolator(state),
		getOrigImgValue: state.data.getOrigImgValue,

		// for pcp
		dimOrder: pcpDimension,
		dimension: dimension,
		data,

		// color Scheme
		zColorScheme: getColorScheme(state),
	};
}

function mapDispatchToProps(dispatch) {
	return bindActionCreators({
		addSelectedSamples,
		delSelectedSamples,
		changeSelectedSampleColors,
		setAttr,
		setSwitch,
		setSlider,
		updateAttrSelect,
		setZColorScheme,
		setZColorDomain,
		setImageDomain,
		changeImgColorScheme
	}, dispatch);
}

ConfigBox.propTypes = {
	attr: PropTypes.object,
	attrFormat: PropTypes.func,
	attrKinds: PropTypes.object,
	setAttr: PropTypes.func,
	sampleKinds: PropTypes.array,
	sampleSelected: PropTypes.array,
	sampleColors: PropTypes.object,
	sampleColorOpacity: PropTypes.number,
	changeSelectedSampleColors: PropTypes.func,
	addSelectedSamples: PropTypes.func,
	delSelectedSamples: PropTypes.func,
	showImage: PropTypes.bool,
	minPoints: PropTypes.number,
	minImageSize: PropTypes.number,
	setSwitch: PropTypes.func,
	setSlider: PropTypes.func,
	dimOrder: PropTypes.array,
	dimension: PropTypes.object,
	data: PropTypes.array,
	updateAttrSelect: PropTypes.func,
	onPCPAxisSelect: PropTypes.func,
	dataExtents: PropTypes.object,
	height: PropTypes.number
};

export default connect(mapStateToProps, mapDispatchToProps, null, { withRef: true })(ConfigBox);