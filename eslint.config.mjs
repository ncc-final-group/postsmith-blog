import { dirname } from 'path';
import { fileURLToPath } from 'url';

import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.config({
    ignorePatterns: ['.next/**/*.ts', '.next/**/*.tsx', '**/*.config.mjs', '**/*.config.ts'],
    extends: ['next/core-web-vitals', 'prettier'],
    plugins: ['import'],
    rules: {
      camelcase: 'off',
      'no-console': ['error', { allow: ['assert'] }],
      'no-alert': 'off',
      'linebreak-style': 'off',
      'no-underscore-dangle': 'off',
      'dot-notation': 'off',
      'max-len': ['warn', { code: 180, ignoreComments: true }],
      indent: ['warn', 2, { flatTernaryExpressions: true, offsetTernaryExpressions: true, SwitchCase: 1 }],
      'no-plusplus': 'off',
      'object-curly-newline': ['error', { multiline: true }],
      'no-extra-semi': 'warn',
      'no-multi-spaces': 'warn',
      'key-spacing': 'warn',
      'no-use-before-define': [
        'error',
        {
          functions: true,
          classes: true,
          variables: true,
          allowNamedExports: true,
        },
      ],
      'sort-imports': [
        'error',
        {
          ignoreCase: true,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
          allowSeparatedGroups: true,
        },
      ],
      'no-unused-vars': 'warn',
      'import/no-unresolved': 'off',
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'never',
          jsx: 'never',
          ts: 'never',
          tsx: 'never',
        },
      ],
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', ['parent', 'sibling'], 'index', 'object', 'type'],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          'newlines-between': 'always',
        },
      ],
    },
  }),
  { files: ['**/*.ts', '**/*.tsx'] },
];

export default eslintConfig;
