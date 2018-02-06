import {
	getSampleAttr,
	getSampleKinds,
	addDataSamples,
	handleSampleColorChange,
	getTiff,
	getColorMap,
	addSelectedDataItemList,
	addSelectedSamples,
	delSelectedSamples,
	changeSelectedSampleColors
} from "./dataHelper";

const INITIAL_STATE = {
	sampleKinds: {},
	samples: [],
	sampleColors: {},
	sampleColorOpacity: 0.5,

	attrKinds: {},
	attrColorSchemes: {},
	attrMinMax: {}, // global min, max
	attrTypes: {},
	attrFormat: attrKey => attrKey,

	dataBySamples: {},
	numQueried: 0,

	imgPool: {},
	imgColorMap: null,
	imgMinDomain: 0,
	imgMaxDomain: 1,
	imgDomain: null,
	imgColorScheme: 'Cool',
	getOrigImgValue: null,

	selectedItemList: [],
};



export function dataReducers(state = INITIAL_STATE, action) {
	const { type, payload } = action;
	// console.log(type, payload)
	switch (type) {
	case "GET_SAMPLE_KINDS": return getSampleKinds(state, payload);
	case "GET_SAMPLE_ATTR": return getSampleAttr(state, payload);

	case "ADD_DATA_SAMPLES": return addDataSamples(state, payload);

	case "ADD_SELECTED_SAMPLES": return addSelectedSamples(state, payload);
	case "DEL_SELECTED_SAMPLES": return delSelectedSamples(state, payload);
	case "CHANGE_SELECTED_SAMPLE_COLORS": return changeSelectedSampleColors(state, payload);

	case "SAMPLE_COLOR_CHANGE": return handleSampleColorChange(state, payload);

	case "GET_TIFF": return getTiff(state, payload);
	case "GET_COLORMAP": return getColorMap(state, payload);
	case "SET_IMAGE_DOMAIN": return {...state, imgDomain: payload};
	case "CHANGE_IMAGE_COLOR_SCHEME": return {...state, imgColorScheme: payload};

	case "ADD_SELECTED_DATA_LIST": return addSelectedDataItemList(state, payload);
	default: return state;
	}
}




