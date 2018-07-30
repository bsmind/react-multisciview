import React from "react";
import { Provider } from "react-redux";
import { createStore, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import reducers from "./reducers";

import MultiViewApp from "./appIndex";


const middleware = applyMiddleware(thunk);
const store = createStore(reducers, middleware);

const evtSource = new EventSource('/stream');
evtSource.onmessage = function (event) {
    console.log(event, event.data);
}


export default () => {
    return (
        <Provider store={store}>
            <MultiViewApp />
        </Provider>
    );
};