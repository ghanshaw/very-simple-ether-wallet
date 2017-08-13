const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
// const HtmlWebpackInlineSVGPlugin = require('html-webpack-inline-svg-plugin');


module.exports = {
  entry: './src/javascripts/index.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'bundle.js'
  },
  plugins: [
    // new HtmlWebpackPlugin({
    //   filename: 'views/main.html',
    //   template: 'src/views/main.ejs'
    // }),
      new FaviconsWebpackPlugin({
         // Your source logo
        logo: './src/images/logo.png',
        inject: true,
      }),
      new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'src/index.html',
      inject: 'head'
    }),
    // Copy our app's html files to the build folder.
    new CopyWebpackPlugin([
      // { from: 'src/index.html', to: "index.html" },
      { from: 'src/views/main.html', to: "views/main.html" },
      { from: 'src/views/about.html', to: "views/about.html" },
      { from: 'src/views/transact.html', to: "views/transact.html" }
    ]),
    
    
  ],
  module: {
    rules: [
      {
       test: /\.css$/,
       use: [ 'style-loader', 'css-loader' ]
      },
      {
          test: /\.svg$/,
          loader: 'raw-loader'
      },
      {
          test: /\.(png)$/,
          loader: 'file-loader'
      },
      {
        test: /\.scss$/,
        use: [{
            loader: "style-loader" // creates style nodes from JS strings
          }, { 
              loader: "css-loader" // translates CSS into CommonJS
          },  {
              loader: "sass-loader" // compiles Sass to CSS
          }]
        }
    ],
    loaders: [
      { test: /\.json$/, use: 'json-loader' },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015'],
          plugins: ['transform-runtime']
        }
      }
    ]
  }
}
