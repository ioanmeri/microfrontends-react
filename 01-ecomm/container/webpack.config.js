const HtmlWebpackPlugin = require("html-webpack-plugin");
const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");

module.exports = {
  mode: "development",
  devServer: {
    port: 8080,
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "container", // Not used, added for clarity. Only needed for Remotes
      remotes: {
        // List projects that the Container can search to get additional code
        products: "products@http://localhost:8081/remoteEntry.js", // Load the file at the listed URL if anything in Container has import like: import abc from 'products'
        //         |                          |-> URL for ther remoteEntry file
        //         |-> Related to the 'name' property in the Products webpack config file
        cart: "cart@http://localhost:8082/remoteEntry.js",
      },
    }),
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
  ],
};
