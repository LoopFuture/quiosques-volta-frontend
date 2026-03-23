import Constants from 'expo-constants'
import { makeRedirectUri, type DiscoveryDocument } from 'expo-auth-session'
import { z } from 'zod/v4'
import {
  KEYCLOAK_NATIVE_REDIRECT_URI,
  KEYCLOAK_REDIRECT_PATH,
  KEYCLOAK_SCHEME,
} from '../constants'

const keycloakRuntimeConfigSchema = z.object({
  clientId: z.string().min(1),
  issuerUrl: z.string().url(),
  scopes: z.array(z.string().min(1)).min(1).default(['openid']),
})

export type KeycloakRuntimeConfig = z.infer<typeof keycloakRuntimeConfigSchema>
export { KEYCLOAK_NATIVE_REDIRECT_URI, KEYCLOAK_REDIRECT_PATH, KEYCLOAK_SCHEME }

let cachedRuntimeConfig: KeycloakRuntimeConfig | null = null

export function getKeycloakRuntimeConfig() {
  if (cachedRuntimeConfig) {
    return cachedRuntimeConfig
  }

  const result = keycloakRuntimeConfigSchema.safeParse(
    Constants.expoConfig?.extra?.keycloak,
  )

  if (!result.success) {
    throw new Error(
      'Missing or invalid Keycloak runtime config. Define KEYCLOAK_ISSUER_URL and KEYCLOAK_CLIENT_ID in your Expo env.',
    )
  }

  cachedRuntimeConfig = result.data

  return cachedRuntimeConfig
}

export function createKeycloakRedirectUri() {
  return makeRedirectUri({
    native: KEYCLOAK_NATIVE_REDIRECT_URI,
    path: KEYCLOAK_REDIRECT_PATH,
    scheme: KEYCLOAK_SCHEME,
  })
}

export function createKeycloakDiscoveryDocument(
  issuerUrl: string,
): DiscoveryDocument {
  const normalizedIssuerUrl = issuerUrl.replace(/\/+$/, '')
  const protocolBaseUrl = `${normalizedIssuerUrl}/protocol/openid-connect`

  return {
    authorizationEndpoint: `${protocolBaseUrl}/auth`,
    endSessionEndpoint: `${protocolBaseUrl}/logout`,
    revocationEndpoint: `${protocolBaseUrl}/revoke`,
    tokenEndpoint: `${protocolBaseUrl}/token`,
    userInfoEndpoint: `${protocolBaseUrl}/userinfo`,
  }
}

export function resetKeycloakRuntimeConfigForTests() {
  cachedRuntimeConfig = null
}
