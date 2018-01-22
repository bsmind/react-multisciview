import { createSelector } from 'reselect';
import forEach from 'lodash.foreach';
import uniqBy from 'lodash.uniqby';
import get from 'lodash.get';
import uniqueId from 'lodash.uniqueid';
import { scaleLinear, scalePoint } from 'd3-scale';
import { extent as d3Extent } from 'd3-array';
import { sortAlphaNum } from '../utils';
import { format as d3Format } from 'd3-format';
import { markerProvider } from 'react-multiview/lib/series';


export const getShowImageSwitch = state => state.vis.showImage;

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
                const { data: dataSample, indexById, minmax } = dataObject;

                selectedDataArray = selectedDataArray.concat(dataSample);

                //console.log(sampleName, minmax);
                forEach(minmax, (value, attr) => {
                    if (g_minmax[attr] == null) {
                        g_minmax[attr] = value;
                    } else {
                        const t = types[attr];
                        let g_value = g_minmax[attr];
                        if (t === 'num') {
                            g_value[0] = Math.min(g_value[0], value[0]);
                            g_value[1] = Math.max(g_value[1], value[1]);
                        } else if (t === 'str') {
                            g_value = uniqBy(g_value.concat(value), d => d);
                            g_minmax[attr] = g_value;
                        } else {
                            // ignore unknown type
                        }
                    }
                });
           }
        });

        return {
            id: uniqueId('dataSeries_'),
            samples: selectedSampleNames,
            data: selectedDataArray,
            extents: g_minmax
        }
    }
);

// export const getMarkerProvider = createSelector(
//     [
//         getSelectedSampleColors,
//         getSampleColorOpacity,
//         getAttrZ
//     ],
//     (
//         colorsBySampleNames,
//         opacity,
//         attrz
//     ) => {
//         // todo: shape go to vis reducer
//         const shape = {
//             type: 'square',
//             width: 6,
//             height: 6,
//             defaultColor: '#FF0000',
//             style: {
//                 strokeWidth: 1,
//                 opacity
//             }
//         }
//         let mProvider = markerProvider(d => get(d, attrz), shape, 2.5);
//         if (attrz === 'sample') {
//             mProvider.colorSet(colorsBySampleNames);
//         }
//         return mProvider;
//     }
// );

