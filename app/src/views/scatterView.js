import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import {
    getSelectedSamples,
    getSelectedSampleColors,
    getDataStat,
    getScatterColorScheme,
    getImageColorTable,
    getDataArray
} from "../selectors";
import {
    get_tiff_with_priority
} from "../actions/dataActions";

import { ScatterChart } from "./components"

class ScatterView extends React.Component {
    handleDataImageRequest = (data, priority = 3) => {
        const { imgPool } = this.props;
        const id = data._id;
        const path = data.path;

        if (id == null || path == null) {
            console.log('Invlid image request: ', data);
            return;
        }

    	if (this.props.get_tiff_with_priority && imgPool[id] == null)
    		this.props.get_tiff_with_priority(id, path, priority);
    }
    
    render() {
        const margin = {left: 60, right: 10, top: 30, bottom: 40};
        const chartProps = {
            ...this.props,
            margin,
            onDataRequest: this.handleDataImageRequest,
            onSelectDataItems: null,
        };

        return <ScatterChart 
            ref={"ScatterChartRef"}
            {...chartProps}
        />;
    }
}

function mapStateToProps(state) {
    return {
        xAttr: state.data.attrx,
        yAttr: state.data.attry,
        zAttr: state.data.attrz,
        colorsByGroup: getSelectedSampleColors(state),

        seriesName: 'seriesname', // deprecated
        samples: getSelectedSamples(state),
        data: getDataArray(state),
        dimension: getDataStat(state),

        imgPool: state.data.imgPool,
        opacity: state.data.scatterColorOpacity,
        showImage: state.data.showImage,
        minPoints: state.data.minPoints,
        minImageSize: state.data.minImageSize,
        colorScheme: getScatterColorScheme(state),
        imageColorTable: getImageColorTable(state),
    };
}

function mapDispatchToProps(dispatch){
    return bindActionCreators({
        get_tiff_with_priority
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps, null, {withRef: true})(ScatterView);