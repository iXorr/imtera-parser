import pluginVue from "eslint-plugin-vue";
import tseslint from "typescript-eslint";
import globals from "globals";

export default [
  {
    ignores: ["dist/**"],
  },

  ...tseslint.configs.recommended,
  ...pluginVue.configs["flat/recommended"],

  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },

  {
    languageOptions: {
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
    },

    rules: {
      "comma-dangle": ["error", "always-multiline"],
      "no-trailing-spaces": "error",
      "eol-last": ["error", "always"],
      quotes: ["error", "double"],
      semi: ["error", "always"],
      indent: ["error", 2],
      "vue/multi-word-component-names": "off",
    },
  },
];
