const { defineConfig } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended')

module.exports = defineConfig([
  {
    ignores: [
      'dist/**',
      '.expo/**',
      '.pnpm-store/**',
      '.tamagui/**',
      'node_modules/**',
      'coverage/**',
      'expo-env.d.ts',
      '*.tsbuildinfo',
    ],
  },
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    files: ['src/tamagui.config.ts'],
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  {
    files: ['babel.config.js', 'metro.config.js'],
    languageOptions: {
      globals: {
        __dirname: 'readonly',
        module: 'readonly',
        process: 'readonly',
        require: 'readonly',
      },
    },
  },
])
