// craco.config.js
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Ignore source map warnings for MediaPipe
      webpackConfig.ignoreWarnings = [
        {
          message: /Failed to parse source map from.*@mediapipe\/tasks-vision/,
        },
      ];
      return webpackConfig;
    },
  },
};