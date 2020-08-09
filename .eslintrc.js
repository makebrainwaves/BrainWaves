module.exports = {
  extends: 'erb/typescript',
  rules: {
    // A temporary hack related to IDE not resolving correct package.json
    'consistent-return': 'warn',
    'dot-notation': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/prefer-default-export': 'off',
    'jsx-a11y/anchor-is-valid': 'warn',
    'jsx-a11y/click-events-have-key-events': 'warn',
    'lines-between-class-members': 'off',
    'max-classes-per-file': 'off',
    'no-param-reassign': 'off',
    'no-plusplus': 'off',
    'no-restricted-syntax': 'off',
    'prefer-destructuring': 'warn',
    'promise/no-return-wrap': 'warn',
    'react/destructuring-assignment': 'off',
    'react/jsx-curly-newline': 'off',
    'react/jsx-one-expression-per-line': 'off',
    'react/jsx-props-no-spreading': 'off',
    'react/jsx-wrap-multilines': 'off',
    'react/no-access-state-in-setstate': 'warn',
    'react/no-did-update-set-state': 'warn',
    'react/no-will-update-set-state': 'warn',
    'react/prop-types': 'off',
    'react/static-property-placement': 'off',
    'react/no-array-index-key': 'off',
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    createDefaultProgram: true,
  },
  settings: {
    'import/resolver': {
      // See https://github.com/benmosher/eslint-plugin-import/issues/1396#issuecomment-575727774 for line below
      node: {},
      webpack: {
        config: require.resolve('./configs/webpack.config.eslint.js'),
      },
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
  },
};
