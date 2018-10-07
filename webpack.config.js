const path = require("path");
const webpack = require("webpack");
const version = require("./package").version;

module.exports = {
  mode: "none",
  entry: "./src/index.js",
  output: {
    filename: "xframework.js",
    path: path.resolve(__dirname, "dist")
  },
  resolve: {
    extensions: [".js", ".json", ".ts"]
  },
  devServer: {
    contentBase: [
      path.join(__dirname, "test"),
      path.join(__dirname, "dist")
    ],
    compress: true,
    open: true,
    port: 9000
  },
  plugins: [
    new webpack.BannerPlugin(`XFramework.js v${version}
copyright zhaomenghuan(https://zhaomenghuan.js.org/)
Released under the MIT License. `)
  ]
};
