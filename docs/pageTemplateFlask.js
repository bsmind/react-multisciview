function getExternalAssets(mode) {
	switch (mode) {
	default:
        return `
        <script src="//cdnjs.cloudflare.com/ajax/libs/react/16.1.1/umd/react.production.min.js"></script>
		<script src="//cdnjs.cloudflare.com/ajax/libs/react-dom/16.1.1/umd/react-dom.production.min.js"></script>

		<link href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" rel="stylesheet">
		<link href="https://cdnjs.cloudflare.com/ajax/libs/prism/0.0.1/prism.css" rel="stylesheet">
		<script>
			(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
			(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
			m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
			})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

			ga('create', 'UA-61247721-1', 'auto');
			ga('send', 'pageview');
        </script>
        `;
	}
}

function getDevServerJs(mode) {
	if (mode === "watch") {
		return '<script type="text/javascript" src="/webpack-dev-server.js"></script>';
	}
	return "";
}

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
    const { mode, page } = params.htmlWebpackPlugin.options;
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
        ${getIndexContent()}

        <!-- Placed at the end of the document so the pages load faster -->
        ${`<script type="text/javascript" src="{{ url_for('static', filename='../${chunks["react-multiview-home"].entry}') }}"></script>`}

    </body>
</html>`;
}
