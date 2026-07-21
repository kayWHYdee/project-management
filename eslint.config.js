// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/node_modules/**',
      '**/coverage/**',
      'apps/web/dist/**',
      'apps/api/prisma/migrations/**',
      '**/*.config.js',
      '**/*.config.ts',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // The brief bans `any` outright. Model it properly instead.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Disabled deliberately: NestJS relies on `emitDecoratorMetadata`, which
      // needs constructor-injected types to remain value imports. Enforcing
      // type-only imports would break dependency injection.
      '@typescript-eslint/consistent-type-imports': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  prettier,
);
