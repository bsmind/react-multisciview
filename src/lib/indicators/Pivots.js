import React from 'react';
import PropTypes from 'prop-types';

class Pivots extends React.Component {
    getAccessor = (attr) => {
    	const { ordinary, name, step, scale, origExtents } = attr;
    	return (d) => {
    		const value = d[name];
    		if (value == null) return null;
    		let scaledValue;
    		if (ordinary) {
    			const index = origExtents.indexOf(value);
    			const range = scale.range();
    			const sign = range[0] < range[1] ? 1 : -1;
    			scaledValue = scale(index) + sign * step / 2;
    		} else {
    			scaledValue = scale(value);
    		}
    		return scaledValue;
    	};
    }

    getDataFilter = (dataExtents, origDataExtents) => {
    	const dataKeys = Object.keys(dataExtents);
    	return d => {
    		return dataKeys.map(key => {
    			const extents = dataExtents[key];
    			let value = d[key];
    			if (value == null) return true;
    			if (typeof value === "string") {
    				const tempExtents = origDataExtents[key];
    				value = tempExtents.indexOf(value) + 0.5;
    			}
    			return extents[0] <= value && value <= extents[1];
    		}).every(each => each);
    	};
    }

    renderPivot = () => {
        const {
            selected,
            currSelectedIndex,
            xAttr,
            yAttr,
            origDataExtents,
            dataExtents,
            handlePivotSelect
        } = this.props.shared;
        const {pivot, normal, accent, opacity, scale} = this.props;

        const dataFilter = this.getDataFilter(dataExtents, origDataExtents);
        const xAccessor = this.getAccessor(xAttr);
        const yAccessor = this.getAccessor(yAttr);

        const clickCallback = handlePivotSelect 
            ? handlePivotSelect
            : () => {};

        const pivots = selected.map( (d, index) => {
            const { data } = d;
            const x = xAccessor(data);
            const y = yAccessor(data);
            const color = index === currSelectedIndex ? accent: normal;

            if (x == null || y == null) return;
            if (!dataFilter(data)) return;

            return <g>
                <g transform={`translate(${x},${y}) scale(${scale})`}>
                    <path
                        key={`pivot-${d.id}`}
                        d={pivot}
                        fill={color}
                        opacity={opacity}
                        stroke={color}
                        strokeWidth={1}
                        onClick={() => clickCallback(index)}
                    />
                </g>
                <text
                    x={x}
                    y={y - 5}
                    fill={'#ffffff'}
                    textAnchor={'middle'}
                    fontFamily={'Roboto, sans-serif'}
                    fontSize={6}
                >
                    {index+1}
                </text>
            </g>;
        }).filter(d => d != null);

        return pivots;
    }
    render() {
        return (<g>
            {this.renderPivot()}
        </g>);
    }
}

Pivots.propTypes={};
Pivots.defaultProps={};

export default Pivots;