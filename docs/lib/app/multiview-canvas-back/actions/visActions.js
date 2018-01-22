export function AddDelSamples(action, keys) {
    return {
        type: 'ADD_DEL_SAMPLES',
        payload: {action, keys}
    };
}

export function changeSampleColor(key) {
    return {
        type: 'CHANGE_SAMPLE_COLOR',
        payload: key
    };
}

export function setAttr(dim, value) {
    return {
        type: "SET_ATTR",
        payload: {dim, value}
    };
}