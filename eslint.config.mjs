import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default [
  // --- Global ignores (replaces .eslintignore) ---
  {
    ignores: [
      'node_modules/**',
      'out/**',
      'release/**',
      'dist/**',
      'coverage/**',
      'src/renderer/utils/pyodide/src/**',
      '**/*.css.d.ts',
      '**/*.scss.d.ts',
    ],
  },

  // --- Base JS recommended rules ---
  js.configs.recommended,

  // --- TypeScript-eslint flat/recommended (array of 3 config objects) ---
  // Sets up @typescript-eslint parser + plugin globally and TS-specific rules.
  ...tsPlugin.configs['flat/recommended'],

  // --- React flat recommended ---
  {
    ...reactPlugin.configs.flat.recommended,
    settings: { react: { version: 'detect' } },
  },

  // --- React hooks recommended (flat config) ---
  reactHooksPlugin.configs['recommended-latest'],

  // --- TypeScript + React source files ---
  {
    files: ['src/**/*.{ts,tsx}', 'internals/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2020,
      },
    },
    plugins: {
      import: importPlugin,
      'jsx-a11y': jsxA11yPlugin,
      prettier: prettierPlugin,
    },
    settings: {
      react: { version: 'detect' },
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      'import/resolver': { node: {} },
    },
    rules: {
      // jsx-a11y recommended rules
      ...jsxA11yPlugin.configs.recommended.rules,

      // Prettier formatting
      ...prettierConfig.rules,
      'prettier/prettier': 'warn',

      // Downgrade from error → warn for gradual adoption
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',

      // Disabled from old config
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/naming-convention': 'off',
      'consistent-return': 'warn',
      'dot-notation': 'off',
      'import/no-extraneous-dependencies': 'off',
      'import/prefer-default-export': 'off',
      'import/no-cycle': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-autofocus': 'warn',
      'react/no-unknown-property': 'warn',
      'lines-between-class-members': 'off',
      'max-classes-per-file': 'off',
      'no-param-reassign': 'off',
      'no-plusplus': 'off',
      'no-restricted-syntax': 'off',
      'prefer-destructuring': 'warn',
      'react/destructuring-assignment': 'off',
      'react/jsx-curly-newline': 'off',
      'react/jsx-one-expression-per-line': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/jsx-wrap-multilines': 'off',
      'react/no-access-state-in-setstate': 'warn',
      'react/no-array-index-key': 'off',
      'react/no-did-update-set-state': 'warn',
      'react/no-will-update-set-state': 'warn',
      'react/prop-types': 'off',
      'react/static-property-placement': 'off',
    },
  },

  // --- Web Worker file — add worker globals so importScripts/self/etc. are known ---
  {
    files: ['src/**/webworker.js'],
    languageOptions: {
      globals: {
        ...globals.worker,
        ...globals.es2020,
        loadPyodide: 'readonly',
      },
    },
  },

  // --- Plain JS/JSX source files ---
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2020,
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...prettierConfig.rules,
      'prettier/prettier': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-param-reassign': 'off',
      'no-plusplus': 'off',
    },
  },

  // --- Internals scripts — Node.js, more relaxed ---
  {
    files: ['internals/**/*.{js,mjs,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2020,
      },
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'import/no-extraneous-dependencies': 'off',
    },
  },
];
