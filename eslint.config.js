import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import sonarjs from 'eslint-plugin-sonarjs';
import { globalIgnores } from 'eslint/config';
import standardResponsePlugin from './eslint-rules/enforce-standard-response.cjs';

export default [
  globalIgnores(['dist/']),
  sonarjs.configs.recommended,

  {
    // 3. Files and Language Options (Replacement for 'env' and 'parserOptions')
    files: ['**/*.ts', '**/*.tsx', '**/*.js'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Replacement for env: { node: true }
        process: 'readonly',
        __dirname: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
      custom: standardResponsePlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      'custom/enforce-standard-response': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  prettierConfig,
];
