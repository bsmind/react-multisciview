import {
    AddDelSamples,
    changeSampleColor,
    setAttr
} from './visHelper';

const INITIAL_STATE = {
    samples: [],
    sampleColors: {},

    attrx: 'metadata_extract.data.sequence_ID',
    attry: 'metadata_extract.data.annealing_temperature',
    attrz: 'sample'
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