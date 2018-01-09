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
} from './selector';


class ChartBox extends React.Component {

    render() {
        const {
            width,
            height,
            data,
            extents,
            xAccessor,
            yAccessor,
            zAccessor,
            selectedSampleNames,
            sampleAccessor,
            colorsBySampleNames
        } = this.props;


        return (
            <div className={this.props.className}>
                <Test
                    width={width}
                    height={height}
                    data={data}
                    valueAccessor={xAccessor}
                />
            </div>
        );

        // return (
        //     <div className={this.props.className}>
        //         <ScatterChart
        //             width={width}
        //             height={height}
        //             data={data}
        //             extents={extents}
        //             xAccessor={xAccessor}
        //             yAccessor={yAccessor}
        //             zAccessor={zAccessor}
        //             groups={selectedSampleNames}
        //             groupAccessor={sampleAccessor}
        //             colorsByGroup={colorsBySampleNames}
        //         />
        //     </div>
        // );
    }
}

ChartBox.propTypes = {};
ChartBox.defaultProps = {};

function mapStateToProps(state) {
    const { data, extents } = getSelectedSortedDataArray(state);

    //console.log(getColorsBySampleNames(state))

    return {
        data,
        extents,
        xAccessor: getXAccessor(state),
        yAccessor: getYAccessor(state),
        zAccessor: getZAccessor(state),
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
