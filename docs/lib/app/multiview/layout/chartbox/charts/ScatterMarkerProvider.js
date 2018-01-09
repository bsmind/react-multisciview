import React from 'react';

import { fitWidth } from 'react-multiview/lib/helper';

import uniqBy from 'lodash.uniqby';
import sortBy from 'lodash.sortby';
import { extent as d3Extent } from 'd3-array';
import {
    scaleLinear,
    scaleSequential,
    interpolateViridis
} from 'd3-scale';


class ScatterMarkerProviderTest extends React.Component {
    constructor() {
        super();
        this.ctx = null;
        this.marker = null;
    }

    componentDidMount() {
        this.ctx = this.node.getContext("2d");
        this.calculateMarkers();
    }

    componentWillReceiveProps(nextProps) {
        // todo: comparison (shallow comparison)
        this.calculateMarkers(nextProps);
    }

    calculateMarkers = (props = this.props) => {
        const {
            data,
            valueAccessor,
            width,
            height,
            ratio
        } = props;

        if (data == null || data.length === 0) {
            console.log('empty data');
            return;
        }

        let t0, t1;

        t0 = Date.now();
        const uniqValueSet = data;
            //uniqBy(data, valueAccessor)
            //.sort((a,b) => valueAccessor(a) - valueAccessor(b));

        const valueExtents = d3Extent(uniqValueSet, valueAccessor);
        //console.log(valueExtents);

        const colorScale = scaleSequential(interpolateViridis)
                            .domain(valueExtents);

        const squareWidth = 12;
        const spacing = 6;

        const numSquareInRow = Math.floor((width - spacing) / (squareWidth + spacing));
        const numSquareInCol = Math.floor((height - spacing) / (squareWidth + spacing));
        const maxNumSquares = numSquareInRow * numSquareInCol;

        //console.log('max. marker: ', uniqValueSet.length);
        //console.log('max. squares: ' + maxNumSquares + ' in ' + numSquareInCol + ' x ' + numSquareInRow);

        const gridHeight = numSquareInCol;
        const gridWidth = numSquareInRow;
        const markers = {};
        let iRow = 0, iCol = 0, i = 0;
        uniqValueSet.forEach( (d, index) => {
            const value = valueAccessor(d);
            const color = colorScale(value);
            //console.log(value + "->" + color)

            if (markers[color] == null) {
                markers[color] = {
                    x: spacing + iCol*(squareWidth + spacing),
                    y: spacing + iRow*(squareWidth + spacing),
                    value,
                    color
                };
                i += 1;
                iCol = i % gridWidth;
                iRow = Math.floor(i / gridWidth);
            }

            d.color = color;
        });

        //console.log('markers: ', markers);

        const ctx = this.ctx;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(-1, -1, ctx.canvas.width + 2, ctx.canvas.height + 2);
		ctx.scale(ratio, ratio);

        const sortedMarkersByValue = sortBy(markers, 'value');
        //console.log('sorted markers: ', sortedMarkersByValue);

        ctx.save();
        sortedMarkersByValue.forEach( m => {
            ctx.fillStyle = m.color;
            ctx.fillRect(m.x, m.y, squareWidth, squareWidth);
        });
        ctx.restore();

        t1 = Date.now();
        console.log('processing time: ' + (t1 - t0) + 'ms');
    }

    render() {
        const {
            width, height, ratio
        } = this.props;

        const canvasWidth = width * ratio;
        const canvasHeight = width * ratio;

        //console.log(width, height, ratio)

        return (
            <div style={{position: "absolute", zIndex: 1}}>
                <canvas
                    id="test"
                    ref={node => this.node = node}
                    width={canvasWidth}
                    height={canvasHeight}
                    style={{
                        position: 'absolute',
                        width: width,
                        height: height
                    }}
                />
            </div>
        );
    }
}


ScatterMarkerProviderTest = fitWidth(ScatterMarkerProviderTest);
export default ScatterMarkerProviderTest;
