import { createSelector } from "reselect";
import forEach from "lodash.foreach";
import uniqBy from "lodash.uniqby";
import uniqueId from "lodash.uniqueid";
import { markerProvider } from "react-multiview/lib/series"; // eslint-disable-line


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

