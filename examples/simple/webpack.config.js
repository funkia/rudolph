var path = require('path');

module.exports = {
  entry: ["babel-polyfill", "./src/index.ts"],
  output: {
    path: __dirname,
    filename: "bundle.js"
  },
  resolve: {
    extensions: [".ts", ".js"],
    modules: ["node_modules"]
  },
  module: {
    rules: [
      {test: /\.ts$/, exclude: /node_modules/, use: ["babel-loader", "ts-loader"]}
    ]
  }
};
