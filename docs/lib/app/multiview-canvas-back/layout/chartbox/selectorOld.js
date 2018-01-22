import { createSelector } from 'reselect';
import forEach from 'lodash.foreach';
import uniqBy from 'lodash.uniqby';
import get from 'lodash.get';
import { scaleLinear, scalePoint } from 'd3-scale';
import { extent as d3Extent } from 'd3-array';

import { sortAlphaNum } from '../../utils';

import { format as d3Format } from 'd3-format';

const getDataBySamples = state => state.data.dataBySamples;
const getSampleKinds = state => state.data.sampleKinds;
const getAttrTypes = state => state.data.attrTypes;

// const getSelectedSampleKeys = state => state.vis.samples;
// const getSelectedSampleColors = state => state.vis.sampleColors;
const getSelectedSampleKeys = state => state.data.samples;
const getSelectedSampleColors = state => state.data.sampleColors;

export const getAttrX = state => state.vis.attrx;
export const getAttrY = state => state.vis.attry;
export const getAttrZ = state => state.vis.attrz;


export const getXAccessor = createSelector(
    [
        getAttrX
    ],
    (attrx) => {
        return attrx.length ? d => get(d, attrx): null;
    }
);

export const getXType = createSelector(
    [
        getAttrX,
        getAttrTypes
    ],
    (attrx, types) => {
        return types[attrx];
    }
);

export const getXScale = createSelector(
    [
        getAttrX,
        getXType
    ],
    (attrx, type) => {
        return type === 'num' ? scaleLinear(): scalePoint();
    }
);

export const getYAccessor = createSelector(
    [
        getAttrY
    ],
    (attry) => {
        return attry.length ? d => get(d, attry): null;
    }
);

export const getYType = createSelector(
    [
        getAttrY,
        getAttrTypes
    ],
    (attry, types) => {
        return types[attry];
    }
);

export const getYScale = createSelector(
    [
        getAttrY,
        getYType
    ],
    (attry, type) => {
        return type === 'num' ? scaleLinear(): scalePoint();
    }
);

export const getZAccessor = createSelector(
    [
        getAttrZ
    ],
    (attrz) => {
        return attrz.length ? d => get(d, attrz): null;
    }
);

export const getColorAccessorBySample = d => d.sample;

export const getColorsBySampleNames = createSelector(
    [
        getSampleKinds,
        getSelectedSampleColors,
    ],
    (
        kinds,
        colors
    ) => {
        const colorsBySampleNames = {};
        forEach(colors, (color, key) => {
            colorsBySampleNames[kinds[key]] = color;
        });
        return colorsBySampleNames;
    }
);

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
                const { data, indexById, minmax } = dataObject;

                selectedDataArray = selectedDataArray.concat(data);

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
            data: selectedDataArray,
            extents: g_minmax
        }
    }
);

export const getSelectedDataObject = createSelector(
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
        if (selectedSampleNames.length === 0)
            return {
                data: null,
                extents: null
            }

        let selectedDataObject = {};
        const g_minmax = {};

        forEach(data, (dataObject, sampleName) => {
           if (selectedSampleNames.includes(sampleName)) {
                const { data, indexById, minmax } = dataObject;

                selectedDataObject[sampleName] = dataObject;

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
            data: selectedDataObject,
            extents: g_minmax
        }
    }
);

const getExtent = (data, accessor, type) => {
    return type === 'num'
        ? d3Extent(data, accessor)
        : uniqBy(data, accessor)
            .map(accessor)
            .sort(sortAlphaNum);
}

export const getSelectedSortedDataArray = createSelector(
    [
        getSelectedDataArray,
        getXAccessor,
        getYAccessor,
        getXType,
        getYType
    ],
    (
        {data, extents},
        xAccessor,
        yAccessor,
        xType,
        yType
    ) => {
        if (xAccessor == null || yAccessor == null || data == null || data.length === 0)
            return {data: [], extents: null};

        const comparator = xType === 'num'
            ? (a, b) => xAccessor(a) - xAccessor(b)
            : (a, b) => sortAlphaNum(xAccessor(a), xAccessor(b));

        const dataFilter = d => {
            return (xAccessor(d) != undefined && yAccessor(d) != undefined);
        };

        const filteredData = data.filter(dataFilter).sort(comparator);
        //console.log(filteredData)

        const xExtents = getExtent(filteredData, xAccessor, xType);
        const yExtents = getExtent(filteredData, yAccessor, yType);

        return {
            data: filteredData,
            xExtents,
            yExtents
        }
    }
);

// pcp

// sample, meta.data.annealing_temperature
const getPCPExtents = (outExtents, inExtents, key, type) => {
    if (outExtents[key] == null) {
        outExtents[key] = inExtents[key];
        return;
    } 
    if (type === 'num') {
        const extents = outExtents[key];
        extents[0] = Math.min(extents[0], inExtents[key][0]);
        extents[1] = Math.min(extents[1], inExtents[key][1]);
    } else { // type === 'str'
        outExtents[key] = outExtents[key].concat(inExtents[key]);
    }
}
export const getPCPDimension = createSelector(
    [
        getDataBySamples
    ],
    (
        dataBySamples
    ) => {
        const g_minmax = {};
        forEach(dataBySamples, (each, sampleName) => {
            const {minmax} = each;

            //const keys = Object.keys(minmax);
            getPCPExtents(g_minmax, minmax, 'sample', 'str');
            getPCPExtents(g_minmax, minmax, 'metadata_extract.data.annealing_temperature', 'num');
        });
        return g_minmax;
    }
);
export const getPCPData = createSelector(
    [
        getSelectedDataArray
    ],
    (
        {data, extents}
    ) => {
        console.log(data, extents);
    }
);
// end pcp


export const test = createSelector(
    [
        
    ],
    () => {
        const formatSi = d3Format(".3s");
        console.log('0 -> ', formatSi(0));
        console.log('10 -> ', formatSi(10));
        console.log('100 -> ', formatSi(100));
        console.log('1000 -> ', formatSi(1000));
        console.log('10000 -> ', formatSi(10000));
        console.log('100000 -> ', formatSi(100000));
        console.log('1000000 -> ', formatSi(1000000));
        console.log('0.1 -> ', formatSi(0.1));
        console.log('0.01 -> ', formatSi(0.01));
        console.log('0.001 -> ', formatSi(0.001));
        console.log('0.0001 -> ', formatSi(0.0001));
        console.log('0.00001 -> ', formatSi(0.00001));
        console.log('0.000001 -> ', formatSi(0.000001));
        
        
    }
);


