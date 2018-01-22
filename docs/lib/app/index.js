import React from 'react';

import {Provider} from 'react-redux';
import {createStore, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';

import {overrideComponentTypeChecker} from 'react-toolbox';
import reducers from './multiview/reducers';

import MultiViewApp from './multiview';

const middleware = applyMiddleware(thunk);
const store = createStore(reducers, middleware);

export default () => {
    return (
        <Provider store={store}>
            <MultiViewApp />
        </Provider>
    );
}
