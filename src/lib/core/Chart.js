import React from "react";
import PropTypes from "prop-types";

import {
	scaleLinear
} from "d3-scale";

import Series from "./Series";

import { XAxis, YAxis } from "../axes";

class Chart extends React.PureComponent {
	render() {
        if (this.props.children == null) return null;
		// const {
		// 	children,
		// 	origin, width, height, id, yExtents,
		// 	yFlip, yPadding, yPan, yPanEnabled, yScale,
		// 	...rest
		// } = this.props;
		// const { contextProps, config } = this.props;
		// const {
		// 	// origin,
		// 	width: chartWidth,
		// 	height: chartHeight
		// } = this.props.config;
        // // console.log(chartWidth, chartHeight)
        const { shared, chartConfig, origin } = this.props;

		const xaxisList = [], yaxisList = [], seriesList = [];
		let seriesCount = 0, xAxisCount = 0, yAxisCount = 0;
		React.Children.forEach(this.props.children, child => {
			if (!React.isValidElement(child)) return;
			if (child.type === XAxis) {
				const XAxisProps = {
                    key: `xaxis-${xAxisCount}`,
                    shared: shared,
                    chartConfig: chartConfig
				};
				xaxisList.push(React.cloneElement(child, XAxisProps));
				xAxisCount += 1;
			} else if (child.type === YAxis) {
				const YAxisProps = {
					key: `yaxis-${yAxisCount}`,
                    shared: shared,
                    chartConfig: chartConfig
				};
				yaxisList.push(React.cloneElement(child, YAxisProps));
				yAxisCount += 1;
			} else if (child.type === Series) {
				const seriesProps = {
                    key: `series-${seriesCount}`,
                    shared: shared,
                    chartConfig: chartConfig
				};
				seriesList.push(React.cloneElement(child, seriesProps));
				seriesCount += 1;
			}
		});

		return <g transform={`translate(${origin.x},${origin.y})`}>
			{seriesList}
			{xaxisList}
			{yaxisList}
		</g>;
	}
}

Chart.propTypes = {
	id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
	origin: PropTypes.shape({
		x: PropTypes.number,
		y: PropTypes.number,
	}),
	width: PropTypes.number,
	height: PropTypes.number,

	// yAccessor: PropTypes.func,
	yExtent: PropTypes.oneOfType([
		PropTypes.array,
		PropTypes.func
	]),
	yScale: PropTypes.func,
	yFlip: PropTypes.bool,
	yPadding: PropTypes.oneOfType([
		PropTypes.number,
		PropTypes.shape({
			top: PropTypes.number,
			bottom: PropTypes.number
		})
	]),

	yPan: PropTypes.bool,
	yPanEnabled: PropTypes.bool
};

Chart.defaultProps = {
	id: 0,
	origin: { x: 0, y: 0 },
	yPadding: 0,
	// yAccessor: d => d.y,
	yScale: scaleLinear(),
	yFlip: false,
	yPan: true,
	yPanEnabled: false
};

export default Chart;
