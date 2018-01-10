import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import get from 'lodash.get';

import theme from './index.css';

import {
    ScatterChart
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
    getAttrY
} from './selector';


class ChartBox extends React.Component {

    render() {
        const {
            width,
            height,
            data,
            xAttr,
            yAttr,
            xExtents,
            yExtents,
            xAccessor,
            yAccessor,
            zAccessor,
            xScale,
            yScale,
            xType,
            yType,
            selectedSampleNames,
            sampleAccessor,
            colorsBySampleNames
        } = this.props;

        //console.log('ChartBox::data ', data)

        // return (
        //     <div className={this.props.className}>
        //         <Test
        //             width={width}
        //             height={height}
        //             data={data}
        //             valueAccessor={xAccessor}
        //         />
        //     </div>
        // );

        return (
            <div className={this.props.className}>
                <ScatterChart
                    width={width}
                    height={height}
                    data={data}
                    xAttr={xAttr}
                    yAttr={yAttr}
                    xExtents={xExtents}
                    yExtents={yExtents}
                    xAccessor={xAccessor}
                    yAccessor={yAccessor}
                    zAccessor={zAccessor}
                    xScale={xScale}
                    yScale={yScale}
                    xType={xType}
                    yType={yType}
                    groups={selectedSampleNames}
                    groupAccessor={sampleAccessor}
                    colorsByGroup={colorsBySampleNames}
                />
            </div>
        );
    }
}

ChartBox.propTypes = {};
ChartBox.defaultProps = {};


function mapStateToProps(state) {
    const { data, xExtents, yExtents } = getSelectedSortedDataArray(state);

    

    //console.log(getColorsBySampleNames(state))

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
        sampleAccessor: d => d.sample
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({

    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ChartBox);
