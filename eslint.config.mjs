import createBaseConfig from "@ermuz/eslint-config/base";

export default createBaseConfig({
  tsconfigRootDir: import.meta.dirname,
  ignores: [
    "**/node_modules/**",
    "**/dist/**",
    "**/.next/**",
    "**/out/**",
    "**/.turbo/**",
    "**/*.config.cjs",
    "**/*.config.mjs",
    "**/react-todo-app/**",
  ],
});
