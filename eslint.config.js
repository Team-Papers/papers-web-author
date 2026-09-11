import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      /**
       * A warning, not an error, until the five screens that copy server state
       * into an effect move onto a shared fetching layer. They do not cancel
       * their requests, so switching tab or typing a search while one is in
       * flight lets the slower response win and shows the previous results.
       * That is a data-layer refactor, not a lint fix, and it is tracked in
       * Team-Papers/papers-web-author#1 — visible rather than silenced.
       */
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
])
