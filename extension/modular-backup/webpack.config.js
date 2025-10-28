const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'content.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  devtool: 'source-map', // For debugging
  optimization: {
    minimize: false, // Don't minify for easier debugging and manifest v3 compatibility
  },
};
