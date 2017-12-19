import {
    getSampleAttr
} from './dataHelper';

const INITIAL_STATE = {
    sampleKinds: {},

    attrKinds: {},
    attrMinMax: {}, // global min, max
    attrTypes: {}
}


export function dataReducers (state=INITIAL_STATE, action) {
    const {type, payload} = action;
    switch(type) {
        case "GET_SAMPLE_KINDS": return {...state, sampleKinds: payload};
        case "GET_SAMPLE_ATTR": return getSampleAttr(state, payload);
        default: return state;
    }
}




