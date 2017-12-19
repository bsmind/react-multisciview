import forEach from 'lodash.foreach';
import {getGraphDataFromSampleNames} from './getGraphData';


const INITIAL_STATE = {
    sampleKinds: {},
    graphData: {
        nodes: [], // 'id', 'r', 'group'
        links: []  // 'source', 'target', 'level'
    }
}

function getSampleKinds(state, payload) {
    const {nodes, links} = getGraphDataFromSampleNames(payload)
    return {...state, 
        sampleKinds: payload,
        graphData: {
            nodes,
            links
    }};
}

export function dataReducers (state=INITIAL_STATE, action) {
    const {type, payload} = action;
    switch(type) {
        case "GET_SAMPLE_KINDS": return getSampleKinds(state, payload);
        default: return state;
    }
}




