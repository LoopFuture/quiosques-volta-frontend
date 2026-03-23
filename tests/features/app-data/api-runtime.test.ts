import {
  getApiRuntimeConfig,
  MOCK_API_ORIGIN,
  resetApiRuntimeConfigForTests,
} from '@/features/app-data/api'
import { createMockExpoConfig } from '../../support/expo-config'

const { __setExpoConfig } = jest.requireMock('expo-constants')

describe('app api runtime config', () => {
  const originalNodeEnv = process.env.NODE_ENV

  function setNodeEnv(value: string | undefined) {
    Object.defineProperty(process.env, 'NODE_ENV', {
      configurable: true,
      value,
    })
  }

  beforeEach(() => {
    resetApiRuntimeConfigForTests()
    setNodeEnv('test')
  })

  afterAll(() => {
    setNodeEnv(originalNodeEnv)
  })

  it('defaults to mock mode outside production when api config is absent', () => {
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

    expect(getApiRuntimeConfig()).toEqual({
      mockingEnabled: true,
      resolvedBaseUrl: MOCK_API_ORIGIN,
    })
  })

  it('uses the live backend url when mocking is disabled', () => {
    __setExpoConfig(
      createMockExpoConfig({
        api: {
          baseUrl: 'https://api.example.com',
          mockingEnabled: false,
        },
      }),
    )

    expect(getApiRuntimeConfig()).toEqual({
      baseUrl: 'https://api.example.com',
      mockingEnabled: false,
      resolvedBaseUrl: 'https://api.example.com',
    })
  })

  it('fails fast in production when no live backend url is configured', () => {
    setNodeEnv('production')
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
      'Missing app API runtime config. Define API_BASE_URL or enable API_MOCKING_ENABLED.',
    )
  })
})
