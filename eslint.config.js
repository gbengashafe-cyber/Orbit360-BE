import eslint from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import sonarjs from 'eslint-plugin-sonarjs';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import standardResponsePlugin from './eslint-rules/enforce-standard-response.cjs';

export default defineConfig(
  globalIgnores(['dist/']),
  sonarjs.configs.recommended,
  prettierConfig,
  eslint.configs.recommended,
  tseslint.configs.recommended,

  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js'],
    plugins: {
      prettier: prettierPlugin,
      custom: standardResponsePlugin,
    },
    rules: {
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      'custom/enforce-standard-response': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
