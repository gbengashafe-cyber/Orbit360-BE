import sonarjs from 'eslint-plugin-sonarjs';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([sonarjs.configs.recommended, globalIgnores(['dist/'])]);
