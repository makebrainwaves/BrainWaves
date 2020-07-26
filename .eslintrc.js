module.exports = {
  extends: 'erb/typescript',
  rules: {
    // A temporary hack related to IDE not resolving correct package.json
    'import/no-extraneous-dependencies': 'off',
    'import/prefer-default-export': 'off',
    'lines-between-class-members': 'off',
    'react/destructuring-assignment': 'warn',
    'react/no-access-state-in-setstate': 'warn',
    'react/static-property-placement': 'off',
    'react/no-will-update-set-state': 'warn',
    'react/prop-types': 'off',
    'react/jsx-one-expression-per-line': 'off',
    'dot-notation': 'off',
    'prefer-destructuring': 'warn',
    'jsx-a11y/anchor-is-valid': 'warn',
    'jsx-a11y/click-events-have-key-events': 'warn',
    '@typescript-eslint/ban-ts-ignore': 'warn',
    'max-classes-per-file': 'off',
    'no-restricted-syntax': 'off',
    'no-plusplus': 'off'
  },
  settings: {
    'import/resolver': {
      // See https://github.com/benmosher/eslint-plugin-import/issues/1396#issuecomment-575727774 for line below
      node: {},
      webpack: {
        config: require.resolve('./configs/webpack.config.eslint.js')
      }
    }
  }
};
