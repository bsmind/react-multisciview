export default (state, selectedSamples) => {
	const prev = state.samples.slice();
	let update = false;
	selectedSamples.forEach(key => {
		const index = prev.indexOf(key);
		if (index > -1) {
			prev.splice(index, 1);
			update = true;
		}
	});

	if (update)
		return { ...state, samples: prev };
	return state;
};