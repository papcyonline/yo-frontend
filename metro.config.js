const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix web compatibility issues
config.resolver.platforms = ['ios', 'android', 'web'];

module.exports = config;