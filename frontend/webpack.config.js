// This file might be created by Create React App under the hood
// You can create or modify it using craco or by ejecting
const path = require('path');

module.exports = {
  // Your existing webpack configuration...
  
  // Add this to ignore source map warnings for specific packages
  ignoreWarnings: [
    {
      // Ignore warnings about missing source maps for MediaPipe
      message: /Failed to parse source map from.*@mediapipe\/tasks-vision/,
    },
  ],
  
  // If you're using Create React App without ejecting, you can use craco instead
  // by creating a craco.config.js file with:
  /*
  module.exports = {
    webpack: {
      configure: (webpackConfig) => {
        // Add ignoreWarnings to the existing webpack config
        webpackConfig.ignoreWarnings = [
          {
            message: /Failed to parse source map from.*@mediapipe\/tasks-vision/,
          },
        ];
        return webpackConfig;
      },
    },
  };
  */
};