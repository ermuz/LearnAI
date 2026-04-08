// @ts-check
import eslint from "@eslint/js";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import globals from "globals";
import tseslint from "typescript-eslint";

export const createNestConfig = (options = {}) => {
  const {
    tsconfigRootDir = import.meta.dirname,
    ignores = [],
    project = ["./tsconfig.json"],
  } = options;

  return tseslint.config(
    {
      ignores: ["eslint.config.mjs", ...ignores],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    eslintPluginPrettierRecommended,
    {
      languageOptions: {
        globals: {
          ...globals.node,
          ...globals.jest,
        },
        sourceType: "commonjs",
        parserOptions: {
          project,
          tsconfigRootDir,
        },
      },
    },
    {
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-floating-promises": "warn",
        "@typescript-eslint/no-unsafe-argument": "warn",
        "prettier/prettier": ["error", { endOfLine: "auto" }],
      },
    },
  );
};

export default createNestConfig;
