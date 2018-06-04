import randomColor from "randomcolor";
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

export { default as PriorityQueue } from "./PriorityQueue";

const colorOptions = {
    luminosity: "random",
    hue: "random"
};

export const PRIORITY = {
	HIGH: 5,
	MID_HIGH: 3.75,
	MID: 2.5,
	LOW_MID: 1.25,
	LOW: 1
};

export const getRandomColor = (usedColors = []) => {
	let color;
	do {
		color = randomColor(colorOptions);
	} while (usedColors.indexOf(color) !== -1);
	return color;
};

export function sortAlphaNum(a, b) {
	const reA = /[^A-Z]/g;
	const reN = /[^0-9]/g;

	const aA = a.toUpperCase().replace(reA, "");
	const bA = b.toUpperCase().replace(reA, "");

	// console.log('aA', aA)
	// console.log('bA', bA)

	if (aA === bA) {
		const aN = parseInt(a.replace(reN, ""), 10);
		const bN = parseInt(b.replace(reN, ""), 10);

		// console.log('aN', aN);
		// console.log('bN', bN);
		return aN === bN ? 0 : aN > bN ? 1 : -1;
	}
	return aA > bA ? 1 : -1;
}

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