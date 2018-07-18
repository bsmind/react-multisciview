import axios from "axios";
import { csvParse } from "d3-dsv";
import { PRIORITY, PriorityQueue } from "../utils";

const TIFF_MAX_REQUEST = 5;
const TIFF_TIMEOUT = 20;

const tiffRequest = [];
const pqTiff = new PriorityQueue();

const imageRequestOnProgress = () => {
    const count = tiffRequest.length + pqTiff.length();
    return count;
}

// export function get_db_info(db, col) {
//     return dispatch => {
//         axios.get("/api/db", {params: {db, col}})
//             .then(resp => {
//                 dispatch({
//                     type: "GET_DB_INFO",
//                     payload: resp.data
//                 });
//             })
//             .catch(e => {
//                 dispatch({
//                     type: "GET_DB_INFO_REJECTED",
//                     payload: e
//                 });
//             });
//     }
// }

export function get_root_dir_list(wdir) {
    return dispatch => {
        axios.get("/api/watcher/dirlist", {params:{wdir}})
            .then(resp => {
                dispatch({
                    type: "GET_ROOT_DIR_LIST",
                    payload: resp.data
                });
            })
            .catch(e => {
                dispatch({
                    type: "GET_ROOT_DIR_LIST_REJECTED",
                    payload: e
                });
            });
    };
}

export function get_watcher_connect(wdir) {
    return dispatch => {
        axios.get("/api/watcher/connect", {params:{wdir}})
            .then(resp => {
                dispatch({
                    type: "GET_WATCHER_CONNECT",
                    payload: resp.data
                });
            })
            .catch(e => {
                dispatch({
                    type: "GET_WATCHER_CONNECT_REJECTED",
                    payload: e
                });
            });
    };
}

export function get_watcher_disconnect(wdir) {
    return dispatch => {
        axios.get("/api/watcher/disconnect", {params:{wdir}})
            .then(resp => {
                dispatch({
                    type: "GET_WATCHER_DISCONNECT",
                    payload: resp.data
                });
            })
            .catch(e => {
                dispatch({
                    type: "GET_WATCHER_DISCONNECT_REJECTED",
                    payload: e
                });
            });
    };
}

export function get_watcher_sync(wdir) {
    return dispatch => {
        axios.get("/api/watcher/sync", {params:{wdir}})
            .then(resp => {
                dispatch({
                    type: "GET_WATCHER_SYNC",
                    payload: resp.data
                });
            })
            .catch(e => {
                dispatch({
                    type: "GET_WATCHER_SYNC_REJECTED",
                    payload: e
                });
            });
    }
}

export function set_watcher_nodekey(nodekey) {
    return {
        type: "SET_WATCHER_NODEKEY",
        payload: nodekey
    };
}

export function get_watcher_monitor(wdir) {
    return dispatch => {
        axios.get("/api/watcher/monitor", {params:{wdir}})
            .then(resp => {
                dispatch({
                    type: "GET_WATCHER_MONITOR",
                    payload: resp.data
                });
            })
            .catch(e => {
                dispatch({
                    type: "GET_WATCHER_MONITOR_REJECTED",
                    payload: e
                });
            });
    };
}

export function set_sync_info(id, processed, total) {
    return {
        type: "SET_SYNC_INFO",
        payload: {id, processed, total}
    };
}

export function get_current_data_stat() {
    return dispatch => {
        axios.get("/api/data/stat")
            .then(resp => {
                dispatch({
                    type: "GET_CURRENT_DATA_STAT",
                    payload: resp.data
                });
            })
            .catch(e => {
                dispatch({
                    type: "GET_CURRENT_DATA_STAT_REJECTED",
                    payload: e
                });
            });
    };
}

export function get_data(db, col, sampleNames) {
    return dispatch => {
        axios.get("/api/data/sample", {params: {db, col, name: sampleNames}})
            .then(resp => {
                const data = resp.data;
                dispatch({
                    type: "GET_DATA",
                    payload: {data, db, col}
                });
            })
            .catch(e => {
                dispatch({
                    type: "GET_DATA_REJECTED",
                    payload: e
                });
            });
    };
}

export function del_data(sampleNames) {
    return {
        type: "DEL_DATA",
        payload: sampleNames
    };
}

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

function get_tiff(id) {
    return dispatch => {
        axios.get("/api/data/tiff/" + id)
            .then(resp => {
                const idx = tiffRequest.indexOf(id);
                if (idx > -1) tiffRequest.splice(idx, 1);
                dispatch({
                    type: "GET_TIFF",
                    payload: {id, data: resp.data, count: imageRequestOnProgress()}
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

export function get_tiff_with_priority(id, priority=PRIORITY.LOW_MID) {
    return dispatch => {
        if (tiffRequest.indexOf(id) > -1) return;

        pqTiff.replace(id, priority, (a, b) => a === b);
        if (tiffRequest.length > TIFF_MAX_REQUEST) return;
        
        const pended = pqTiff.front();
        tiffRequest.push(pended.data);
        
        setTimeout(() => {
            dispatch(get_tiff(pended.data));
        }, TIFF_TIMEOUT * tiffRequest.length / pended.priority);
    };
}

export function changeSelectedSampleColors(sampleName) {
    return {
        type: "CHANGE_SELECTED_SAMPLE_COLORS",
        payload: sampleName
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

export function setValue(name, value) {
    return {
        type: "SET_VALUE",
        payload: {name, value}
    }
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

export function close_message() {
    return {
        type: 'CLOSE_MESSAGE',
        payload: null
    }
}

export function update_db_info(db, col) {
    return {
        type: "UPDATE_DB_INFO",
        payload: {db, col}
    }
}