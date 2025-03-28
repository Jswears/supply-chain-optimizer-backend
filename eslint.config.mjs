import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
  js.configs.recommended,

  ...tseslint.configs.recommendedTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
      },
      globals: globals.node,
    },
  },

  {
    plugins: { prettier: prettierPlugin },
    rules: {
      'prettier/prettier': 'error',

      'capitalized-comments': ['error', 'always', { ignoreConsecutiveComments: true }],
      'consistent-return': 'error',
      'no-console': 'warn',
      'no-duplicate-imports': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],

      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        { allowExpressions: true, allowConciseArrowFunctionExpressionsStartingWithVoid: true },
      ],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/prefer-ts-expect-error': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },

  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    languageOptions: {
      globals: globals.jest,
    },
  },
];
