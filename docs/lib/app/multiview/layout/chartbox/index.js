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

import {
    getTiffWithPriority
} from '../../actions/dataActions'

//import Test from './charts/ScatterMarkerProvider';

import {
    getSelectedDataArray,
    getSelectedSampleNames,
    getAttrX,
    getAttrY,
    getAttrZ,
    getImgPool
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

    getScatterChartCanvasNode = () => {
        if (this.ScatterChartNode &&
            this.ScatterChartNode.node 
        ) {
            return this.ScatterChartNode.node.getScatterChartCanvasNode();
        }
    }

    getPCPCanvasNode = () => {
        if (this.PCPNode &&
            this.PCPNode.node
        ) {
            return this.PCPNode.node.getPCPCanvasNode();
        }
    }

    handlePCPAxisSelect = (axisTitle, domain, inProgress) => {
        this.attrExtents[axisTitle] = domain.slice();
        const targetCanvas = this.getScatterChartCanvasNode();
        targetCanvas.handleByOther({
            what: 'extents',
            data: {[axisTitle]: domain.slice()},
            inProgress
        });
    }

    handleScatterPanZoom = (attrList, domainList, inProgress) => {
        const {pcpDimension} = this.props;
        const attrExtents = {};
        attrList.forEach((attr, index) => {
            const refDomain = pcpDimension[attr];
            const domain = domainList[index];
            const isEqual = refDomain.every( (d,index) => Math.abs(domain[index] - d) < 1e-12);
            attrExtents[attr] = isEqual ? []: domain;
        });
        const targetCanvas = this.getPCPCanvasNode();
        targetCanvas.handleByOther({
            what: 'extents',
            data: attrExtents,
            inProgress
        });
    }

    handleDataImageRequest = (dataID, priority = 3) => {
        if (this.props.getTiffWithPriority)
            this.props.getTiffWithPriority(dataID, priority);
    }

    renderScatterChart = (h) => {
        const {
            pcpDimension,
            pcpData,
            xAttr, yAttr, zAttr,
            colorsBySampleNames,
            imgPool
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
            imgPool={imgPool}
            onScatterPanZoom={this.handleScatterPanZoom}
            onDataRequest={this.handleDataImageRequest}
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
            ref={node => this.PCPNode = node}
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
        pcpData: pcpData,

        imgPool: getImgPool(state),
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        getTiffWithPriority
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ChartBox);
