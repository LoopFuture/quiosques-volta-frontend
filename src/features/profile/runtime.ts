import Constants from 'expo-constants'

export type ProfileWebAppRuntimeConfig = {
  baseUrl: string
}

let cachedRuntimeConfig: ProfileWebAppRuntimeConfig | null = null

function resolveBaseUrl(value: unknown) {
  if (typeof value !== 'string') {
    throw new Error(
      'Missing or invalid profile web app runtime config. Define WEB_APP_BASE_URL in app config env.',
    )
  }

  const baseUrl = value.trim()

  if (!baseUrl) {
    throw new Error(
      'Missing or invalid profile web app runtime config. Define WEB_APP_BASE_URL in app config env.',
    )
  }

  try {
    new URL(baseUrl)

    return baseUrl
  } catch {
    throw new Error(
      'Missing or invalid profile web app runtime config. Define WEB_APP_BASE_URL in app config env.',
    )
  }
}

export function getProfileWebAppRuntimeConfig(): ProfileWebAppRuntimeConfig {
  if (cachedRuntimeConfig) {
    return cachedRuntimeConfig
  }

  const webAppConfig =
    Constants.expoConfig?.extra?.webApp &&
    typeof Constants.expoConfig.extra.webApp === 'object'
      ? (Constants.expoConfig.extra.webApp as Record<string, unknown>)
      : undefined

  cachedRuntimeConfig = {
    baseUrl: resolveBaseUrl(webAppConfig?.baseUrl),
  }

  return cachedRuntimeConfig
}

export function getProfileLegalLinkUrl(path: string) {
  return new URL(path, getProfileWebAppRuntimeConfig().baseUrl).toString()
}

export function resetProfileWebAppRuntimeConfigForTests() {
  cachedRuntimeConfig = null
}
