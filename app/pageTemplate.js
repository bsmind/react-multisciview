function getIndexContent() {
	return `<!-- Main jumbotron for a primary marketing message or call to action -->
			<div id="app" class="react-multiview"></div>`;
}

function getDocumentationContent() {
	return `<span id="debug_here">.</span>
		<span id="iconPreload" class="glyphicon glyphicon-arrow-down"></span>
		<div id="chart-goes-here"></div>`;
}


module.exports = function(params) {
	const { page } = params.htmlWebpackPlugin.options;
	const { chunks } = params.htmlWebpackPlugin.files;

	return `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="description" content="React MultiView">
        <meta name="author" content="sungsoo">
        <title>React MultiView - Home</title>
        <meta name="viewport" content="initial-scale=1.0,user-scalable=no,maximum-scale=1,width=device-width">
        <meta name="viewport" content="initial-scale=1.0,user-scalable=no,maximum-scale=1" media="(device-height: 568px)">
        <meta name="apple-mobile-web-app-title" content="Material Console">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="format-detection" content="telephone=no">
        <meta name="HandheldFriendly" content="True">
        <meta http-equiv="cleartype" content="on">
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700" rel="stylesheet">
        <script src="//cdnjs.cloudflare.com/ajax/libs/react/16.1.1/umd/react.production.min.js"></script>
        <script src="//cdnjs.cloudflare.com/ajax/libs/react-dom/16.1.1/umd/react-dom.production.min.js"></script>
        <script type="text/javascript" src="{{ url_for('static', filename='js/modernizr.js') }}"></script>
        <style>html, body { margin: 0; padding: 0; }</style>
    </head>
    <body>
        ${page === "index" ? getIndexContent() : getDocumentationContent()}

        <!-- Placed at the end of the document so the pages load faster -->
        ${page === "index"
		? `<script type="text/javascript" src="{{ url_for('static', filename='../${chunks["react-multiview-home"].entry}') }}"></script>`
		: `<script type="text/javascript" src="{{ url_for('static', filename='../${chunks["react-multiview-documentation"].entry}') }}"></script>`
}

    </body>
</html>`;
};
