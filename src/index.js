import React from 'react';
import ReactDOM from 'react-dom';

import {Provider} from 'react-redux';
import {createStore, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';

import {overrideComponentTypeChecker} from 'react-toolbox';
import reducers from './multiview/reducers';

import MultiViewApp from './multiview';

const middleware = applyMiddleware(thunk);
const store = createStore(reducers, middleware);

const render = () => {
    ReactDOM.render(
        <Provider store={store}>
            <MultiViewApp />
        </Provider>
    , document.getElementById('app'));
};

if (process.env.NODE_ENV !== 'production') {
    overrideComponentTypeChecker((classType, reactElement) => (
        reactElement && (
            reactElement.type === classType ||
            reactElement.type.name === classType.displayName
        )
    ));
}

render();
