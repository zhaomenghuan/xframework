const path = require("path");

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
    contentBase: [path.join(__dirname, "example"), path.join(__dirname, "dist")],
    compress: true,
    port: 9000
  }
};
