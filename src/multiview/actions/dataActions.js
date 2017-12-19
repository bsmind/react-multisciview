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