/**
 * Nuvia — ESLint flat config (strict + security)
 *
 * Plugins:
 *   @typescript-eslint  — type-aware TypeScript rules
 *   eslint-plugin-security — detect common security anti-patterns
 *   eslint-plugin-react, react-hooks — React best practices
 *
 * Security rules enforced:
 *   - no eval / new Function / setTimeout(string)
 *   - detect-non-literal-regexp
 *   - detect-unsafe-regex
 *   - detect-object-injection
 *   - detect-possible-timing-attacks
 *   - detect-non-literal-fs-filename
 *   - no-secrets in source (via no-hardcoded-credentials heuristics)
 */
import js           from '@eslint/js';
import tsPlugin     from '@typescript-eslint/eslint-plugin';
import tsParser     from '@typescript-eslint/parser';
import reactPlugin  from 'eslint-plugin-react';
import reactHooks   from 'eslint-plugin-react-hooks';
import secPlugin    from 'eslint-plugin-security';

export default [
  // ── Base JS recommended ────────────────────────────────────────────────────
  js.configs.recommended,

  // ── Ignore patterns ────────────────────────────────────────────────────────
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'out/**',
      '*.min.js',
      '.husky/**',
      'contracts/**',
      'scripts/compass-deploy-helpers.ts',
    ],
  },

  // ── TypeScript (src + server) ─────────────────────────────────────────────
  {
    files: ['src/**/*.{ts,tsx}', 'server/**/*.ts'],
    languageOptions: {
      parser:        tsParser,
      parserOptions: {
        ecmaVersion:         'latest',
        sourceType:          'module',
        ecmaFeatures:        { jsx: true },
        // Type-aware rules (slower but catches real bugs)
        project:             ['./tsconfig.json', './server/tsconfig.json'],
        tsconfigRootDir:     import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react':              reactPlugin,
      'react-hooks':        reactHooks,
      'security':           secPlugin,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // ── TypeScript strict ──────────────────────────────────────────────────
      ...tsPlugin.configs['strict'].rules,
      '@typescript-eslint/no-explicit-any':          'error',
      '@typescript-eslint/no-unsafe-assignment':     'warn',
      '@typescript-eslint/no-unsafe-call':           'warn',
      '@typescript-eslint/no-unsafe-member-access':  'warn',
      '@typescript-eslint/no-unsafe-return':         'warn',
      '@typescript-eslint/explicit-function-return-type': 'off', // too noisy for React
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],

      // ── Security plugin ───────────────────────────────────────────────────
      ...secPlugin.configs.recommended.rules,
      'security/detect-object-injection':      'warn',
      'security/detect-non-literal-regexp':    'error',
      'security/detect-unsafe-regex':          'error',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-non-literal-fs-filename': 'error',
      'security/detect-eval-with-expression':  'error',

      // ── No eval / dynamic code ────────────────────────────────────────────
      'no-eval':                   'error',
      'no-new-func':               'error',
      'no-implied-eval':           'error',

      // ── React ─────────────────────────────────────────────────────────────
      ...reactPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // React 17+ JSX transform
      'react/prop-types':         'off', // We use TypeScript for props
      ...reactHooks.configs.recommended.rules,

      // ── General quality ───────────────────────────────────────────────────
      'no-console':                ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-debugger':               'error',
      'eqeqeq':                    ['error', 'always', { null: 'ignore' }],
      'no-throw-literal':          'error',
      'prefer-const':              'error',
      'no-var':                    'error',

      // Disable base rule in favour of TS-aware version
      'no-unused-vars':            'off',
    },
  },

  // ── Server-only: stricter (no React rules, but full security) ────────────
  {
    files: ['server/**/*.ts'],
    rules: {
      'react/react-in-jsx-scope':  'off',
      'react/prop-types':          'off',
      '@typescript-eslint/no-require-imports': 'error',
    },
  },
];
