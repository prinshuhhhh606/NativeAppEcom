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
  rules: {
    'react-native/no-inline-styles': 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  },
};
