module.exports = {
  printWidth: 80,
  singleQuote: true,
  trailingComma: 'none',
  htmlWhitespaceSensitivity: 'strict',
  proseWrap: 'never',
  overrides: [{ files: '.prettierrc', options: { parser: 'json' } }],
  plugins: [
    'prettier-plugin-organize-imports',
    'prettier-plugin-packagejson',
    'eslint-plugin-unused-imports'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'off',
    'unused-imports/no-unused-imports-ts': 'off'
  }
};
