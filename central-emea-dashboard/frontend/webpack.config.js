const path = require('path');

// Try to load HtmlWebpackPlugin, but don't fail if it's not available
let HtmlWebpackPlugin;
try {
  HtmlWebpackPlugin = require('html-webpack-plugin');
} catch (error) {
  console.warn('HtmlWebpackPlugin not found, will not generate HTML file');
}

const config = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js',
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  plugins: []
};

// Add HtmlWebpackPlugin if available
if (HtmlWebpackPlugin) {
  config.plugins.push(
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html'
    })
  );
}

module.exports = config; 