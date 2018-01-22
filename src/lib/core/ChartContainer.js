import React, { Children } from 'react';
import PropTypes from 'prop-types';

import EventHandlerSVG from './EventHandlerSVG';

import { dimension as getChartDimension } from './utils';
import { getScale } from './scatterUtils';
import { cursorStyle, isArrayOfString } from '../utils';

class ChartContainer extends React.Component {
    constructor(props) {
        super(props);
        const initialState = this.resetChart(props);
        this.state = {
			plotData: [],
			dataExtents: {},
			xAttr: {},
			yAttr: {},
            zAttr: {},
            ...initialState
        }
    }

    componentDidMount() {
        const state = this.resetChart();
        this.setState({...state});
    }

    componentWillReceiveProps(nextProps) {
        const state = this.updateChart(nextProps);
        this.setState({...state});
    }

	resetChart = (props = this.props) => {
		const {
			data,
			dataExtents: dataExtentsProp,
			dataAccessor,
			xAttr: xAttrProp,
			yAttr: yAttrProp,
			zAttr: zAttrProp
		} = props;
        const chartDim = getChartDimension(props);

		// xScale
		const xAttr = getScale({
			dataExtents: dataExtentsProp, 
			attribute: xAttrProp
		}, [0, chartDim.width]);

		// yScale
		const yAttr = getScale({
			dataExtents: dataExtentsProp, 
			attribute: yAttrProp
		}, [chartDim.height, 0]);

		// zScale: only domain...
		const zAttr = {
			name: dataExtentsProp[zAttrProp] ? zAttrProp: 'unknown',
			extents: dataExtentsProp[zAttrProp] ? dataExtentsProp[zAttrProp].slice(): null,
			select: null,
			selectDomain: null,
		}
		
		// flatten data to plot
		const dimName = Object.keys(dataExtentsProp);
		const plotData = data.map((d, index) => {
			const flattened = {};
			dimName.forEach(name => {
				flattened[name] = dataAccessor(d, name);
			});
			flattened['_id'] = d._id;
			flattened['item'] = d.item;
			return flattened;
		});

		const dataExtents = {};
		dimName.forEach(name => {
			dataExtents[name] = isArrayOfString(dataExtentsProp[name])
				? [0, dataExtentsProp[name].length]
				: dataExtentsProp[name].slice();
		});

		return {
			plotData,
			dataExtents,
			xAttr,
			yAttr,
			zAttr
		}
    }
        
	updateChart = (props = this.props) => {
		const {
			data,
			dataExtents: dataExtentsProp,
			dataAccessor,
			xAttr: xAttrProp,
			yAttr: yAttrProp,
			zAttr: zAttrProp
		} = props;
		const chartDim = getChartDimension(props);

		const {
			dataExtents: dataExtentsState,
			xAttr: initialXAttr,
			yAttr: initialYAttr,
			zAttr: initialZAttr,
		} = this.state;

		const dimName = Object.keys(dataExtentsProp);
		dimName.forEach(name => {
			const extentsProps = dataExtentsProp[name];
			if (dataExtentsState[name] == null) {
				dataExtentsState[name] = isArrayOfString(extentsProps)
					? [0, extentsProps.length]
					: extentsProps.slice();
			}
		});

		// xScale
		const xAttr = (initialXAttr.name === xAttrProp)
			? initialXAttr
			: getScale({
				dataExtents: dataExtentsProp, 
				attribute: xAttrProp,
				dataExtentsPrev: dataExtentsState
			}, [0, chartDim.width]);


		// yScale
		const yAttr = (initialYAttr.name === yAttrProp)
			? initialYAttr
			: getScale({
				dataExtents: dataExtentsProp, 
				attribute: yAttrProp,
				dataExtentsPrev: dataExtentsState
			}, [chartDim.height, 0]);

		const zAttr = (initialZAttr.name === zAttrProp)
			? initialZAttr
			: {
				name: dataExtentsProp[zAttrProp] ? zAttrProp: 'unknown',
				extents: dataExtentsProp[zAttrProp] ? dataExtentsProp[zAttrProp].slice(): null,
				select: null,
				selectDomain: (dataExtentsProp[zAttrProp] && isArrayOfString(dataExtentsProp[zAttrProp])) 
					? null
					: dataExtentsState[zAttrProp] 
						? dataExtentsState[zAttrProp].slice()
						: null
			}

		
		// flatten data to plot
		const plotData = data.map((d,index) => {
			const flattened = {};
			dimName.forEach(name => {
				flattened[name] = dataAccessor(d, name);
			});
			flattened['_id'] = d._id;
			flattened['item']=d.item;
			return flattened;
		});

		return {
			plotData,
			dataExtents: {...dataExtentsState},
			xAttr,
			yAttr,
			zAttr,
		}		
    }
    
    handleXAxisZoom = (newDomain) => {
    	const { xAttr: initialXAttr } = this.state;
		const { scale, extents, name } = initialXAttr;

		newDomain[0] = Math.max(extents[0], newDomain[0]);
		newDomain[1] = Math.min(extents[1], newDomain[1]);
		
		this.setState({
			...this.state,
			xAttr: {
				...this.state.xAttr,
				scale: scale.copy().domain(newDomain)
			}
		});
		// if (this.props.onScatterPanZoom) {
		// 	this.props.onScatterPanZoom(
		// 		[name],
		// 		[newDomain],
		// 		false
		// 	);
		// }		        
    }

    handleYAxisZoom = (newDomain) => {
    	const { yAttr: initialYAttr } = this.state;
		const { scale, extents, name } = initialYAttr;

		newDomain[0] = Math.max(extents[0], newDomain[0]);
		newDomain[1] = Math.min(extents[1], newDomain[1]);

		this.setState({
			...this.state,
			yAttr: {
				...this.state.yAttr,
				scale: scale.copy().domain(newDomain)
			}
		});
		// if (this.props.onScatterPanZoom) {
		// 	this.props.onScatterPanZoom(
		// 		[name],
		// 		[newDomain],
		// 		false
		// 	);
		// }		
    }

    
    render() {
        const { margin } = this.props;
        const chartDim = getChartDimension(this.props);
        const divStyle = {
            position: 'relative',
            width: this.props.width,
            height: this.props.height
        };
        const svgStyle = {
            position: 'absolute'
        };

        const shared = {
            margin,
            width: this.props.width,
            height: this.props.height,
            chartDim,
			handleXAxisZoom: this.handleXAxisZoom,
			handleYAxisZoom: this.handleYAxisZoom,            
            ...this.state
        };

        const cursor = cursorStyle(true);
		const children = [];
		React.Children.forEach(this.props.children, child => {
			if (!React.isValidElement(child)) return;
			children.push(React.cloneElement(child,{shared}));
		});   
        
        return(
            <div
                style={divStyle}
                className={this.props.className}
            >
                <svg
                    style={svgStyle}
                    className={this.props.className}
                    width={this.props.width}
                    height={this.props.height}
                >
                    {cursor}
                    <g transform={`translate(${margin.left},${margin.top})`}>
                        <EventHandlerSVG 
                            width={chartDim.width}
                            height={chartDim.height}
                        />
                        {children}
                    </g>
                </svg>
            </div>
        );
    }
}

export default ChartContainer;