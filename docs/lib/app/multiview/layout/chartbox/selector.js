import { createSelector } from 'reselect';
import forEach from 'lodash.foreach';
import uniqBy from 'lodash.uniqby';
import get from 'lodash.get';

const getDataBySamples = state => state.data.dataBySamples;
const getSampleKinds = state => state.data.sampleKinds;
const getAttrTypes = state => state.data.attrTypes;

const getSelectedSampleKeys = state => state.vis.samples;
const getSelectedSampleColors = state => state.vis.sampleColors;

const getAttrX = state => state.vis.attrx;
const getAttrY = state => state.vis.attry;
const getAttrZ = state => state.vis.attrz;


export const getXAccessor = createSelector(
    [
        getAttrX
    ],
    (attrx) => {
        return attrx.length ? d => get(d, attrx): null;
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
        getAttrTypes
    ],
    (
        selectedSampleNames,
        data,
        types
    ) => {
        let selectedDataArray = [];
        const g_minmax = {};

        forEach(data, (dataObject, sampleName) => {
           if (selectedSampleNames.includes(sampleName)) {
                const { data, indexById, minmax } = dataObject;
                selectedDataArray = selectedDataArray.concat(data);

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

export const getSelectedSortedDataArray = createSelector(
    [
        getSelectedDataArray,
        getXAccessor,
        getYAccessor
    ],
    (
        {data, extents},
        xAccessor,
        yAccessor
    ) => {
        if (xAccessor == null || yAccessor == null)
            return {data: null, extents: null};

        const sortedData = data.filter(d => (xAccessor(d) != undefined && yAccessor(d) != undefined))
                                .sort((a, b) => xAccessor(a) - xAccessor(b));

        return {
            data: sortedData,
            extents
        }
    }
);

export const test = createSelector(
    [
        getSelectedDataArray
    ],
    (output) => {
        console.log('test selector', output)
    }
);
