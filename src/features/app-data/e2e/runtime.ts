import Constants from 'expo-constants'

export type E2ERuntimeConfig = {
  enabled: boolean
}

let cachedE2ERuntimeConfig: E2ERuntimeConfig | null = null

export function getE2ERuntimeConfig(): E2ERuntimeConfig {
  if (cachedE2ERuntimeConfig) {
    return cachedE2ERuntimeConfig
  }

  const e2eConfig =
    Constants.expoConfig?.extra?.e2e &&
    typeof Constants.expoConfig.extra.e2e === 'object'
      ? (Constants.expoConfig.extra.e2e as Record<string, unknown>)
      : undefined

  cachedE2ERuntimeConfig = {
    enabled: e2eConfig?.enabled === true,
  }

  return cachedE2ERuntimeConfig
}

export function resetE2ERuntimeConfigForTests() {
  cachedE2ERuntimeConfig = null
}
