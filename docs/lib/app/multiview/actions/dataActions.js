import axios from 'axios';

const MAX_NUM_SAMPLE_QUERY = 6;
const SAMPLE_TIMEOUT = 300;

export function getSampleKinds() {
    return dispatch => {
        axios.get('/api/data/kinds/sample')
            .then(response => {
                dispatch({
                    type: 'GET_SAMPLE_KINDS',
                    payload: response.data
                })
            })
            .catch(e => {
                dispatch({
                    type: 'GET_SAMPLE_KINDS_REJECTED',
                    payload: e
                });
            });
    };
}

export function getAttributes() {
    return dispatch => {
        axios.get('/api/data/attr')
            .then(response => {
                dispatch({
                    type: 'GET_SAMPLE_ATTR',
                    payload: response.data
                });
            })
            .catch(e => {
                dispatch({
                    type: 'GET_SAMPLE_ATTR_REJECTED',
                    payload: e
                });
            });
    };
}

function getDataFromServer(list, total) {
    return dispatch => {
        axios.get('/api/data/sample', {
            params: {name: list}
        })
        .then(response => {
            const data = response.data;
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
    }
}

export function AddData(action, sampleNames) {
    return (dispatch, getState) => {
        if (action === 'ADD') {
            const dataBySamples = getState().data.dataBySamples;
            const dataToQuery = [];
            const dataHave = Object.keys(dataBySamples);

            sampleNames.forEach(name => {
                if (dataHave.findIndex(d => d === name) === -1)
                    dataToQuery.push(name);
            });

            if (dataToQuery.length) {
                for (let i=0; i < dataToQuery.length; i += MAX_NUM_SAMPLE_QUERY) {
                    const sliced = dataToQuery.slice(i, i + MAX_NUM_SAMPLE_QUERY);
                    setTimeout(() => {
                        dispatch(getDataFromServer(sliced, dataToQuery.length));
                    }, SAMPLE_TIMEOUT);
                }
            }
        }
    }
}

export function updateSelectedSamples(selected, colors) {

    //console.log(selected)
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
            for (let i=0; i < dataToQuery.length; i += MAX_NUM_SAMPLE_QUERY) {
                const sliced = dataToQuery.slice(i, i + MAX_NUM_SAMPLE_QUERY);
                setTimeout(() => {
                    dispatch(getDataFromServer(sliced, dataToQuery.length));
                }, SAMPLE_TIMEOUT);
            }
        }    

        dispatch({
            type: 'UPDATE_SELECTED_SAMPLES',
            payload: {selected, colors}                
        });
    }

    // return {
    //     type: 'UPDATE_SELECTED_SAMPLES',
    //     payload: {selected, colors}
    // }
}

export function handleColorChange(sampleName) {
    return {
        type: 'SAMPLE_COLOR_CHANGE',
        payload: sampleName
    };
}
