import Constants from 'expo-constants'

export type SentryRuntimeConfig = {
  dsn?: string
  enabled: boolean
  environment: string
  release?: string
  tracesSampleRate?: number
}

let cachedSentryRuntimeConfig: SentryRuntimeConfig | null = null

function toOptionalString(value: unknown) {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmedValue = value.trim()

  return trimmedValue.length > 0 ? trimmedValue : undefined
}

function toOptionalNumber(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined
  }

  return value
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

export function getSentryRuntimeConfig(): SentryRuntimeConfig {
  if (cachedSentryRuntimeConfig) {
    return cachedSentryRuntimeConfig
  }

  const sentryConfig =
    Constants.expoConfig?.extra?.sentry &&
    typeof Constants.expoConfig.extra.sentry === 'object'
      ? (Constants.expoConfig.extra.sentry as Record<string, unknown>)
      : undefined
  const dsn = toOptionalString(sentryConfig?.dsn)
  const environment =
    toOptionalString(sentryConfig?.environment) ??
    process.env.NODE_ENV ??
    'development'
  const release = toOptionalString(sentryConfig?.release)
  const tracesSampleRate =
    toOptionalNumber(sentryConfig?.tracesSampleRate) ??
    getDefaultSentryTracesSampleRate(environment)

  cachedSentryRuntimeConfig = {
    ...(dsn ? { dsn } : {}),
    enabled: Boolean(dsn),
    environment,
    ...(release ? { release } : {}),
    tracesSampleRate,
  }

  return cachedSentryRuntimeConfig
}

export function resetSentryRuntimeConfigForTests() {
  cachedSentryRuntimeConfig = null
}
