import {
    interpolateViridis,
    interpolateInferno,
    interpolateMagma,
    interpolatePlasma,
    interpolateWarm,
    interpolateCool,
    interpolateRainbow,
    interpolateCubehelixDefault
} from 'd3-scale';

import {
    interpolateBlues,
    interpolateGreens,
    interpolateGreys,
    interpolateOranges,
    interpolatePurples,
    interpolateReds,
    interpolateBuGn,
    interpolateBuPu,
    interpolateGnBu,
    interpolateOrRd,
    interpolatePuBuGn,
    interpolatePuBu,
    interpolatePuRd,
    interpolateRdPu,
    interpolateYlGnBu,
    interpolateYlGn,
    interpolateYlOrBr,
    interpolateYlOrRd,
} from 'd3-scale-chromatic';

export const colorInterpolators = [
    // These are from d3-scale.
    "Viridis",
    "Inferno",
    "Magma",
    "Plasma",
    "Warm",
    "Cool",
    "Rainbow",
    "CubehelixDefault",
    
    // These are from d3-scale-chromatic
    "Blues",
    "Greens",
    "Greys",
    "Oranges",
    "Purples",
    "Reds",
    "BuGn",
    "BuPu",
    "GnBu",
    "OrRd",
    "PuBuGn",
    "PuBu",
    "PuRd",
    "RdPu",
    "YlGnBu",
    "YlGn",
    "YlOrBr",
    "YlOrRd"    
];

export const getColorInterpolator = (name) => {
    switch(name) {
        case "Viridis": return interpolateViridis;
        case "Inferno": return interpolateInferno;
        case "Magma": return interpolateMagma;
        case "Plasma": return interpolatePlasma;
        case "Warm": return interpolateWarm;
        case "Cool": return interpolateCool;
        case "Rainbow": return interpolateRainbow;
        case "CubehelixDefault": return interpolateCubehelixDefault;
        case "Blues": return interpolateBlues;
        case "Greens": return interpolateGreens;
        case "Greys": return interpolateGreys;
        case "Oranges": return interpolateOranges;
        case "Purples": return interpolatePurples;
        case "Reds": return interpolateReds;
        case "BuGn": return interpolateBuGn;
        case "BuPu": return interpolateBuPu;
        case "GnBu": return interpolateGnBu;
        case "OrRd": return interpolateOrRd;
        case "PuBuGn": return interpolatePuBuGn;
        case "PuBu": return schemePuBu;
        case "PuRd": return interpolatePuRd;
        case "RdPu": return interpolateRdPu;
        case "YlGnBu": return interpolateYlGnBu;
        case "YlGn": return interpolateYlGn;
        case "YlOrBr": return interpolateYlOrBr;
        case "YlOrRd": return interpolateYlOrRd;    
       // case "Sample": return getSampleInterpolator();
        default: return interpolateViridis;
    }
};

export function hexToRgb(hex) { // eslint-disable-line
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : { r: 0, g: 0, b: 0 };
}

export function rgbToHex(r, g, b) {
	return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function rgbToDigit(rgbString) {
    const rgbDigits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(rgbString);
    if (rgbDigits == null) {
        return null;
    }
    return [
        parseInt(rgbDigits[2]),
        parseInt(rgbDigits[3]),
        parseInt(rgbDigits[4])
    ];
}