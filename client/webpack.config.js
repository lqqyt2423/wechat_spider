'use strict';

const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

let NODE_ENV = process.env.NODE_ENV || 'development';

let publicPath = '/';

const babelLoader = {
  loader: 'babel-loader',
  options: {
    cacheDirectory: true,
    presets: ['es2015', 'react', 'stage-2']
  }
};

const plugins = [
  new webpack.HotModuleReplacementPlugin(),
  new HtmlWebpackPlugin({
    title: 'react',
    template: './app/index.html'
  })
];

if (NODE_ENV != 'development') {
  publicPath = '';
  plugins.push(
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    }),
    new webpack.optimize.UglifyJsPlugin()
  );
}

module.exports = {
  entry: './app/index.jsx',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, './build'),
    publicPath: publicPath
  },
  plugins: plugins,
  devtool: NODE_ENV == 'development' ? 'eval' : undefined,
  devServer: {
    hot: true,
    contentBase: './',
    historyApiFallback: true,
    proxy: {
      '/api': 'http://localhost:8104',
      '/favicon.png': 'http://localhost:8104'
    }
  },
  module: {
    rules: [
      {
        test: /\.js|jsx$/,
        use: [
          babelLoader
        ],
        exclude: /(node_modules|bower_components)/
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf|svg)$/,
        use: [
          'file-loader'
        ]
      }
    ]
  }
};
