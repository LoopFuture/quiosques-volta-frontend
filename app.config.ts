import type { ExpoConfig } from 'expo/config'

const config: ExpoConfig = {
  name: 'Volta Frontend',
  slug: 'volta-frontend',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './src/assets/images/icon-light.png',
  scheme: 'voltafrontend',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './src/assets/images/splash.png',
    resizeMode: 'contain',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    bundleIdentifier: 'com.voltafrontend.app',
    supportsTablet: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
    icon: {
      light: './src/assets/images/icon-light.png',
      dark: './src/assets/images/icon-dark.png',
    },
    userInterfaceStyle: 'automatic',
  },
  android: {
    icon: './src/assets/images/icon-light.png',
    package: 'com.voltafrontend.app',
    userInterfaceStyle: 'automatic',
    adaptiveIcon: {
      foregroundImage: './src/assets/images/adaptive-icon.png',
    },
  },
  plugins: ['expo-router', 'expo-font', 'expo-system-ui'],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: '768d0ed6-c7e3-4b88-9ef2-8a4d1ba22381',
    },
  },
}

export default config
