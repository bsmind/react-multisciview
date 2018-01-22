import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { Grid, Row, Col } from 'react-bootstrap';

import get from 'lodash.get';
import uniqueId from 'lodash.uniqueid';

import theme from './index.css';

import {
    ScatterChart,
    ScatterChartSVG,
    ParallelCoordinateChart,
    ImageListChart
} from './charts';

import {
    getTiffWithPriority,
    addSelectedDataList
} from '../../actions/dataActions'


import {
    getSelectedDataArray,
    getSelectedSampleNames,
    getAttrX,
    getAttrY,
    getAttrZ,
    getImgPool,
    getSelectedDataItemList
} from './selector';

import {
    scaleSequential,
    interpolateViridis
} from 'd3-scale';

import ImageShipTest from './imageShipTest';

class ChartBox extends React.Component {
    constructor(props) {
        super(props);
        this.attrExtents = {};
        this.state = {
            selectList: []
        };
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
        return;
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
        const {imgPool} = this.props;
        if (this.props.getTiffWithPriority && imgPool[dataID] == null)
            this.props.getTiffWithPriority(dataID, priority);
    }

    handleScatterSelectDataItems = (listObject) => {
        const dataIDs = Object.keys(listObject);
        const dataList = dataIDs.map(id => {
            this.handleDataImageRequest(id, 1);
            return listObject[id];
        });
        dataList.timestamp = Date.now();
        dataList.id = uniqueId('scatter_select_');
        if (this.props.addSelectedDataList)
            this.props.addSelectedDataList(dataList);
    }

    renderScatterChart = (w, h, margin) => {
        const {
            pcpDimension,
            pcpData,
            xAttr, yAttr, zAttr,
            colorsBySampleNames,
            imgPool
        } = this.props;
        
        return <ScatterChart
            ref={node => this.ScatterChartNode = node}
            width={w}
            height={h}
            margin={margin}
            data={pcpData}
            dimension={pcpDimension}
            xAttr={xAttr}
            yAttr={yAttr}
            zAttr={zAttr}
            colorsByGroup={colorsBySampleNames}
            imgPool={imgPool}
            onScatterPanZoom={this.handleScatterPanZoom}
            onDataRequest={this.handleDataImageRequest}
            onSelectDataItems={this.handleScatterSelectDataItems}
        />
    }

    renderScatterChartSVG = (w, h, margin) => {
        const {
            pcpDimension,
            pcpData,
            xAttr, yAttr, zAttr,
            colorsBySampleNames,
            imgPool
        } = this.props;
        
        return <ScatterChartSVG
            ref={node => this.ScatterChartSVGNode = node}
            width={w}
            height={h}
            margin={margin}
            data={pcpData}
            dimension={pcpDimension}
            xAttr={xAttr}
            yAttr={yAttr}
            zAttr={zAttr}
            colorsByGroup={colorsBySampleNames}
            imgPool={imgPool}
            onScatterPanZoom={this.handleScatterPanZoom}
            onDataRequest={this.handleDataImageRequest}
            onSelectDataItems={this.handleScatterSelectDataItems}    
        />;
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

    // need to work
    renderItemList = () => {
        const testdata = [
            [{timestamp: 0, data:{_id:"5a0a47094325dff64ba8c358"}}],
            [{timestamp: 0, data:{_id:"5a0a47094325dff64ba8c358"}}],
            [{timestamp: 0, data:{_id:"5a0a470a4325dff64ba8c376"}}, {timestamp: 0, data:{_id:"5a0a47094325dff64ba8c358"}}]
        ];
        testdata.forEach((d, i) => {
            d.timestamp = i;
            d.id = `id-${i}`;
        });
        return <ImageListChart
            dataList={testdata}
            imgHeight={100}
            imgGapY={10}
            imgGapX={10}
            imgPool={this.props.imgPool}
            onImageRequest={this.handleDataImageRequest}
        />;
    }

    

    render() {
        const {width, height} = this.props;
        const margin = {
            left: 60,
            right: 10,
            top: 10,
            bottom: 60
        };

        const chartHeight = Math.floor(height);
        let scatterWidth = Math.floor(0.65 * width);
        scatterWidth = Math.min(scatterWidth, chartHeight);
        const pcpWidth = Math.floor(width - scatterWidth);

        const leftStyle = {
            width: scatterWidth,
            float: 'left'
        };
        const rightStyle = {
            marginLeft: scatterWidth
        };
        return (
            <div className={this.props.className}>
                <div style={leftStyle}>
                    {/* {this.renderScatterChartSVG(scatterWidth, scatterWidth, margin)} */}
                    {this.renderScatterChart(scatterWidth, scatterWidth, margin)}
                </div>
                <div style={rightStyle}> 
                    {this.renderParallelCoordinateChart(scatterWidth)}
                </div>
            </div>
        );
        // return (
        //     <div className={this.props.className}>
        //         {this.renderScatterChart(scatterHeight)}              
        //         {this.renderParallelCoordinateChart(pcpHeight)}
        //         {testImageShip &&
        //             <ImageShipTest height={testHeight}
        //             />
        //         }
        //         {/* {this.renderItemList()}            */}
        //     </div>
        // );
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
        itemList: getSelectedDataItemList(state)
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        getTiffWithPriority,
        addSelectedDataList
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ChartBox);
