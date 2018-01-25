"use strict";

import React from "react";
import ReactDOM from "react-dom";

import { csvParse } from "d3-dsv";

import Chart from "./lib/charts/MultiViewScatter";

const ReadME = require("md/MAIN.md");
require("stylesheets/re-multiview");

document.getElementById("content").innerHTML = ReadME;

if (!window.Modernizr.fetch || !window.Modernizr.promises) {
	require.ensure(["whatwg-fetch", "es6-promise"], function(require) {
		require("es6-promise");
		require("whatwg-fetch");
		loadPage();
	});
} else {
	loadPage();
}

function loadPage() {
	fetch("data/saxs.csv")
		.then(response => response.text())
		.then(data => csvParse(data, d => {
			d.item = d.item.length ? d.item : null;
			d.sample = d.sample.length ? d.sample : null;

			let temp;

			if (d.linecut_qr.length) {
				temp = d.linecut_qr;
				temp = JSON.parse(temp);
				d.linecut = temp;
			}

			if (d.metadata_extract.length) {
				temp = d.metadata_extract;
				temp = JSON.parse(temp);
				d.meta = temp;
			}
			return d;
		}))
		.then(data => data.filter(d => d.item != null))
		.then(data => {
			ReactDOM.render(<Chart data={data} />, document.getElementById("chart"));
		});
}
