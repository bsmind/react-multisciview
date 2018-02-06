import { createSelector } from "reselect";
import forEach from "lodash.foreach";
import uniqBy from "lodash.uniqby";
import uniqueId from "lodash.uniqueid";
import { markerProvider } from "react-multiview/lib/series"; // eslint-disable-line
import { scaleLinear } from 'd3-scale';
import { range as d3Range } from 'd3-array';
import { getColorInterpolator, hexToRgb, rgbToDigit } from '../utils';

export const getShowImageSwitch = state => state.vis.showImage;
export const getMinPoints = state => state.vis.minPoints;
export const getMinImageSize = state => state.vis.minImageSize;

const getDataBySamples = state => state.data.dataBySamples;
export const getSampleKinds = state => state.data.sampleKinds;
const getAttrTypes = state => state.data.attrTypes;

export const getSelectedSampleKeys = state => state.data.samples;
export const getSelectedSampleColors = state => state.data.sampleColors;
export const getSampleColorOpacity = state => state.data.sampleColorOpacity;

export const getSelectedDataItemList = state => state.data.selectedItemList;

export const getAttrX = state => state.vis.attrx;
export const getAttrY = state => state.vis.attry;
export const getAttrZ = state => state.vis.attrz;
export const getAttrKinds = state => state.data.attrKinds;

export const getImgPool = state => state.data.imgPool;


export const getSelectedSampleNames = createSelector(
	[
		getSampleKinds,
		getSelectedSampleKeys
	],
	(
		kinds,
		keys
	) => {
		return keys.map(key => kinds[key]);
	}
);

export const getSelectedDataArray = createSelector(
	[
		getSelectedSampleNames,
		getDataBySamples,
		getAttrTypes,
	],
	(
		selectedSampleNames,
		data,
		types,
	) => {
		let selectedDataArray = [];
		const g_minmax = {};

		forEach(data, (dataObject, sampleName) => {
			if (selectedSampleNames.includes(sampleName)) {
				const { data: dataSample, minmax } = dataObject;

				selectedDataArray = selectedDataArray.concat(dataSample);

				// console.log(sampleName, minmax);
				forEach(minmax, (value, attr) => {
					if (g_minmax[attr] == null) {
						g_minmax[attr] = value; // eslint-disable-line
					} else {
						const t = types[attr];
						let g_value = g_minmax[attr];
						if (t === "num") {
							g_value[0] = Math.min(g_value[0], value[0]);
							g_value[1] = Math.max(g_value[1], value[1]);
						} else if (t === "str") {
							g_value = uniqBy(g_value.concat(value), d => d);
							g_minmax[attr] = g_value; // eslint-disable-line
						} else {
							// ignore unknown type
						}
					}
				});
			}
		});

		return {
			id: uniqueId("dataSeries_"),
			samples: selectedSampleNames,
			data: selectedDataArray,
			extents: g_minmax
		};
	}
);

export const getPCPSelectedDimension = state => state.vis.selectedDimension;

export const getColorScheme = createSelector(
	[
		state => state.vis.colorSchemes,
		getAttrZ,
		getSampleColorOpacity,
		getSelectedDataArray
	],
	(
		colorSchemes,
		attrz,
		opacity,
		{extents}
	) => {
		const scheme = {
			type: 'Viridis',
			minDomain: 0,
			maxDomain: 10,
			colorDomain: [0, 10],
			opacity: 1,
			active: false,
			ordinary: false,
			reverse: false,
		};
		const tempExtents = extents[attrz];
		const minDomain = tempExtents && attrz !== 'sample' ? tempExtents[0]: 0;
		const maxDomain = tempExtents && attrz !== 'sample' ? tempExtents[1]: 10;

		const tempScheme = colorSchemes[attrz] ? colorSchemes[attrz]: {};

		let colorDomain = tempScheme.colorDomain;
		if (colorDomain != null) {
			let left = colorDomain[0];
			if (left < minDomain || left > maxDomain) left = minDomain;

			let right = colorDomain[1];
			if (right < minDomain || right > maxDomain) right = maxDomain;

			if (left > right) {
				const temp = left;
				left = right;
				right = temp;
			}

			colorDomain = [left, right];
		} else {
			colorDomain = [minDomain, maxDomain];
		}

		//console.log(tempExtents)
		if (tempExtents == null || attrz === 'sample') {
			return {
				...scheme,
				...tempScheme,
				minDomain,
				maxDomain,
				colorDomain
			};
		} else {
			if (attrz === 'sample') {
				return {
					...scheme,
					...tempScheme,
					type: 'Sample',
					minDomain: 0,
					maxDomain: tempExtents.length,
					colorDomain: [0, tempExtents.length],
					active: true,
					ordinary: true	
				};
			} else {
				return {
					...scheme,
					...tempScheme,
					minDomain,
					maxDomain,
					colorDomain,
					active: true,
					ordinary: false,
				};
			}	
		}
	}
)

export const getImageDomain = createSelector(
	[
		state => state.data.imgDomain
	],
	(domain) => {
		if (domain == null) return [0, 1];
		return domain;
	}
);

export const getImageColorInterpolator = createSelector(
	[
		state => state.data.imgColorScheme,
		state => state.data.imgColorMap
	],
	(
		colorScheme,
		colorMap
	 ) => {
		if (colorScheme === 'Custom') {
			const interpolator = colorMap == null
				? getColorInterpolator('Viridis')
				: t => {
					return colorMap(t * 255);
				}
			return interpolator;
		} else {
			return getColorInterpolator(colorScheme);
		}
	}
);

export const getImageColorTable = createSelector(
	[
		state => state.data.imgMinDomain,
		state => state.data.imgMaxDomain,
		state => state.data.imgDomain,
		//state => state.data.imgColorScheme
		getImageColorInterpolator
	],
	(
		minDomain,
		maxDomain,
		domain,
		imageColorInterpolator
	) => {
		const R = d3Range(256), G = d3Range(256), B = d3Range(256);
		if (domain == null) {
			return {
				R: R.map(v => v/255),
				G: G.map(v => v/255),
				B: B.map(v => v/255)
			}
		}
		const imgScale = scaleLinear().domain([minDomain, maxDomain]).range([0, 255]);
		const iDomain = domain.map(v => {
			return Math.floor(imgScale(v));
		});
		const iDomainWidth = iDomain[1] - iDomain[0];
		const interpolator = imageColorInterpolator;//getColorInterpolator(colorScheme);

		for (let i=0; i< 256; ++i) {
			let t;
			if (i < iDomain[0]) t = 0; 
			else if (i > iDomain[1]) t = 1; 
			else t = (i - iDomain[0]) / iDomainWidth;

			const rgb = interpolator(t);
			const rgbDigits = rgbToDigit(rgb);
			if (rgbDigits == null) {
				const rgbFromHex = hexToRgb(rgb);
				R[i] = rgbFromHex.r / 255;
				G[i] = rgbFromHex.g / 255;
				B[i] = rgbFromHex.b / 255;
			} else {
				R[i] = rgbDigits[0] / 255;
				G[i] = rgbDigits[1] / 255;
				B[i] = rgbDigits[2] / 255;	
			}
		}
		return {R, G, B};
	}
);