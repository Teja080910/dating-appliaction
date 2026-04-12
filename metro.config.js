/*
const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('@react-native/metro-config');

/!**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 *!/
const config = {
  transformer: {
    unstable_workerThreads: true,
  },
  watcher: {
    unstable_workerThreads: true,
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
*/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add project root to resolver options
config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [path.resolve(__dirname, 'node_modules')],
  sourceExts: ['expo.ts', 'expo.tsx', 'expo.js', 'expo.jsx', 'ts', 'tsx', 'js', 'jsx', 'json', 'cjs'],
};

module.exports = config;
