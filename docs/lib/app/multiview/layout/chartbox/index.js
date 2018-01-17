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
    getSelectedDataArray,
    getSelectedSampleNames,
    getAttrX,
    getAttrY,
    getAttrZ
} from './selector';

import {
    scaleSequential,
    interpolateViridis
} from 'd3-scale';

class ChartBox extends React.Component {
    constructor(props) {
        super(props);
        this.attrExtents = {};
    }

    componentDidMount() {
        //console.log(this.ScatterChartNode);
        //this.ScatterChartCanvasNode = this.ScatterChartNode.node.getScatterChartCanvasNode();
        //console.log(this.ScatterChartCanvasNode)
        //this.ScatterChartCanvasNode = this.ScatterChartNode.node
    }

    getScatterChartCanvasNode = () => {
        if (this.ScatterChartNode &&
            this.ScatterChartNode.node 
        ) {
            return this.ScatterChartNode.node.getScatterChartCanvasNode();
        }
    }

    handlePCPAxisSelect = (who, axisTitle, select, scale, inProgress) => {
        let start, end, temp;
        if (select) {
            start = scale.invert(select[0]);
            end = scale.invert(select[1]);
            if (start > end) {
                temp = start;
                start = end;
                end = temp;
            }
            this.attrExtents[axisTitle] = [start, end];
        } else {
            const {pcpDimension} = this.props;
            this.attrExtents[axisTitle] = pcpDimension[axisTitle];
        }

        const targetCanvas = this.getScatterChartCanvasNode();
        targetCanvas.handleByOther({
            what: 'extents',
            data: this.attrExtents,
            inProgress
        });
    }

    renderScatterChart = (h) => {
        const {
            pcpDimension,
            pcpData,
            xAttr, yAttr, zAttr,
            colorsBySampleNames
        } = this.props;
        
        return <ScatterChart
            ref={node => this.ScatterChartNode = node}
            height={h}
            data={pcpData}
            dimension={pcpDimension}
            xAttr={xAttr}
            yAttr={yAttr}
            zAttr={zAttr}
            colorsByGroup={colorsBySampleNames}
        />

    }

    renderParallelCoordinateChart = (h) => {
        const {
            pcpDimension,
            pcpData,
            colorsBySampleNames,
            sampleAccessor,
            attrFormat,
            zAttr
        } = this.props;

        const colorExtents = pcpDimension[zAttr];

        const colorScale = zAttr === 'sample' || colorExtents == null
            ? d => colorsBySampleNames[get(d,zAttr)]
            : scaleSequential(interpolateViridis).domain(colorExtents);

        const colorAccessor = zAttr === 'sample' || colorExtents == null
            ? d => colorScale(d)
            : d => {
                const value = get(d, zAttr);
                if (value == null) {
                    return '#FF0000';
                }
                return colorScale(value);
            };

        return <ParallelCoordinateChart
            height={h}
            data={pcpData}
            dimension={pcpDimension}
            colorAccessor={colorAccessor}
            titleFormat={attrFormat}
            onPCPAxisSelect={this.handlePCPAxisSelect}
        />
    }

    render() {
        const { height } = this.props;
        const scatterHeight = height / 2;
        const pcpHeight = height - scatterHeight;

        //console.log('chartbox height: ', height)

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
    const {
        data: pcpData,
        extents: pcpExtents
    } = getSelectedDataArray(state);

    return {
        xAttr: getAttrX(state),
        yAttr: getAttrY(state),
        zAttr: getAttrZ(state),
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
