import {
  getApiRuntimeConfig,
  resetApiRuntimeConfigForTests,
} from '@/features/app-data/api'
import { createMockExpoConfig } from '@tests/support/expo-config'

const { __setExpoConfig } = jest.requireMock('expo-constants')

describe('app api runtime config', () => {
  beforeEach(() => {
    resetApiRuntimeConfigForTests()
  })

  it('throws when api config is absent', () => {
    __setExpoConfig({
      extra: {
        eas: {
          projectId: '768d0ed6-c7e3-4b88-9ef2-8a4d1ba22381',
        },
        keycloak: {
          clientId: 'volta-mobile',
          issuerUrl: 'https://keycloak.example.com/realms/volta',
          scopes: ['openid', 'profile', 'email'],
        },
        sentry: {},
      },
    })

    expect(() => getApiRuntimeConfig()).toThrow(
      'Missing or invalid API runtime config. Define API_BASE_URL in app config env.',
    )
  })

  it('uses the configured backend url override when present', () => {
    __setExpoConfig(
      createMockExpoConfig({
        api: {
          baseUrl: 'https://api.example.com',
        },
      }),
    )

    expect(getApiRuntimeConfig()).toEqual({
      baseUrl: 'https://api.example.com',
      resolvedBaseUrl: 'https://api.example.com',
    })
  })

  it('returns the cached config on repeated reads', () => {
    __setExpoConfig(
      createMockExpoConfig({
        api: {
          baseUrl: 'https://api.example.com',
        },
      }),
    )

    expect(getApiRuntimeConfig()).toEqual({
      baseUrl: 'https://api.example.com',
      resolvedBaseUrl: 'https://api.example.com',
    })

    __setExpoConfig(
      createMockExpoConfig({
        api: {
          baseUrl: 'https://api.changed.example.com',
        },
      }),
    )

    expect(getApiRuntimeConfig()).toEqual({
      baseUrl: 'https://api.example.com',
      resolvedBaseUrl: 'https://api.example.com',
    })
  })

  it('throws when the configured backend url is blank or malformed', () => {
    __setExpoConfig(
      createMockExpoConfig({
        api: {
          baseUrl: '   ',
        },
      }),
    )

    expect(() => getApiRuntimeConfig()).toThrow(
      'Missing or invalid API runtime config. Define API_BASE_URL in app config env.',
    )

    resetApiRuntimeConfigForTests()
    __setExpoConfig(
      createMockExpoConfig({
        api: {
          baseUrl: 'notaurl',
        },
      }),
    )

    expect(() => getApiRuntimeConfig()).toThrow(
      'Missing or invalid API runtime config. Define API_BASE_URL in app config env.',
    )
  })
})
