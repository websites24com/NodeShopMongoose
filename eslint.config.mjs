// eslint.config.mjs
// ESLint flat config for Node.js (CommonJS)

import js from '@eslint/js';
import pluginImport from 'eslint-plugin-import';
import pluginN from 'eslint-plugin-n';
import pluginUnused from 'eslint-plugin-unused-imports';
import globals from 'globals';

export default [
  // Base recommended config
  js.configs.recommended,

  {
    files: ['**/*.{js,cjs}'],

    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',   // ✅ CommonJS so require/module.exports are valid
      globals: {
        ...globals.node         // ✅ adds Node.js globals: require, module, __dirname, etc.
      },
    },

    plugins: {
      import: pluginImport,
      n: pluginN,
      'unused-imports': pluginUnused,
    },

    rules: {
      // Use unused-imports plugin instead of default no-unused-vars
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { args: 'after-used', argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],

      // ✅ stop ESLint from complaining about require/module.exports
      'import/no-commonjs': 'off',
      'import/unambiguous': 'off',
      'n/no-missing-require': 'off',
      'n/no-unsupported-features/es-syntax': 'off',
    },

    settings: {
      'import/resolver': {
        node: { extensions: ['.js', '.cjs'] },
      },
    },
  },

  {
    files: ['**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',  // ✅ treat .mjs as ESM
      globals: {
        ...globals.node,
      },
    },
  },
];
