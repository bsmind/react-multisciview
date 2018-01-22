import {
    getSampleAttr,
    getSampleKinds,
    addDataSamples,
    handleSampleColorChange,
    getTiff,
    getColorMap,
    addSelectedDataItemList
} from './dataHelper';

const INITIAL_STATE = {
    sampleKinds: {},
    samples: [],    
    sampleColors: {},
    sampleColorOpacity: 0.5,

    attrKinds: {},
    attrMinMax: {}, // global min, max
    attrTypes: {},
    attrFormat: attrKey => attrKey,

    dataBySamples: {},
    numQueried: 0,

    imgPool: {},
    imgColorMap: null,

    selectedItemList: [],
}

function updateSelectedSamples(state, payload) {
    const {selected, colors} = payload;
    return {
        ...state,
        samples: selected,
        sampleColors: colors
    }
}


export function dataReducers (state=INITIAL_STATE, action) {
    const {type, payload} = action;
    //console.log(type, payload)
    switch(type) {
        case "GET_SAMPLE_KINDS": return getSampleKinds(state, payload);
        case "GET_SAMPLE_ATTR": return getSampleAttr(state, payload);
        case "ADD_DATA_SAMPLES": return addDataSamples(state, payload);

        case "UPDATE_SELECTED_SAMPLES": return updateSelectedSamples(state, payload);
        case "SAMPLE_COLOR_CHANGE": return handleSampleColorChange(state, payload);

        case "GET_TIFF": return getTiff(state, payload);
        case "GET_COLORMAP": return getColorMap(state, payload);

        case "ADD_SELECTED_DATA_LIST": return addSelectedDataItemList(state, payload);
        default: return state;
    }
}




