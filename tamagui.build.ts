export default {
  components: ['tamagui'],
  config: './src/tamagui.config.ts',
  disableExtraction: process.env.NODE_ENV === 'development',
}
