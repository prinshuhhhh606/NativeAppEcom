module.exports = {
  root: true,
  extends: '@react-native',
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: true,
    ecmaFeatures: {
      jsx: true,
    },
    babelOptions: {
      configFile: require.resolve('./babel.config.js'),
    },
  },
};
