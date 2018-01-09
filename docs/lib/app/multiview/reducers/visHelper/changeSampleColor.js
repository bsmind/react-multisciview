import {randomColor} from '../../utils/randomColor';

export default function changeSampleColor(state, payload) {
    const key = payload;
    let sampleColors = {...state.sampleColors};
    if (sampleColors[key]) sampleColors[key] = randomColor();
    return {...state, sampleColors}; 
}