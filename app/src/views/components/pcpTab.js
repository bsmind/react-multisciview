import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import Autocomplete from "react-toolbox/lib/autocomplete";
import Dropdown from "react-toolbox/lib/dropdown";

import {
    getDataArray,
    getDataStat,
    getDataAttr,
    getScatterColorScheme,
    getSelectedSampleColors,
    pcptab_get_dimorder,
    getSelectedSamples,
} from "../../selectors";

import {
    changePCPSelectedAttrs,
    changeDataAttr,
    setValue,
} from "../../actions/dataActions";

import { getColorInterpolator } from "../../utils";
import { scaleSequential } from "d3-scale";
import get from "lodash.get"

import PcpChart from "./pcpChart";
import HistChart from "./histChart";

import theme from "./index.css";


class PcpTab extends React.Component {
    handleAttrSelectChange = (value) => {
        const { dimOrder } = this.props;
    	let dimOrderCopy = dimOrder.slice();
    	if (value.length < dimOrder.length) {
            // deleted
    		dimOrder.forEach( (dimName, i) => {
    			const index = value.indexOf(dimName);
    			if (index === -1) {
    				dimOrderCopy.splice(i, 1);
    			}
    		});
    	} else if (value.length > dimOrderCopy.length) {
    		// added
    		value.forEach(dimName => {
    			const index = dimOrder.indexOf(dimName);
    			if (index === -1) {
    				dimOrderCopy.push(dimName);
    			}
    		});
    	}

    	if (this.props.updateDimOrder) {
    		this.props.updateDimOrder(dimOrderCopy);
    	}
    }

    renderOptions = () => {
    	const {
    		dimKinds: dimKindsProp,
    		zAttr,
    		dimOrder
        } = this.props;
        
        const attrFormat = d => {
            const tokens = d.split("/");
            let attr = ''
            for (let i=0; i<tokens.length-1; i++)
                attr = attr + tokens[i].slice(0,4) + '/';
            attr = attr + tokens[tokens.length-1];
            return attr;
        };

    	const dimKindsFormatted = {}, dimKinds = [];
    	dimKindsProp.map(kind => {
    		//const value = kind;
    		const valueFormatted = attrFormat(kind);
    		dimKinds.push({ value: kind, label: valueFormatted });
    		dimKindsFormatted[kind] = valueFormatted; // eslint-disable-line
        });

    	return <div className={theme.tabDiv}>
    		<Dropdown
    			label={"Color by ... "}
    			source={dimKinds}
    			value={zAttr}
    			onChange={value => this.props.changeColorAttr('z', value)}
    		/>
    		<Autocomplete
    			direction="up"
    			selectedPosition="below"
    			label={"Select an attribute to add ... "}
    			source={dimKindsFormatted}
    			value={dimOrder}
    			suggestionMatch="anywhere"
    			onChange={this.handleAttrSelectChange}
    		/>
    	</div>;
    }

    render() {
        const {
            data, dimension, dimOrder,
            colorScheme, zAttr, colorsByGroup,
            fontSize
        } = this.props;
        const colorExtents = dimension[zAttr];
        const {type, colorDomain} = colorScheme;
        const interpolator = getColorInterpolator(type);
        const colorScale = zAttr === "sample" || colorExtents == null
            ? d => colorsByGroup[d[zAttr]]
            : scaleSequential(interpolator).domain(colorDomain).clamp(true);
        const colorAccessor = zAttr === "sample" || colorExtents == null
            ? d => colorScale(d)
            : d => {
                const value = get(d, zAttr);
                if (value == null) return "#FF0000";
                return colorScale(value);
            };
        const titleFormat = d => {
            const tokens = d.split("/");
            return tokens[tokens.length-1];
        };

        return (
            <div>
                <div className={theme.tabDiv}>
                    <HistChart 
                        height={250}
                        data={data}
                        fontSize={fontSize}
                        colorAccessor={d => colorsByGroup[d]}
                        dimKinds={this.props.dimKinds}
                        samples={this.props.samples}
                        numBins={this.props.numBins}
                        isStacked={this.props.isStacked}
                        selected_attr={this.props.selected_attr}
                        onChange={this.props.setHistChange}
                    />
                </div>
                <div className={theme.tabDiv}>
                    <PcpChart 
                        ref={"PCPChartRef"}
                        height={250}
                        data={data}
                        dimOrder={dimOrder} 
                        dimension={dimension}
                        colorAccessor={colorAccessor}
                        titleFormat={titleFormat} 
                        fontSize={fontSize}

                        updateDimOrder={this.props.updateDimOrder}
                        onPCPAxisSelect={this.props.onPCPAxisSelect}
                        //pcpAttrSelect={null}
                        dataExtents={this.props.dataExtents}
                    />
                </div>
                {this.renderOptions()}
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        dimension: getDataStat(state),
        data: getDataArray(state),
        dimOrder: pcptab_get_dimorder(state),
        colorScheme: getScatterColorScheme(state),
        zAttr: state.data.attrz,
        colorsByGroup: getSelectedSampleColors(state),
        dimKinds: getDataAttr(state),
        fontSize: state.env.pcpFontSize,
        samples: getSelectedSamples(state),

        numBins: state.data.numBins,
        isStacked: state.data.isStacked,
        selected_attr: state.data.selected_attr,
    };
}

function mapDispatchToProps(dispatch){
    return bindActionCreators({
        updateDimOrder: changePCPSelectedAttrs,
        changeColorAttr: changeDataAttr,
        setHistChange: setValue,
    }, dispatch);
}


export default connect(mapStateToProps, mapDispatchToProps, null, {withRef: true})(PcpTab);