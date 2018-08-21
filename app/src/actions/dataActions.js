import axios from "axios";
import { csvParse } from "d3-dsv";
import { PRIORITY, PriorityQueue } from "../utils";

const TIFF_MAX_REQUEST = 5;
const TIFF_TIMEOUT = 20;

const tiffRequest = [];
const pqTiff = new PriorityQueue();

// used to set state (only for simple assignment)
// it is requried to know field name
export function setValue(name, value) {
    return {
        type: "SET_VALUE",
        payload: {name, value}
    }
}

// used one time from appIndex.js
// todo: can move into appIndex.js as local function
export function get_color_map() {
	return dispatch => {
		axios.get("/static/resources/data/cm/Cool.csv")
			.then(response => response.data)
			.then(data => csvParse(data, d => {
				return {
					r: +d.Red,
					g: +d.Green,
					b: +d.Blue
				};
			}))
			.then(data => {
				dispatch({
					type: "GET_COLORMAP",
					payload: data
				});
			})
			.catch(e => {
				dispatch({
					type: "GET_COLORMAP_REJECTED",
					payload: e
				});
			});
	};    
}

// used to close snckbar from appIndex.js
export function close_message() {
    return {
        type: 'CLOSE_MESSAGE',
        payload: null
    }
}

// used to get data by sample names
export function get_data(sampleNames, path, recursive) {
    return dispatch => {
        axios.post("/api/data/sample", {sampleNames, path, recursive})
            .then(resp => {
                //console.log(resp.data)
                dispatch({
                    type: "GET_DATA",
                    payload: resp.data
                });
            })
            .catch(e => {
                dispatch({
                    type: "GET_DATA_REJECTED",
                    payload: e
                });
            });
    }
}

// used to add data
export function add_data(data) {
    return {
        type: 'ADD_DATA',
        payload: {data}
    }
}

// used to delte data by sample names
export function del_data(sampleNames) {
    return {
        type: "DEL_DATA",
        payload: sampleNames
    };
}

// used to change sample color
export function changeSelectedSampleColors(sampleName) {
    return {
        type: "CHANGE_SELECTED_SAMPLE_COLORS",
        payload: sampleName
    };
}

// used to handle image data request
const imageRequestOnProgress = () => {
    const count = tiffRequest.length + pqTiff.length();
    return count;
}

function get_tiff(key) {
    return dispatch => {
        const tokens = key.split("::");
        const id = tokens[0];
        const path = tokens[1];
        axios.post("/api/data/tiff", {id, path})
            .then(resp => {
                const idx = tiffRequest.indexOf(key);
                if (idx > -1) tiffRequest.splice(idx, 1);
                dispatch({
                    type: "GET_TIFF",
                    payload: {
                        id, 
                        data: resp.data, 
                        count: imageRequestOnProgress()
                    }
                });
            })
            .catch(e => {
                dispatch({
                    type: "GET_TIFF_REJECTED",
                    payload: e
                });
            });
    };
}

export function get_tiff_with_priority(id, path, priority=PRIORITY.LOW_MID) {
    return dispatch => {
        const key = `${id}::${path}`
        if (tiffRequest.indexOf(key) > -1) return;

        pqTiff.replace(key, priority, (a, b) => a === b);
        if (tiffRequest.length > TIFF_MAX_REQUEST) return;
        
        const pended = pqTiff.front();
        tiffRequest.push(pended.data);
        
        setTimeout(() => {
            dispatch(get_tiff(pended.data));
        }, TIFF_TIMEOUT * tiffRequest.length / pended.priority);
    };
}






export function changeDataAttr(dim, attr) {
    return {
        type: "CHANGE_DATA_ATTR",
        payload: {dim, attr}
    };
}

export function changeScatterColorDomain(domain) {
    return {
        type: "CHANGE_SCATTER_COLOR_DOMAIN",
        payload: domain
    };
}

export function changeScatterColorScheme(scheme) {
    return {
        type: "CHANGE_SCATTER_COLOR_SCHEME",
        payload: scheme
    };
}



export function changeImgColorScheme(newScheme) {
	return {
		type: "CHANGE_IMAGE_COLOR_SCHEME",
		payload: newScheme
	};
}

export function changeImgDomain(newDomain) {
	return {
		type: "CHANGE_IMAGE_DOMAIN",
		payload: newDomain
	};
}

export function changePCPSelectedAttrs(newAttrs) {
    return {
        type: "CHANGE_PCP_SELECTED_ATTRS",
        payload: newAttrs
    };
}



// to be deleted
export function update_db_info(db, col) {
    return {
        type: "UPDATE_DB_INFO",
        payload: {db, col}
    }
}