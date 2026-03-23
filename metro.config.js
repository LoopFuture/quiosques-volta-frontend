const path = require('node:path')

// Learn more https://docs.expo.io/guides/customizing-metro
const { getSentryExpoConfig } = require('@sentry/react-native/metro')
const { getDefaultConfig } = require('expo/metro-config')
const { withTamagui } = require('@tamagui/metro-plugin')

const config = getSentryExpoConfig(__dirname, {
  getDefaultConfig,
})
const mswPackageDir = path.dirname(require.resolve('msw/package.json'))
const mswNodeModulesDir = path.resolve(mswPackageDir, '..')
// MSW still needs a few explicit native/browser entry aliases here.
// Treat msw and @mswjs/interceptors bumps as bundling-sensitive changes.
const mswNativeAliases = new Map([
  ['msw/native', path.join(mswPackageDir, 'lib/native/index.mjs')],
  [
    '@mswjs/interceptors',
    path.join(mswNodeModulesDir, '@mswjs/interceptors/lib/browser/index.mjs'),
  ],
  [
    '@mswjs/interceptors/fetch',
    path.join(
      mswNodeModulesDir,
      '@mswjs/interceptors/lib/browser/interceptors/fetch/index.mjs',
    ),
  ],
  [
    '@mswjs/interceptors/XMLHttpRequest',
    path.join(
      mswNodeModulesDir,
      '@mswjs/interceptors/lib/browser/interceptors/XMLHttpRequest/index.mjs',
    ),
  ],
  [
    '@mswjs/interceptors/WebSocket',
    path.join(
      mswNodeModulesDir,
      '@mswjs/interceptors/lib/browser/interceptors/WebSocket/index.mjs',
    ),
  ],
])

const originalResolveRequest = config.resolver.resolveRequest

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const aliasedModuleName = mswNativeAliases.get(moduleName) ?? moduleName

  // Preserve Sentry's resolver hooks while still applying the native MSW aliases.
  if (originalResolveRequest) {
    return originalResolveRequest(context, aliasedModuleName, platform)
  }

  return context.resolveRequest(context, aliasedModuleName, platform)
}
config.resolver.useWatchman = false
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
}
config.resolver.assetExts = config.resolver.assetExts.filter(
  (extension) => extension !== 'svg',
)
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg']

module.exports = withTamagui(config, {
  components: ['tamagui'],
  config: './src/tamagui.config.ts',
})
