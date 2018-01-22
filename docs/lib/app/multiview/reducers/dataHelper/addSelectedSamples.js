export default (state, selectedSamples) => {
    const prev = state.samples.slice();
    let update = false;
    selectedSamples.forEach(key => {
        if (prev.indexOf(key) === -1) {
            update = true;
            prev.push(key);
        }
    });

    if (update)
        return {...state, samples: prev};
    return state;
}