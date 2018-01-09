import {
    AddDelSamples,
    changeSampleColor,
    setAttr
} from './visHelper';

const INITIAL_STATE = {
    samples: [],
    sampleColors: {},

    attrx: '',
    attry: '',
    attrz: ''
}



export function visReducers(state = INITIAL_STATE, action) {
    const {type, payload} = action;
    switch(type) {
        case 'ADD_DEL_SAMPLES': return AddDelSamples(state, payload);
        case 'CHANGE_SAMPLE_COLOR': return changeSampleColor(state, payload);
        case 'SET_ATTR': return setAttr(state, payload);
        default: return state;
    }
}