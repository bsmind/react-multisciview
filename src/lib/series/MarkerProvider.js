import {
    extent as d3Extent
} from 'd3-array';

import {
    scaleSequential,
    interpolateCool,
    interpolateInferno,
    interpolateMagma,
    interpolatePlasma,
    interpolateRainbow,
    interpolateViridis,
    interpolateWarm
} from 'd3-scale';

import sortBy from 'lodash.sortby';

import { hexToRGBA, functor } from '../utils';

const default_accessor = d => d.value;

export default function markerProvider(
    valueAccessor,
    shape = {
        type: 'square',
        width: 12,
        height: 12,
        style: {
            stroke: () => 'none',
            strokeWidth: 0,
            opacity: 0.5
        }
    },    
    ratio = 1,
    width = 1024,
    height = 1024,
) {
    const provider = new MarkerProvider(
        valueAccessor == null ? default_accessor: valueAccessor,
        width,
        height,
        ratio,
        shape,
        null
    );
    return provider;
}

function MarkerProvider(valueAccessor, width, height, ratio, shape, colorSet) {
    this._valueAccessor = valueAccessor;
    this._width = width;
    this._height = height;
    this._ratio = ratio;
    this._shape = shape;

    this._colorSet = colorSet;

    const offCanvas = document.createElement('canvas');
    offCanvas.width = width * ratio;
    offCanvas.height = height * ratio;
    offCanvas.style.width = width;
    offCanvas.style.height = height;

    this._canvas = offCanvas;
    this._ctx = offCanvas.getContext('2d');
    this._markers = null;
    this._vSpacing = null;
    this._hSpacing = null;
}

var providerProto = markerProvider.prototype = MarkerProvider.prototype;

providerProto.valueAccessor = function(_){
    return arguments.length ? (this._valueAccessor = _, this) : this._valueAccessor;
}

providerProto.colorSet = function(_) {
    return arguments.length ? (this._colorSet = _, this): this._colorSet;
}

providerProto.getMarkers = function() {
    return this._markers;
}

providerProto.calculateMarkers = function(data) {
    const accessor = this._valueAccessor,
          width = this._width,
          height = this._height,
          ratio = this._ratio,
          ctx = this._ctx,
          colorSet = this._colorSet;

    let colorScale;
    if (colorSet != null) {
        colorScale = d => colorSet[d];
    } else {
        const dataExtents = d3Extent(data, accessor);
        colorScale = scaleSequential(interpolateViridis).domain(dataExtents);
    }

    let {
        type: markerType,
        width: markerWidth, 
        height: markerHeight,
        style
    } = this._shape;
    switch (markerType) {
        case 'circle':
            markerType = 'circle';
            markerWidth = markerWidth || 6; // 2*radius
            markerHeight = markerWidth;
            break;
        case 'rect':
            markerType = 'rect';
            markerWidth = markerWidth || 6;
            markerHeight = markerHeight || 6;
            break; 
        case 'square':
        default: 
            markerType = 'square';
            markerWidth = markerWidth || 6; // side
            break;
    }


    const hSpacing = Math.max(markerWidth / 2, 4),
          vSpacing = Math.max(markerHeight / 2, 4);

    const gridWidth = Math.floor((width - hSpacing) / (markerWidth + hSpacing)),
          gridHeight = Math.floor((height - vSpacing) / (markerHeight + vSpacing));

    //const stroke = functor(style.stroke);

    const markers = {};
    let i = 0;
    data.forEach( d => {
        const value = accessor(d);
        const color = colorScale(value);

        if (markers[color] == null) {
            const irow = Math.floor(i / gridWidth),
                  icol = i % gridWidth;
            markers[color] = {
                x: hSpacing + icol*(markerWidth + hSpacing),
                y: vSpacing + irow*(markerHeight + vSpacing),
                color,
                value,
                stroke: color,
                opacity: style.opacity,
                strokeWidth: style.strokeWidth,
                width: markerWidth,
                height: markerHeight,
                type: markerType
            };
            i += 1;
        }
        d.markerID = color;
    });

    this._hSpacing = hSpacing;
    this._vSpacing = vSpacing;
    this._markers = markers;
    this.draw();

    return this;
}

providerProto.draw = function (ctx = null, ratio = 1) {
    if (ctx == null) {
        ctx = this._ctx;
        ratio = this._ratio;
    }

    const {type, width, height} = this._shape;
    const vSpacing = this._vSpacing;
    const hSpacing = this._hSpacing;

    const markers = sortBy(this._markers, 'value');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.scale(ratio, ratio);

    ctx.save();
    markers.forEach(m => {
        ctx.fillStyle = hexToRGBA(m.color, m.opacity);
        if (m.stroke != 'none') {
            ctx.strokeStyle = m.stroke;
            ctx.lineWidth = m.strokeWidth;
        }
        ctx.beginPath();
        if (m.type === 'square' || m.type === 'rect') {
            ctx.rect(m.x, m.y, m.width, m.height);    
        } else { // circle
            const radius = m.width / 2;
            ctx.arc(m.x + radius, m.y + radius, radius, 0, 2 * Math.PI, false);
        }
        ctx.stroke();
        ctx.fill();
    });
    ctx.restore();
}

providerProto.drawAt = function (
    dctx,
    dx,
    dy,
    markerID
) {
    const ratio = this._ratio;
    const marker = this._markers[markerID];
    const { x: sx, y: sy } = marker;
    let { strokeWidth, stroke } = marker;
    const { width, height} = this._shape;

    if (stroke == 'none')
        strokeWidth = 0;
    
    dctx.drawImage(
        this._canvas,
        sx * ratio - strokeWidth,
        sy * ratio - strokeWidth,
        width * ratio + 2*strokeWidth,
        height * ratio + 2*strokeWidth,
        dx - width/2,
        dy - height/2,
        width,
        height
    );
}