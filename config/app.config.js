const webpack = require("webpack");
const path = require("path");

const { getIfUtils, removeEmpty } = require("webpack-config-utils");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const ProgressBarPlugin = require("progress-bar-webpack-plugin");
//const ExtractTextPlugin = require("extract-text-webpack-plugin");

const rootPath = path.join(__dirname, "..");
const rootPath2 = path.join(__dirname, "../../multisciview")

function buildConfig(mode) {
    const { ifWatch, ifDocs } = getIfUtils(mode, ["docs", "watch"]);

    const context = rootPath;
    const docsEntry = {
        "react-multiview-home": "./app/index.js"
        // "react-multiview-home": "./docs/indexFlask.js",
        // "react-multiview-documentation": "./docs/documentation.js",
    };
    const devServer = {
        contentBase: [
            //path.join(rootPath, "docs"),
            path.join(rootPath, "app"),
            path.join(rootPath, "build"),
            path.join(rootPath, "node_modules")
        ],
        host: process.env.IP,
        port: parseInt(process.env.PORT)
    };
    const loadersForDocs = [
        {
            test: /\.jpg$/,
            loader: "file-loader"
        },
        {
            test: /\.(png|svg)$/,
            loader: "url-loader?mimetype=image/png"
        },
        {
            test: /\.md$/,
            loaders: ["html-loader", "remarkable-loader"]
        },
        {
            test: /\.scss$/,
            loaders: ["style-loader", "css-loader", "autoprefixer-loader", "sass-loader?outputStyle=expanded"]
        },
        {
            test: /\.css$/,
            use: [
                "style-loader",
                {
                    loader: 'css-loader',
                    options: {
                        modules: true,
                        sourceMap: true,
                        importLoaders: 1,
                        localIndentName: '[name]--[local]--[hash:base64:8]'
                    }
                },
                "postcss-loader"
            ]
        },
    ];

    return {
        context,
        entry: docsEntry,
        output: {
            //path: path.join(rootPath, "multiview/"),
            path: path.join(rootPath2),
            filename: `static/js/[name]${ifDocs(".[chunkhash]","")}.js`,
            publicPath: "",
            library: "ReMultiview",
            libraryTarget: "umd",
            pathinfo: ifWatch(true, false),
        },
        watch: ifWatch(true, false),
        devtool: ifWatch("cheap-source-map", "sourcemap"),
        module: {
            loaders: removeEmpty([
                {
                    test: /\.(js|jsx)$/,
                    loaders: ["babel-loader"],
                    exclude: /node_modules/
                },
                ...loadersForDocs,
            ])
        },
        performance: {
            hints: false,
        },
        plugins: removeEmpty([
            new ProgressBarPlugin(),
            new webpack.NoEmitOnErrorsPlugin(),
            new webpack.optimize.OccurrenceOrderPlugin(),

            ifDocs(new webpack.DefinePlugin({
                "process.env": {
                    NODE_ENV: JSON.stringify("production"),
                },
            })),
            new HtmlWebpackPlugin({
                template: "./app/pageTemplate.js",
                inject: false,
                page: "index",
                mode,
                filename: path.join(rootPath2, "templates/index.html")
                //filename: "./templates/index.html"
            }),
            // new HtmlWebpackPlugin({
            //     template: "./docs/pageTemplateFlask.js",
            //     inject: false,
            //     page: "index",
            //     mode,
            //     filename: "./templates/index.html"
            // }),
            // new HtmlWebpackPlugin({
            //     template: "./docs/pageTemplateFlask.js",
            //     inject: false,
            //     page: "documentation",
            //     mode,
            //     filename: "./templates/documentation.html"
            // }),            
            new webpack.LoaderOptionsPlugin({
                options: { remarkable: getRemarkable(), context }
            }),
        ]),
        devServer,
        externals: {
            "react": "React",
            "react-dom": "ReactDOM",
        },
        resolve: {
            extensions: [".js", ".scss", ".css", ".md"],
            alias: {
                "react-multiview": path.join(rootPath, "src")
            },
            modules: ["app", "node_modules"]
        }
    };
}

function getRemarkable() {

	const Prism = require("prismjs");

	require("prismjs/components/prism-jsx");
	require("prismjs/plugins/line-numbers/prism-line-numbers");

	return {
		preset: "full",
		html: true,
		linkify: true,
		typographer: true,
		highlight: function(str, lang) {
			const grammer = lang === undefined || Prism.languages[lang] === undefined ? Prism.languages.markup : Prism.languages[lang];
			return Prism.highlight(str, grammer, lang);
		}
	};
}

module.exports = buildConfig;
