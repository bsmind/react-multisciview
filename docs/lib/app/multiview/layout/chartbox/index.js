import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import get from 'lodash.get';

import theme from './index.css';

import {
    ScatterChart,
    ParallelCoordinateChart
} from './charts';


import Test from './charts/ScatterMarkerProvider';

import {
    test,
    getSelectedDataArray,
    getSelectedSortedDataArray,
    getSelectedDataObject,
    getXAccessor,
    getYAccessor,
    getZAccessor,
    getSelectedSampleNames,
    getColorsBySampleNames,
    getXScale,
    getYScale,
    getXType,
    getYType,
    getAttrX,
    getAttrY,

    getPCPDimension,
    getPCPData,
} from './selector';


class ChartBox extends React.Component {

    renderScatterChart = (h) => {
        const {
            children, height,
            selectedSampleNames, 
            sampleAccessor,
            colorsBySampleNames,
            ...rest
        } = this.props;

        return <ScatterChart
            height={h}
            groups={selectedSampleNames}
            groupAccessor={sampleAccessor}
            colorsByGroup={colorsBySampleNames}
            {...rest}
        />

    }

    renderParallelCoordinateChart = (h) => {
        const {
            pcpDimension,
            pcpData,
            colorsBySampleNames,
            sampleAccessor,
            attrFormat
        } = this.props;
       //console.log(pcpDimension)
       //console.log(pcpData)
        return <ParallelCoordinateChart
            height={h}
            data={pcpData}
            dimension={pcpDimension}
            colorsByGroup={colorsBySampleNames}
            groupAccessor={sampleAccessor}
            titleFormat={attrFormat}
        />
    }

    render() {
        const { height } = this.props;
        const scatterHeight = height / 2;
        const pcpHeight = height - scatterHeight;
        return (
            <div className={this.props.className}>
                {/* {this.renderScatterChart(scatterHeight)} */}
                {this.renderParallelCoordinateChart(pcpHeight)}
            </div>
        );
    }
}

ChartBox.propTypes = {};
ChartBox.defaultProps = {};


function mapStateToProps(state) {
    const { data, xExtents, yExtents } = getSelectedSortedDataArray(state);

    //test(state)
   // const pcpDimension = getPCPDimension(state);
    
    //console.log(getColorsBySampleNames(state))
    //const pcpData = getPCPData(state);
    const {
        data: pcpData,
        extents: pcpExtents
    } = getSelectedDataArray(state);

    return {
        data,
        xExtents,
        yExtents,
        xAttr: getAttrX(state),
        yAttr: getAttrY(state),
        xAccessor: getXAccessor(state),
        yAccessor: getYAccessor(state),
        zAccessor: getZAccessor(state),
        xScale: getXScale(state),
        yScale: getYScale(state),
        xType: getXType(state),
        yType: getYType(state),
        selectedSampleNames: getSelectedSampleNames(state),
        colorsBySampleNames: state.data.sampleColors,//getColorsBySampleNames(state),
        attrFormat: state.data.attrFormat,
        sampleAccessor: d => d.sample,

        pcpDimension: pcpExtents,
        pcpData: pcpData
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({

    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ChartBox);
