import eslint from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import sonarjs from 'eslint-plugin-sonarjs';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import standardResponsePlugin from './eslint-rules/enforce-standard-response.cjs';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

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
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'prettier/prettier': ['error', { endOfLine: 'lf' }],
      'custom/enforce-standard-response': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  eslintConfigPrettier,
);
