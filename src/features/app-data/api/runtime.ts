import Constants from 'expo-constants'
import { MOCK_API_ORIGIN } from './constants'

export type ApiRuntimeConfig = {
  baseUrl?: string
  mockingEnabled: boolean
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

function toOptionalBoolean(value: unknown) {
  if (typeof value === 'boolean') {
    return value
  }

  return undefined
}

function getDefaultMockingEnabled() {
  return process.env.NODE_ENV !== 'production'
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
  const baseUrl = toOptionalString(apiConfig?.baseUrl)
  const mockingEnabled =
    toOptionalBoolean(apiConfig?.mockingEnabled) ?? getDefaultMockingEnabled()

  if (!mockingEnabled && !baseUrl) {
    throw new Error(
      'Missing app API runtime config. Define API_BASE_URL or enable API_MOCKING_ENABLED.',
    )
  }

  cachedApiRuntimeConfig = {
    ...(baseUrl ? { baseUrl } : {}),
    mockingEnabled,
    resolvedBaseUrl: mockingEnabled ? MOCK_API_ORIGIN : (baseUrl as string),
  }

  return cachedApiRuntimeConfig
}

export function isMockApiEnabled() {
  return getApiRuntimeConfig().mockingEnabled
}

export function resetApiRuntimeConfigForTests() {
  cachedApiRuntimeConfig = null
}
