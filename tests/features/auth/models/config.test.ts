import {
  createKeycloakDiscoveryDocument,
  createKeycloakRedirectUri,
  getKeycloakRuntimeConfig,
  resetKeycloakRuntimeConfigForTests,
} from '@/features/auth/models/config'

const { makeRedirectUri } = jest.requireMock('expo-auth-session')
const { __setExpoConfig } = jest.requireMock('expo-constants')

describe('auth runtime config', () => {
  beforeEach(() => {
    resetKeycloakRuntimeConfigForTests()
  })

  it('reads, caches, and reuses the Keycloak runtime config', () => {
    const firstConfig = getKeycloakRuntimeConfig()

    __setExpoConfig({
      extra: {
        keycloak: {
          clientId: 'changed-client',
          issuerUrl: 'https://other.example.com/realms/other',
          scopes: ['openid'],
        },
      },
    })

    const cachedConfig = getKeycloakRuntimeConfig()

    expect(firstConfig).toEqual({
      clientId: 'volta-mobile',
      issuerUrl: 'https://keycloak.example.com/realms/volta',
      scopes: ['openid', 'profile', 'email'],
    })
    expect(cachedConfig).toBe(firstConfig)
  })

  it('throws when the Keycloak runtime config is missing', () => {
    __setExpoConfig({
      extra: {},
    })

    expect(() => getKeycloakRuntimeConfig()).toThrow(
      'Missing or invalid Keycloak runtime config. Define KEYCLOAK_ISSUER_URL and KEYCLOAK_CLIENT_ID in your Expo env.',
    )
  })

  it('builds redirect and discovery helpers from the normalized issuer URL', () => {
    expect(createKeycloakRedirectUri()).toBe('voltafrontend://auth/callback')
    expect(makeRedirectUri).toHaveBeenCalledWith({
      native: 'voltafrontend://auth/callback',
      path: 'auth/callback',
      scheme: 'voltafrontend',
    })

    expect(
      createKeycloakDiscoveryDocument(
        'https://keycloak.example.com/realms/volta///',
      ),
    ).toEqual({
      authorizationEndpoint:
        'https://keycloak.example.com/realms/volta/protocol/openid-connect/auth',
      endSessionEndpoint:
        'https://keycloak.example.com/realms/volta/protocol/openid-connect/logout',
      revocationEndpoint:
        'https://keycloak.example.com/realms/volta/protocol/openid-connect/revoke',
      tokenEndpoint:
        'https://keycloak.example.com/realms/volta/protocol/openid-connect/token',
      userInfoEndpoint:
        'https://keycloak.example.com/realms/volta/protocol/openid-connect/userinfo',
    })
  })
})
