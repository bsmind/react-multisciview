import { scaleLinear } from "d3-scale";
import { interpolateRgb } from "d3-interpolate";

function hexToRgb(hex) { // eslint-disable-line
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
		r: parseInt(result[1], 16),
		g: parseInt(result[2], 16),
		b: parseInt(result[3], 16)
	} : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r, g, b) {
	return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function raw2gray(raw) {
	// const minv = raw.min;
	const maxv = raw.max;
	const { width, height, data } = raw;

	const cvs = document.createElement("canvas");
	const ctx = cvs.getContext("2d");

	cvs.width = width; // eslint-disable-line
	cvs.height = height; // eslint-disable-line

	const imageData = ctx.getImageData(0, 0, width, height);
	const pData = imageData.data;

	// const imgScale = scaleLinear().domain([minv, maxv]).range([0, 255]);
	const imgScale = scaleLinear().domain([0, Math.log(maxv)]).range([0, 255]);

	for (let i = 0; i < pData.length; i += 4) {
		const index = i / 4;
		const row = Math.floor(index / width);
		const col = index - row * width;

		let value = data[row][col];
		if (value < 1) value = 1;
		value = Math.log(value);

		pData[i] = pData[i + 1] = pData[i + 2] = imgScale(value); // eslint-disable-line
		pData[i + 3] = 255; // eslint-disable-line
	}

	ctx.putImageData(imageData, 0, 0);
	return cvs.toDataURL();
}

function raw2color(raw, colorMap) {
	// const minv = raw.min;
	const maxv = raw.max;
	const { width, height, data } = raw;

	const cvs = document.createElement("canvas");
	const ctx = cvs.getContext("2d");

	cvs.width = width; // eslint-disable-line
	cvs.height = height; // eslint-disable-line

	const imageData = ctx.getImageData(0, 0, width, height);
	const pData = imageData.data;

	// ???
	// const imgScale = scaleLinear().domain([minv, maxv]).range([0, 255]);
	const imgScale = scaleLinear().domain([0, Math.log(maxv)]).range([0, 255]);

	for (let i = 0; i < pData.length; i += 4) {
		const index = i / 4;
		const row = Math.floor(index / width);
		const col = index - row * width;

		let value = data[row][col];
		if (value < 1) value = 1;
		value = Math.log(value);
		value = imgScale(value);

		const rgb = colorMap(value);
		const rgbDigits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(rgb);
		const r = parseInt(rgbDigits[2]);
		const g = parseInt(rgbDigits[3]);
		const b = parseInt(rgbDigits[4]);

		pData[i] = r; // eslint-disable-line
		pData[i + 1] = g; // eslint-disable-line
		pData[i + 2] = b; // eslint-disable-line
		pData[i + 3] = 255; // eslint-disable-line
	}

	ctx.putImageData(imageData, 0, 0);
	return cvs.toDataURL();
}


export function getTiff(state, payload) {
	const { id, data } = payload;

	if (state.imgPool[id] == null) {
		const img = { [id]: {
			// url: raw2gray(data),
			url: state.imgColorMap
				? raw2color(data, state.imgColorMap)
				: raw2gray(data),
			...data
		} };
		// console.log(img)
		return { ...state, imgPool: { ...state.imgPool, ...img } };
	}

	return state;
}

export function getColorMap(state, payload) {
	const colors = payload.slice();
	colors.reverse();

	const domain = colors.map((d, i) => i);
	const range = colors.map(d => {
		return rgbToHex(d.r, d.g, d.b);
	});
	const colorScale = scaleLinear()
		.domain(domain)
		.range(range)
		.interpolate(interpolateRgb);

	return {
		...state,
		imgColorMap: colorScale.copy()
	};
}