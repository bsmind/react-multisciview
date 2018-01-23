import {
    AddDelSamples,
    changeSampleColor,
    setAttr
} from './visHelper';

const INITIAL_STATE = {
    samples: [], // unused
    sampleColors: {}, // unused

    attrx: 'metadata_extract.data.sequence_ID',
    attry: 'metadata_extract.data.annealing_temperature',
    attrz: 'sample',

    showImage: false,

    // for pcp
    selectedDimension: [
        'sample',
        'metadata_extract.data.annealing_temperature',
        'metadata_extract.data.annealing_time',
        'linecut_qr.data.fit_peaks_d0',
        'linecut_qr.data.fit_peaks_sigma1'
    ], 
}

function setSwitch(state, payload) {
    const {name, value} = payload;
    switch(name) {
        case 'showImage': return {...state, showImage: value};
        default: return state;
    }
}

function setSelectDim(state, payload) {
    return {...state, selectedDimension: payload.slice()};
}

export function visReducers(state = INITIAL_STATE, action) {
    const {type, payload} = action;
    switch(type) {
        case 'ADD_DEL_SAMPLES': return AddDelSamples(state, payload);
        case 'CHANGE_SAMPLE_COLOR': return changeSampleColor(state, payload);
        case 'SET_ATTR': return setAttr(state, payload);
        case 'SET_SWITCH': return setSwitch(state, payload);
        case 'SET_PCP_SELECT_DIM': return setSelectDim(state, payload);
        default: return state;
    }
}