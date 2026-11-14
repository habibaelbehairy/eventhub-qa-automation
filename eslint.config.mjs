// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
  { ignores: ['node_modules/', 'playwright-report/', 'test-results/', 'blob-report/', '.auth/'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
    },
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    // Playwright fixtures must destructure their first argument, even when it is empty.
    files: ['fixtures/**/*.ts'],
    rules: { 'no-empty-pattern': 'off' },
  },
  {
    files: ['tests/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/expect-expect': ['warn', { assertFunctionNames: ['expect'] }],
      'playwright/no-skipped-test': ['error', { allowConditional: true }],
      // Data-driven cases loop over inputs and assert inside the loop on purpose.
      'playwright/no-conditional-in-test': 'off',
    },
  },
  {
    // Setup, teardown and cleanup steps prepare state; they fail by throwing instead of asserting.
    files: ['tests/setup/**/*.ts', 'scripts/**/*.ts'],
    rules: { 'playwright/expect-expect': 'off' },
  },
  {
    files: ['eslint.config.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },
);
