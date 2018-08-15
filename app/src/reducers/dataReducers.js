import { getRandomColor, rgbToHex } from "../utils";
import { scaleLinear } from "d3-scale";
import { interpolateRgb } from "d3-interpolate";
import { get_tiff } from "./getImage";

const INIT_STATE = {
    /**
     * dataBySamples
     * - {[sampleName]: data object}
     * 
     * data object
     * - [data]: data array
     * - [minmax]: min, max values for numeric field
     * - [count]: data array size
     */
    dataBySamples: {},

    /**
     * sampleColors
     * - colors of each sample
     * - [sampleName]: color
     */
    sampleColors: {},

    // coordinate options
    attrx: "metadata_extract/data/sequence_ID",
    attry: "metadata_extract/data/annealing_temperature",
    attrz: "sample",
    scatterColorSchemes: {},
    scatterColorOpacity: 0.5,

    // image options
    showImage: false,
    minPoints: 40,
    minImageSize: 15,

    imgPool: {},
    imgColorMap: null,
    imgMinDomain: 0,
    imgMaxDomain: 1,
    imgDomain: null, //[0, 1],
    imgColorScheme: 'Custom',
    getOrigImgValue: null,

    numImageRequested: 0,

    // pcp options
    pcpSelectedAttrs: [
		"sample",
		"metadata_extract/data/annealing_temperature",
		"metadata_extract/data/annealing_time",
		"linecut_qr/data/fit_peaks_d0",
		"linecut_qr/data/fit_peaks_sigma1",
    ],

    // MongoDB 
    wdir: null,        // working directory for sync, watcher and db
    isRecursive: true, // if true, retrieve data, recursively from wdir to its sub-directories
    syncInfo: {},
    
    //dbName: null,
    //colName: null,

    //isMonitoring: false,
    //isSyncing: false,
    //syncerID: null,
    //syncTotal: 0,
    //syncProcessed: 0,



    // file watcher
    //wID: null,
    //isConnected: false,
    //isUpdatedByWatcher: false,
    //watcherIntervalTime: 5000,
    //wNodeKey: 'N0',
    //wNodeList: [['N0', {name: '/root', path: '/root', children: []}]],
    //wNodeMap: new Map([['N0', {name: '/root', path: '/root', children: []}]]),

    
    // temporal message
    message: '',
    messageReady: false,
    messageType: 'warning', // accept: green, warning: yellow, cancel: red
}

// set value
// - used to set simple value
const set_value = (state, payload) => {
    const {name, value} = payload;
    if (state.hasOwnProperty(name)) {
        return {...state, [name]: value};
    }
    return state;
}

// used to get user defined colormap
const get_color_map = (state, payload) => {
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


// - used to update dataBySamples
// - it overwrites data in 'sample' fields.
const _update_sample_colors = (state, sampleList) => {
    const sampleColors = {...state.sampleColors};
    const usedColors = Object.keys(sampleColors).map(key => sampleColors[key]);

	sampleList.forEach(name => {
        if (sampleColors[name] == null) {
            const color = getRandomColor(usedColors);
            usedColors.push(color);
            sampleColors[name] = color; // eslint-disable-line    
        }
	});

    return sampleColors;
}

const get_data = (state, payload) => {
    const {sampleList, sampleData} = payload;

    const dataBySamples = {...state.dataBySamples};
    const keyList = sampleList.map(name => {
        dataBySamples[name] = [...sampleData[name]];
        return name;
    });

    const sampleColors = _update_sample_colors(state, keyList);
    return {...state,
        dataBySamples: dataBySamples,
        sampleColors: sampleColors
    };
}

// used to update dataBySamples
// - it deletes data by selected sample names
const del_data = (state, payload) => {
    const dataBySamples = {...state.dataBySamples};
    payload.forEach(key => {
        delete dataBySamples[key];
    });
    return {...state, dataBySamples: dataBySamples};
}

// used to change sample color
const change_selected_sample_colors = (state, payload) => {
	const sampleColors = { ...state.sampleColors };
	const usedColors = Object.keys(sampleColors).map(key => sampleColors[key]);

	payload.forEach(name => {
		const color = getRandomColor(usedColors);
		usedColors.push(color);
		sampleColors[name] = color; 
	});

	return { ...state, sampleColors };    
}


// deprecated
const get_current_data_stat = (state, payload) => {
    const sampleNames = Object.keys(payload);
    const sampleColors = _update_sample_colors(state, sampleNames);

	return {
		...state,
		statBySamples: payload,
		sampleColors
	};    
}





const change_data_attr = (state, payload) => {
    const {dim, attr} = payload;
    let oldattr, fieldname;
    switch (dim) {
        case "x": oldattr = state.attrx; fieldname='attrx'; break;
        case "y": oldattr = state.attry; fieldname='attry'; break;
        case "z": oldattr = state.attrz; fieldname='attrz'; break;
        default: return state;
    }
    if (oldattr != attr) 
        return {...state, [fieldname]:attr };
    return state;
}

const change_scatter_color_domain = (state, payload) => {
    const domain = payload, attr = state.attrz;
    const prev = state.scatterColorSchemes[attr] ? state.scatterColorSchemes[attr]: {};
    return {...state, 
        scatterColorSchemes: {
            ...state.scatterColorSchemes,
            [attr]: {...prev, colorDomain: domain}
        }
    };
}

const change_scatter_color_scheme = (state, payload) => {
    const scheme = payload, attr = state.attrz;
    const prev = state.scatterColorSchemes[attr] ? state.scatterColorSchemes[attr]: {};
    return {...state,
        scatterColorSchemes: {
            ...state.scatterColorSchemes,
            [attr]: {...prev, type: scheme}
        }
    };
}

export function dataReducers(state = INIT_STATE, action) {
    const {type, payload} = action;

    let _type = type;
    if (_type.includes('REJECTED'))
        _type = "REJECTED"

    switch (_type) {
        case "SET_VALUE": return set_value(state, payload);
        case "CLOSE_MESSAGE": return {...state, messageReady: false};
        case "GET_COLORMAP": return get_color_map(state, payload);

        case "GET_DATA": return get_data(state, payload);
        case "DEL_DATA": return del_data(state, payload);
        case "CHANGE_SELECTED_SAMPLE_COLORS": 
            return change_selected_sample_colors(state, payload);



        case "GET_TIFF": return get_tiff(state, payload);
        
        case "CHANGE_DATA_ATTR": return change_data_attr(state, payload);
        case "CHANGE_SCATTER_COLOR_DOMAIN": return change_scatter_color_domain(state, payload);
        case "CHANGE_SCATTER_COLOR_SCHEME": return change_scatter_color_scheme(state, payload);

        case "CHANGE_IMAGE_COLOR_SCHEME": return {...state, imgColorScheme: payload};
        case "CHANGE_IMAGE_DOMAIN": return {...state, imgDomain: payload};
        case "CHANGE_PCP_SELECTED_ATTRS": return {...state, pcpSelectedAttrs: payload.slice()};

        
        case "REJECTED":
            console.log(payload);
            return state;

        default: return state;
    }
}