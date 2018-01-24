import React from 'react';
import PropTypes from 'prop-types';
import get from 'lodash.get';
import Autocomplete from 'react-toolbox/lib/autocomplete';
import Dropdown from 'react-toolbox/lib/dropdown';
import { ParallelCoordinateChart } from '../../../charts';
import { scaleSequential, interpolateViridis } from 'd3-scale';


class PcpTab extends React.Component {

    handleColorAttrChange = (value) => {
        if (this.props.onColorAttrChange)
            this.props.onColorAttrChange('z', value);
    }

    handleAttrSelectChange = (value) => {
        const { dimOrder } = this.props;
        let dimOrderCopy = dimOrder.slice();
        if (value.length < dimOrderCopy.length) {
            // deleted
            dimOrderCopy.forEach( (dimName, i) => {
                const index = value.indexOf(dimName);
                if (index === -1) {
                    dimOrderCopy.splice(i, 1);
                }
            });
        } else if (value.length > dimOrderCopy.length) {
            // added
            value.forEach(dimName => {
                const index = dimOrderCopy.indexOf(dimName);
                if (index === -1) {
                    dimOrderCopy.push(dimName);
                }
            });
        } else {
            // maybe re-ordred
            dimOrderCopy = value.slice();
        }

        if (this.props.onAttrSelectChange) {
            this.props.onAttrSelectChange(dimOrderCopy);
        }
    }

    handleUpdateDimOrder = (dimOrder) => {
        if (this.props.onAttrSelectChange) {
            this.props.onAttrSelectChange(dimOrder)
        }
    }

    renderOptions = () => {
        const {
            dimKinds: dimKindsProp,
            zAttr,
            attrFormat,
            dimOrder
        } = this.props;

        const dimKindsFormatted = {}, dimKinds = [];
        Object.keys(dimKindsProp).map(key => {
            const value = dimKindsProp[key];
            const valueFormatted = attrFormat(value);
            dimKinds.push({value: key, label: valueFormatted});
            dimKindsFormatted[key] = valueFormatted;
        });

        return <div>
            <Dropdown 
                label={`Color by ... `}
                source={dimKinds}
                value={zAttr}
                onChange={this.handleColorAttrChange}
            />
            <Autocomplete 
                direction="top"
                selectedPosition='below'
                label={`Select an attribute to add ... `}
                source={dimKindsFormatted}
                value={dimOrder}
                suggestionMatch='anywhere'
                onChange={this.handleAttrSelectChange}
            />
        </div>;
    }

    render() {
        const {
            data, dimension, dimOrder,
            attrFormat, 
            zAttr, colorsBySampleNames,
            onPCPAxisSelect, pcpAttrSelect
        } = this.props;

        const colorExtents = dimension[zAttr];
        const colorScale = zAttr === 'sample' || colorExtents == null
            ? d => colorsBySampleNames[d[zAttr]]
            : scaleSequential(interpolateViridis).domain(colorExtents);

        const colorAccessor = zAttr === 'sample' || colorExtents == null
            ? d => colorScale(d)
            : d => {
                const value = get(d, zAttr);
                if (value == null) return '#FF0000';
                return colorScale(value);
            }

        return <div>
            <ParallelCoordinateChart
                ref={node => this.PCPChartNode = node}
                height={250}
                data={data}
                dimOrder={dimOrder}
                dimension={dimension}
                colorAccessor={colorAccessor}
                titleFormat={attrFormat}
                updateDimOrder={this.handleUpdateDimOrder}
                onPCPAxisSelect={onPCPAxisSelect}
                pcpAttrSelect={pcpAttrSelect}
            />
            {this.renderOptions()}
        </div>
    }
}

export default PcpTab;
