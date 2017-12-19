import axios from 'axios';

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