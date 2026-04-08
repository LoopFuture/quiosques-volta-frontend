import Constants from 'expo-constants'

export type ApiRuntimeConfig = {
  baseUrl: string
  resolvedBaseUrl: string
}

let cachedApiRuntimeConfig: ApiRuntimeConfig | null = null

function toOptionalString(value: unknown) {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmedValue = value.trim()

  return trimmedValue.length > 0 ? trimmedValue : undefined
}

function resolveBaseUrl(value: unknown) {
  const baseUrl = toOptionalString(value)

  if (!baseUrl) {
    throw new Error(
      'Missing or invalid API runtime config. Define API_BASE_URL in app config env.',
    )
  }

  try {
    new URL(baseUrl)
    return baseUrl
  } catch {
    throw new Error(
      'Missing or invalid API runtime config. Define API_BASE_URL in app config env.',
    )
  }
}

export function getApiRuntimeConfig(): ApiRuntimeConfig {
  if (cachedApiRuntimeConfig) {
    return cachedApiRuntimeConfig
  }

  const apiConfig =
    Constants.expoConfig?.extra?.api &&
    typeof Constants.expoConfig.extra.api === 'object'
      ? (Constants.expoConfig.extra.api as Record<string, unknown>)
      : undefined
  const baseUrl = resolveBaseUrl(apiConfig?.baseUrl)

  cachedApiRuntimeConfig = {
    baseUrl,
    resolvedBaseUrl: baseUrl,
  }

  return cachedApiRuntimeConfig
}

export function resetApiRuntimeConfigForTests() {
  cachedApiRuntimeConfig = null
}
