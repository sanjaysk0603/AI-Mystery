module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  globals: {
    describe: 'readonly',
    it: 'readonly',
    expect: 'readonly',
    vi: 'readonly',
    beforeEach: 'readonly',
    afterEach: 'readonly',
  },
  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:react-hooks/recommended'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
  settings: { react: { version: 'detect' } },
  rules: {
    'no-unused-vars': ['warn', { args: 'none' }],
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
  },
};
