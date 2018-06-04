"use strict";
import React from "react";
import ReactDOM from "react-dom";

import App from "./src";

if (!window.Modernizr.fetch || !window.Modernizr.promises) {
    require.ensure(["whatwg-fetch", "es6-promise"], function(require){
        require("es6-promise");
        require("whatwg-fetch");
        loadPage()
    });
} else {
    loadPage()
}

function loadPage() {
    ReactDOM.render(
        App(),
        document.getElementById("app")
    );
}