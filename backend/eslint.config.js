/**
 * ESLint flat config for backend (ESLint v9+)
 * Kept minimal to avoid affecting runtime behavior; only used by `npm run lint`.
 */

// @ts-check

const nodeJestConfig = {
  files: ["src/**/*.{js,jsx,ts,tsx}"],
  languageOptions: {
    ecmaVersion: 2021,
    sourceType: "commonjs",
    globals: {
      console: "readonly",
      process: "readonly",
      __dirname: "readonly",
      module: "readonly",
      require: "readonly",
      exports: "readonly",
      jest: "readonly",
      describe: "readonly",
      test: "readonly",
      beforeAll: "readonly",
      beforeEach: "readonly",
      afterAll: "readonly",
      afterEach: "readonly",
      expect: "readonly",
    },
  },
  linterOptions: {
    reportUnusedDisableDirectives: "warn",
  },
  rules: {
    // Keep rules minimal/relaxed; this file just makes `npm run lint` runnable.
  },
};

module.exports = [nodeJestConfig];
