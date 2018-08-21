import { scaleLinear } from "d3-scale";
import { interpolateRgb } from "d3-interpolate";
import { rgbToHex } from "../utils";


function raw2gray(raw) {
	const minv = Math.max(raw.min, 1);
	const maxv = raw.max;
	const { width, height, data } = raw;

	const cvs = document.createElement("canvas");
	const ctx = cvs.getContext("2d");

	cvs.width = width; // eslint-disable-line
	cvs.height = height; // eslint-disable-line

	const imageData = ctx.getImageData(0, 0, width, height);
	const pData = imageData.data;

	// const imgScale = scaleLinear().domain([minv, maxv]).range([0, 255]);
	const imgScale = scaleLinear().domain([Math.log(minv), Math.log(maxv)]).range([0, 255]);

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

function raw2gray255(raw) {
	const { width, height, data } = raw;

	const cvs = document.createElement("canvas");
	const ctx = cvs.getContext("2d");

	cvs.width = width; // eslint-disable-line
	cvs.height = height; // eslint-disable-line

	const imageData = ctx.getImageData(0, 0, width, height);
	const pData = imageData.data;

	// const imgScale = scaleLinear().domain([minv, maxv]).range([0, 255]);
	//const imgScale = scaleLinear().domain([Math.log(minv), Math.log(maxv)]).range([0, 255]);

	for (let i = 0; i < pData.length; i += 4) {
		const index = i / 4;
		const row = Math.floor(index / width);
		const col = index - row * width;

		let value = data[row][col];
		value = Math.round(value);
		//if (value < 1) value = 1;
		//value = Math.log(value);

		pData[i] = pData[i + 1] = pData[i + 2] = value; // eslint-disable-line
		pData[i + 3] = 255; // eslint-disable-line
	}

	ctx.putImageData(imageData, 0, 0);
	return cvs.toDataURL();
}

export function get_tiff(state, payload) {
    const { id, data, count } = payload;
    
    if (Object.keys(data).length == 0)
        return state;

	if (typeof data.data === "string") {
		//console.log('no tiff for ', id, data);
		const img = {[id]: {url: null}}
		return {
			...state,
			imgPool: {...state.imgPool, ...img}
		};
	}

	if (state.imgPool[id] == null) {
		if (data.channel === 3) {
			const img = {[id]: {
				url: raw2gray255(data),
				...data
			}};
			const imgMinDomain = 0;
			const imgMaxDomain = 255;
			return { ...state,
				imgPool: {...state.imgPool, ...img},
				imgMinDomain,
				imgMaxDomain,
				imgDomain: state.imgDomain == null 
					? [imgMinDomain, imgMaxDomain]
					: state.imgDomain,
				getOrigImgValue: null,
				numImageRequested: count,
			};
		} else {		
			const img = { [id]: {
				url: raw2gray(data),
				// url: state.imgColorMap
				// 	? raw2color(data, state.imgColorMap)
				// 	: raw2gray(data),
				...data
			} };
			
			const imgMinDomain = Math.log(Math.max(Math.min(data.min, state.imgMinDomain), 1));
			const imgMaxDomain = Math.log(Math.max(data.max, state.imgMaxDomain));

			return { ...state, 
				imgPool: { ...state.imgPool, ...img },
				imgMinDomain: imgMinDomain,
				imgMaxDomain: imgMaxDomain,
				imgDomain: state.imgDomain == null 
					? [imgMinDomain, imgMaxDomain]
					: state.imgDomain,
				getOrigImgValue: v => Math.exp(v), 
				numImageRequested: count
			};
		}
	}

	return state;
}