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
    getPCPData
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
            pcpData
        } = this.props;
       //console.log(pcpDimension)
        return <ParallelCoordinateChart
            height={h}
            data={pcpData}
            dimension={pcpDimension}
        />
    }

    render() {
        const { height } = this.props;
        const scatterHeight = height / 2;
        const pcpHeight = height - scatterHeight;
        return (
            <div className={this.props.className}>
                {this.renderParallelCoordinateChart(pcpHeight)}
                {this.renderScatterChart(scatterHeight)}
            </div>
        );
    }
}

ChartBox.propTypes = {};
ChartBox.defaultProps = {};


function mapStateToProps(state) {
    const { data, xExtents, yExtents } = getSelectedSortedDataArray(state);

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
        colorsBySampleNames: getColorsBySampleNames(state),
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
