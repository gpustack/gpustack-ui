import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import unusedImports from 'eslint-plugin-unused-imports';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const formModalFiles = [
  'src/pages/**/forms/**/*.{ts,tsx}',
  'src/pages/**/*-modal/**/*.{ts,tsx}',
  'src/pages/**/*-modal.tsx',
  'src/pages/**/components/*modal*.tsx',
  'src/pages/**/components/add-*.tsx',
  'src/pages/**/components/deploy-*.tsx',
  'src/pages/**/components/update-*.tsx'
];

export default defineConfig([
  globalIgnores([
    'public/static/',
    'dist',
    'src/.umi/',
    'src/.umi-production/',
    'src/.umi-test/',
    'src/components/iconfont/'
  ]),
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      prettier
    ],
    plugins: {
      react: reactPlugin,
      import: importPlugin,
      'unused-imports': unusedImports
    },
    settings: {
      react: {
        version: 'detect'
      },
      'import/resolver': {
        node: true,
        typescript: true
      }
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
        Global: 'readonly',
        React: 'readonly',
        JSX: 'readonly'
      }
    },
    rules: {
      'react/no-unstable-nested-components': 'warn',
      'no-unused-vars': 'off',
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unnecessary-type-constraint': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': 'off',
      'import/no-unresolved': 'off',
      'import/no-duplicates': 'error',
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/use-memo': 'off',
      'react-hooks/immutability': 'off',
      'no-unsafe-optional-chaining': 'warn',
      'no-empty': 'off',
      'no-constant-condition': 'off',
      'no-prototype-builtins': 'off',
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0, maxBOF: 0 }]
    }
  },
  {
    files: ['config/**/*.{ts,js}'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off'
    }
  },
  {
    files: formModalFiles,
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      'react-hooks/refs': 'warn',
      'no-unsafe-optional-chaining': 'warn'
    }
  }
]);
