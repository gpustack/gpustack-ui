module.exports = {
  extends: require.resolve('@umijs/max/eslint'),
  rules: {
    'react/no-unstable-nested-components': 1,
    'no-unused-vars': 'off',
    'no-undef': 'error',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/class-name-casing': 'off'
  },
  globals: {
    Global: 'readonly',
    React: 'readonly',
    JSX: 'readonly'
  },
  ignorePatterns: ['public/static/']
};
