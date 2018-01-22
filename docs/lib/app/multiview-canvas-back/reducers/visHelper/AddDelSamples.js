import isArray from 'lodash.isarray';
import {randomColor} from '../../utils/randomColor';


function addSample(state, payload) {
    let keys = payload;
    if (!isArray(keys))
        keys = [keys];

    let samples = state.samples.slice();
    let sampleColors = {...state.sampleColors};

    keys.forEach(key => {
        if ( samples.findIndex(sample => sample === key) === -1 ) 
            samples = [...samples, key];
    
        if (!sampleColors[key]) sampleColors[key] = randomColor();
    });
    
    return {...state, samples, sampleColors};
}

function delSample(state, payload) {
    let keys = payload;
    if (!isArray(keys))
        keys = [keys];

    let samples = state.samples.slice();

    keys.forEach(key => {
        let index = samples.findIndex(sample => sample === key);
        if (index >= 0) samples.splice(index, 1);
    });
     
    return {...state, samples};    
}

export default function AddDelSamples(state, payload) {
    const {action, keys} = payload;
    switch (action) {
        case "ADD": return addSample(state, keys);
        case "DEL": return delSample(state, keys);
        default: return state;
    }
}