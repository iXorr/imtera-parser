// @ts-check

import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig({
  files: ['**/*.{js,ts}'],
  extends: [js.configs.recommended, tseslint.configs.recommended],

  languageOptions: {
    sourceType: "module",
  },

  rules: {
    "comma-dangle": ["error", "always-multiline"],
    "no-trailing-spaces": "error",
    "eol-last": ["error", "always"],
    quotes: ["error", "double"],
    semi: ["error", "always"],
    indent: ["error", 2],
  },
});
