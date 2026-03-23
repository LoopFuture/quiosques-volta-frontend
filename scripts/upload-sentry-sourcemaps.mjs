import { spawnSync } from 'node:child_process'
import process from 'node:process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

const outputDir = process.argv[2]

if (!outputDir) {
  console.error(
    '[sentry] Missing export directory. Usage: node scripts/upload-sentry-sourcemaps.mjs <dist-dir>',
  )
  process.exit(1)
}

if (!process.env.SENTRY_AUTH_TOKEN?.trim()) {
  console.log(
    '[sentry] Skipping sourcemap upload because SENTRY_AUTH_TOKEN is not set.',
  )
  process.exit(0)
}

const uploadScript =
  require.resolve('@sentry/react-native/scripts/expo-upload-sourcemaps.js')
const result = spawnSync(process.execPath, [uploadScript, outputDir], {
  env: process.env,
  stdio: 'inherit',
})

process.exit(result.status ?? 1)
