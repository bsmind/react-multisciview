import React from 'react';

import {Provider} from 'react-redux';
import {createStore, applyMiddleware} from 'redux';
import thunk from 'redux-thunk';

import {overrideComponentTypeChecker} from 'react-toolbox';
import reducers from './multiview/reducers';

import MultiViewApp from './multiview';

const middleware = applyMiddleware(thunk);
const store = createStore(reducers, middleware);


// if (process.env.NODE_ENV !== 'production') {
//     console.log('check')
//     overrideComponentTypeChecker((classType, reactElement) => (
//         reactElement && (
//             reactElement.type === classType ||
//             reactElement.type.name === classType.displayName
//         )
//     ));
// }

export default () => {
    return (
        <Provider store={store}>
            <MultiViewApp />
        </Provider>
    );
}
