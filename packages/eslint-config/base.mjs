import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export const createBaseConfig = (options = {}) => {
  const { ignores = [], tsconfigRootDir = import.meta.dirname } = options;

  return [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
      files: ["**/*.{js,mjs,cjs,jsx}"],
      rules: {
        "no-unused-vars": [
          "error",
          { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
        ],
      },
    },
    {
      files: ["**/*.{ts,mts,cts,tsx}"],
      languageOptions: {
        parserOptions: {
          tsconfigRootDir,
        },
      },
      rules: {
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": [
          "error",
          { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
        ],
      },
    },
    eslintConfigPrettier,
    {
      ignores,
    },
  ];
};

export default createBaseConfig;
