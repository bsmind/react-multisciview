import {
    getSampleAttr,
    addDataSamples
} from './dataHelper';

const INITIAL_STATE = {
    sampleKinds: {},

    attrKinds: {},
    attrMinMax: {}, // global min, max
    attrTypes: {},

    dataBySamples: {},
    numQueried: 0,
}

export function dataReducers (state=INITIAL_STATE, action) {
    const {type, payload} = action;
    //console.log(type, payload)
    switch(type) {
        case "GET_SAMPLE_KINDS": return {...state, sampleKinds: payload};
        case "GET_SAMPLE_ATTR": return getSampleAttr(state, payload);
        case "ADD_DATA_SAMPLES": return addDataSamples(state, payload);
        default: return state;
    }
}




