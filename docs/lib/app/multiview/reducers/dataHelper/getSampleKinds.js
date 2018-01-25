import randomColor from "randomcolor";

const colorOptions = {
	luminosity: "random",
	hue: "random"
};

export const getRandomColor = (usedColors = []) => {
	let color;
	do {
		color = randomColor(colorOptions);
	} while (usedColors.indexOf(color) !== -1);
	return color;
};

export const getSampleKinds = (state, sampleKinds) => {
	const sampleColors = {}, usedColors = [];
	const sampleNames = Object.keys(sampleKinds).map(key => sampleKinds[key]);

	sampleNames.forEach(name => {
		const color = getRandomColor(usedColors);
		usedColors.push(color);
		sampleColors[name] = color; // eslint-disable-line
	});

	return {
		...state,
		sampleKinds,
		sampleColors
	};
};

export const changeSelectedSampleColors = (state, names) => {
	const sampleColors = { ...state.sampleColors };
	const usedColors = Object.keys(sampleColors).map(key => sampleColors[key]);

	names.forEach(name => {
		const color = getRandomColor(usedColors);
		usedColors.push(color);
		sampleColors[name] = color; // eslint-disable-line
	});

	return { ...state, sampleColors };
};

export const handleSampleColorChange = (state, sampleName) => {
	const sampleColors = { ...state.sampleColors };

	const prev = sampleColors[sampleName];
	let newColor;
	do {
		newColor = randomColor(colorOptions);
	} while (newColor === prev);

	sampleColors[sampleName] = newColor; // eslint-disable-line

	return {
		...state,
		sampleColors
	};
};