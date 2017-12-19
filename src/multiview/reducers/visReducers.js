import {
    AddDelSamples,
    changeSampleColor
} from './visHelper';

const INITIAL_STATE = {
    samples: [],
    sampleColors: {}
}



export function visReducers(state = INITIAL_STATE, action) {
    const {type, payload} = action;
    switch(type) {
        case 'ADD_DEL_SAMPLES': return AddDelSamples(state, payload);
        case 'CHANGE_SAMPLE_COLOR': return changeSampleColor(state, payload);
        default: return state;
    }
}