import axios from "axios";
import { csvParse } from "d3-dsv";
import {
	PRIORITY,
	PriorityQueue
} from "../utils";

const MAX_NUM_SAMPLE_QUERY = 6;
const SAMPLE_TIMEOUT = 300;

const TIFF_MAX_REQUEST = 5;
const TIFF_TIMEOUT = 20;

const tiffRequest = [];
// const tiffQueue = [];
const pqTiff = new PriorityQueue();

export const imageRequestOnProgress = () => {
	//console.log(tiffRequest.length, pqTiff.length())
	return tiffRequest.length + pqTiff.length();
}

export function getSampleKinds() {
	return dispatch => {
		axios.get("/api/data/kinds/sample")
			.then(response => {
				dispatch({
					type: "GET_SAMPLE_KINDS",
					payload: response.data
				});
			})
			.catch(e => {
				dispatch({
					type: "GET_SAMPLE_KINDS_REJECTED",
					payload: e
				});
			});
	};
}

// deprecated
export function getAttributes() {
	return dispatch => {
		axios.get("/api/data/attr")
			.then(response => {
				dispatch({
					type: "GET_SAMPLE_ATTR",
					payload: response.data
				});
			})
			.catch(e => {
				dispatch({
					type: "GET_SAMPLE_ATTR_REJECTED",
					payload: e
				});
			});
	};
}

function getDataFromServer(list, total) {
	return dispatch => {
		axios.get("/api/data/sample", {
			params: { name: list }
		})
			.then(response => {
				const data = response.data;
				// console.log('fomrServer', data)
				dispatch({
					type: "ADD_DATA_SAMPLES",
					payload: {
						sampleList: data.sampleList,
						sampleData: data.sampleData,
						total
					}
				});
			})
			.catch(e => {
				dispatch({
					type: "ADD_DATA_SAMPLES_REJECTED",
					payload: e
				});
			});
	};
}

export function AddData(action, sampleNames) {
	return (dispatch, getState) => {
		if (action === "ADD") {
			const dataBySamples = getState().data.dataBySamples;
			const dataToQuery = [];
			const dataHave = Object.keys(dataBySamples);

			sampleNames.forEach(name => {
				if (dataHave.findIndex(d => d === name) === -1)
					dataToQuery.push(name);
			});

			if (dataToQuery.length) {
				for (let i = 0; i < dataToQuery.length; i += MAX_NUM_SAMPLE_QUERY) {
					const sliced = dataToQuery.slice(i, i + MAX_NUM_SAMPLE_QUERY);
					setTimeout(() => {
						dispatch(getDataFromServer(sliced, dataToQuery.length));
					}, SAMPLE_TIMEOUT);
				}
			}
		}
	};
}

export function updateData(){
	return dispatch => {
		axios.get("api/data/sample/update")
			.then(response => {
				const data = response.data
				if (data.length > 0) {
					dispatch({
						type: 'UPDATE_DATA_SAMPLES',
						payload: data
					});
				}
			})
			.catch(e => {
				dispatch({
					type: 'UPDATE_DATA_SAMPLES_REJECTED',
					payload: e
				});
			});
	}
}

export function updateSelectedSamples(selected, colors) {
	return (dispatch, getState) => {
		const dataBySamples = getState().data.dataBySamples;
		const sampleKinds = getState().data.sampleKinds;

		const sampleNames = selected.map(key => sampleKinds[key]).filter(each => each != null);

		const dataToQuery = [];
		const dataHave = Object.keys(dataBySamples);

		sampleNames.forEach(name => {
			if (dataHave.findIndex(d => d === name) === -1)
				dataToQuery.push(name);
		});

		if (dataToQuery.length) {
			for (let i = 0; i < dataToQuery.length; i += MAX_NUM_SAMPLE_QUERY) {
				const sliced = dataToQuery.slice(i, i + MAX_NUM_SAMPLE_QUERY);
				setTimeout(() => {
					dispatch(getDataFromServer(sliced, dataToQuery.length));
				}, SAMPLE_TIMEOUT);
			}
		}

		dispatch({
			type: "UPDATE_SELECTED_SAMPLES",
			payload: { selected, colors }
		});
	};
}

export function addSelectedSamples(selected) {
	return (dispatch, getState) => {
		const dataBySamples = getState().data.dataBySamples;
		const sampleKinds = getState().data.sampleKinds;

		const sampleNames = selected.map(key => sampleKinds[key]).filter(each => each != null);

		const dataToQuery = [];
		const dataHave = Object.keys(dataBySamples);

		sampleNames.forEach(name => {
			if (dataHave.findIndex(d => d === name) === -1)
				dataToQuery.push(name);
		});

		if (dataToQuery.length) {
			for (let i = 0; i < dataToQuery.length; i += MAX_NUM_SAMPLE_QUERY) {
				const sliced = dataToQuery.slice(i, i + MAX_NUM_SAMPLE_QUERY);
				setTimeout(() => {
					dispatch(getDataFromServer(sliced, dataToQuery.length));
				}, SAMPLE_TIMEOUT);
			}
		}

		dispatch({
			type: "ADD_SELECTED_SAMPLES",
			payload: selected
		});
	};
}

export function delSelectedSamples(selectedKeys) {
	return {
		type: "DEL_SELECTED_SAMPLES",
		payload: selectedKeys
	};
}

export function changeSelectedSampleColors(selectedNames) {
	return {
		type: "CHANGE_SELECTED_SAMPLE_COLORS",
		payload: selectedNames
	};
}


export function handleColorChange(sampleName) {
	return {
		type: "SAMPLE_COLOR_CHANGE",
		payload: sampleName
	};
}

export function getTiff(id) {
	return dispatch => {
		axios.get("/api/data/tiff/" + id)
			.then(response => {
				const idx = tiffRequest.indexOf(id);
				if (idx > -1) tiffRequest.splice(idx, 1);
				dispatch({
					type: "GET_TIFF",
					payload: { id, data: response.data }
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

export function getTiffWithPriority(id, priority = PRIORITY.LOW_MID) {
	return dispatch => {
		// if it is on-going, discard the action
		if (tiffRequest.indexOf(id) > -1) return;

		// if it is not in the pended request, add the action
		pqTiff.replace(id, priority, (a, b) => a === b);

		// if there are more than 'threshold' on-going actions,
		// then, come later
		if (tiffRequest.length > TIFF_MAX_REQUEST) return;

		// consumes one of actions in the pended list
		const pended = pqTiff.front();
		tiffRequest.push(pended.data);

		// delay the execution proportional to the length of on-going task
		setTimeout( () => {
			dispatch(getTiff(pended.data));
		}, TIFF_TIMEOUT * tiffRequest.length / pended.priority);
	};
}

export function getColorMap() {
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

export function addSelectedDataList(list) {
	return {
		type: "ADD_SELECTED_DATA_LIST",
		payload: list
	};
}

export function setImageDomain(newDomain) {
	return {
		type: "SET_IMAGE_DOMAIN",
		payload: newDomain
	};
}

export function changeImgColorScheme(newScheme) {
	return {
		type: "CHANGE_IMAGE_COLOR_SCHEME",
		payload: newScheme
	};
}