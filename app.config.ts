import { existsSync } from 'node:fs'
import type { ExpoConfig } from 'expo/config'

function getEnvironmentVariable(
  name: string,
  options: { required?: boolean } = {},
) {
  const value = process.env[name]?.trim()

  if (!value && options.required) {
    throw new Error(
      `Missing required environment variable: ${name}. Add it to your local env before starting Expo.`,
    )
  }

  return value
}

function getFileEnvironmentVariable(name: string) {
  const value = getEnvironmentVariable(name)

  if (!value) {
    return undefined
  }

  if (!existsSync(value)) {
    throw new Error(
      `Invalid file path environment variable: ${name}. File not found at ${value}.`,
    )
  }

  return value
}

function parseScopes(value?: string) {
  if (!value) {
    return ['openid']
  }

  return value
    .split(/[\s,]+/)
    .map((scope) => scope.trim())
    .filter(Boolean)
}

function parseBoolean(
  name: string,
  value: string | undefined,
): boolean | undefined {
  if (!value) {
    return undefined
  }

  const normalizedValue = value.trim().toLowerCase()

  if (normalizedValue === 'true' || normalizedValue === '1') {
    return true
  }

  if (normalizedValue === 'false' || normalizedValue === '0') {
    return false
  }

  throw new Error(
    `Invalid boolean environment variable: ${name}. Use "true" or "false".`,
  )
}

function parseNumber(
  name: string,
  value: string | undefined,
  options: { max?: number; min?: number } = {},
): number | undefined {
  if (!value) {
    return undefined
  }

  const parsedValue = Number(value)

  if (!Number.isFinite(parsedValue)) {
    throw new Error(
      `Invalid numeric environment variable: ${name}. Use a finite number.`,
    )
  }

  if (typeof options.min === 'number' && parsedValue < options.min) {
    throw new Error(
      `Invalid numeric environment variable: ${name}. Use a value greater than or equal to ${options.min}.`,
    )
  }

  if (typeof options.max === 'number' && parsedValue > options.max) {
    throw new Error(
      `Invalid numeric environment variable: ${name}. Use a value less than or equal to ${options.max}.`,
    )
  }

  return parsedValue
}

function getDefaultApiMockingEnabled() {
  return process.env.NODE_ENV !== 'production'
}

function getBuildProfile() {
  const value = process.env.EAS_BUILD_PROFILE?.trim()

  return value ? value : undefined
}

function getDefaultSentryEnvironment() {
  return getBuildProfile() ?? process.env.NODE_ENV ?? 'development'
}

function getDefaultSentryTracesSampleRate(environment: string) {
  if (environment === 'development') {
    return 1
  }

  if (environment === 'test') {
    return 0
  }

  return 0
}

function getSentryPluginConfig() {
  const organization = getEnvironmentVariable('SENTRY_ORG')
  const project = getEnvironmentVariable('SENTRY_PROJECT')
  const url = getEnvironmentVariable('SENTRY_URL')

  const pluginConfig: {
    organization?: string
    project?: string
    url?: string
  } = {}

  if (organization) {
    pluginConfig.organization = organization
  }

  if (project) {
    pluginConfig.project = project
  }

  if (url) {
    pluginConfig.url = url
  }

  if (Object.keys(pluginConfig).length === 0) {
    return '@sentry/react-native/expo'
  }

  return ['@sentry/react-native/expo', pluginConfig] as [
    string,
    { organization?: string; project?: string; url?: string },
  ]
}

const defaultSentryEnvironment = getDefaultSentryEnvironment()
const sentryEnvironment =
  getEnvironmentVariable('SENTRY_ENVIRONMENT') ?? defaultSentryEnvironment
const easProjectId = '768d0ed6-c7e3-4b88-9ef2-8a4d1ba22381'
const androidGoogleServicesFile = getFileEnvironmentVariable(
  'ANDROID_GOOGLE_SERVICES_FILE',
)

const config: ExpoConfig = {
  name: 'Volta',
  slug: 'volta-frontend',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './src/assets/images/icon.png',
  scheme: 'voltafrontend',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './src/assets/images/splash.png',
    resizeMode: 'contain',
  },
  assetBundlePatterns: ['**/*'],
  runtimeVersion: {
    policy: 'fingerprint',
  },
  updates: {
    url: `https://u.expo.dev/${easProjectId}`,
  },
  ios: {
    bundleIdentifier: 'com.voltafrontend.app',
    supportsTablet: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
    icon: './src/assets/images/ios-icon.png',
    userInterfaceStyle: 'automatic',
  },
  android: {
    icon: './src/assets/images/android-icon.png',
    package: 'com.voltafrontend.app',
    userInterfaceStyle: 'automatic',
    ...(androidGoogleServicesFile
      ? {
          googleServicesFile: androidGoogleServicesFile,
        }
      : {}),
    adaptiveIcon: {
      foregroundImage: './src/assets/images/adaptive-icon.png',
      monochromeImage: './src/assets/images/adaptive-icon-monochrome.png',
      backgroundColor: '#ffffff',
    },
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-notifications',
    [
      'expo-local-authentication',
      {
        faceIDPermission:
          'Allow Volta to use Face ID to protect access to your account.',
      },
    ],
    'expo-secure-store',
    'expo-system-ui',
    getSentryPluginConfig(),
    [
      'expo-localization',
      {
        supportedLocales: {
          ios: ['pt-PT', 'en'],
          android: ['pt-PT', 'en'],
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: easProjectId,
    },
    keycloak: {
      clientId: getEnvironmentVariable('KEYCLOAK_CLIENT_ID', {
        required: true,
      }),
      issuerUrl: getEnvironmentVariable('KEYCLOAK_ISSUER_URL', {
        required: true,
      }),
      scopes: parseScopes(getEnvironmentVariable('KEYCLOAK_SCOPES')),
    },
    sentry: {
      dsn: getEnvironmentVariable('SENTRY_DSN'),
      environment: sentryEnvironment,
      release: getEnvironmentVariable('SENTRY_RELEASE'),
      tracesSampleRate:
        parseNumber(
          'SENTRY_TRACES_SAMPLE_RATE',
          getEnvironmentVariable('SENTRY_TRACES_SAMPLE_RATE'),
          {
            max: 1,
            min: 0,
          },
        ) ?? getDefaultSentryTracesSampleRate(sentryEnvironment),
    },
    api: {
      baseUrl: getEnvironmentVariable('API_BASE_URL'),
      mockingEnabled:
        parseBoolean(
          'API_MOCKING_ENABLED',
          getEnvironmentVariable('API_MOCKING_ENABLED'),
        ) ?? getDefaultApiMockingEnabled(),
    },
  },
}

export default config
