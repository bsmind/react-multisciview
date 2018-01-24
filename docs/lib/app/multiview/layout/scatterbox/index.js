import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import {
    getAttrX,
    getAttrY,
    getAttrZ,
    getSelectedSampleNames,
    getSelectedSampleColors,
    getSelectedDataArray,
    getImgPool,
    getSampleColorOpacity,
    getShowImageSwitch
} from '../../selectors';

import {
    getTiffWithPriority
} from '../../actions/dataActions';

import { ScatterChart } from '../../charts';


class ScatterBox extends React.Component {
    handleDataImageRequest = (dataID, priority = 3) => {
        const {imgPool} = this.props;
        if (this.props.getTiffWithPriority && imgPool[dataID] == null)
            this.props.getTiffWithPriority(dataID, priority);
    }

    render() {
        const margin = {
            left: 60,
            right: 10,
            top: 30,
            bottom: 40
        };
        const chartProps = {
            ...this.props,
            margin,
            onScatterPanZoom: null,
            onDataRequest: this.handleDataImageRequest,
            onSelectDataItems: null
        }
        return <ScatterChart 
            ref={'ScatterChartRef'}
            {...chartProps} 
        />;
    }
}

function mapStateToProps(state) {
    const {id, samples, data, extents: dimension} = getSelectedDataArray(state);
    //const markerProvider = getMarkerProvider(state);

    return {
        xAttr: getAttrX(state),
        yAttr: getAttrY(state),
        zAttr: getAttrZ(state),
        colorsByGroup: getSelectedSampleColors(state),
        seriesName: id,
        samples,
        data,
        dimension,
        imgPool: getImgPool(state),
        opacity: getSampleColorOpacity(state),
        showImage: getShowImageSwitch(state),
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        getTiffWithPriority
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps, null, {withRef: true})(ScatterBox);
