const path = require('path');

module.exports = {
    plugins: {
        'postcss-import': {
            root: __dirname,
            path: [path.join(__dirname, './node_modules/react-toolbox/lib')]
        },
        'postcss-mixins': {},
        'postcss-each': {},
        'postcss-cssnext': {
            features: {
                customProperties: {
                    variables: {
                        unit: '9px'
                    }
                }
            },
            browsers: ['last 2 versions', '> 5%']
        },
        'postcss-nesting': {},
        'postcss-nested': {},
    }
}
