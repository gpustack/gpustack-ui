module.exports = {
  extends: require.resolve('@umijs/max/eslint'),
  rules: {
    'react/no-unstable-nested-components': 1,
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'off'
  }
};
