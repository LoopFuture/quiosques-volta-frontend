// Learn more https://docs.expo.io/guides/customizing-metro
const { getSentryExpoConfig } = require('@sentry/react-native/metro')
const { getDefaultConfig } = require('expo/metro-config')
const { withTamagui } = require('@tamagui/metro-plugin')

const config = getSentryExpoConfig(__dirname, {
  getDefaultConfig,
})
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
