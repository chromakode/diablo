module.exports = function (config) {
  config.set({
    frameworks: ['mocha'],
    files: ['test/browser/*-test.js'],
    preprocessors: {
      'test/browser/*-test.js': ['webpack', 'sourcemap']
    },
    webpack: {
      devtool: 'inline-source-map',
      module: {
        preLoaders: [
          {
            test: /\.js$/,
            include: __dirname,
            exclude: [/node_modules/, /test/],
            loader: 'isparta'
          }
        ],
        loaders: [
          {
            test: /\.js$/,
            include: __dirname,
            exclude: /node_modules/,
            loader: 'babel',
            query: {
              plugins: ['babel-plugin-transform-es2015-template-literals']
            }
          }
        ]
      }
    },
    webpackMiddleware: {
      noInfo: true,
      watchOptions: {
        poll: true
      }
    },
    browsers: ['PhantomJS'],
    reporters: ['mocha', 'coverage'],
    coverageReporter: {
      reporters: [
        {type: 'text'},
        {type: 'lcovonly'}
      ]
    },
    port: 9876,
    singleRun: true
  })
}
