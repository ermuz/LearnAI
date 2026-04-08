import createNestConfig from '@ermuz/eslint-config/nest';

export default [
  ...createNestConfig({
    tsconfigRootDir: import.meta.dirname,
    project: ['./tsconfig.json'],
  }),
];
