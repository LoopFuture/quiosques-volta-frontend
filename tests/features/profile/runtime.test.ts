import {
  getProfileLegalLinkUrl,
  getProfileWebAppRuntimeConfig,
  resetProfileWebAppRuntimeConfigForTests,
} from '@/features/profile/runtime'
import { createMockExpoConfig } from '@tests/support/expo-config'

const { __setExpoConfig } = jest.requireMock('expo-constants')

describe('profile web app runtime config', () => {
  beforeEach(() => {
    resetProfileWebAppRuntimeConfigForTests()
  })

  it('reads the configured web app base url', () => {
    __setExpoConfig(
      createMockExpoConfig({
        webApp: {
          baseUrl: 'https://app.example.com/base/',
        },
      }),
    )

    expect(getProfileWebAppRuntimeConfig()).toEqual({
      baseUrl: 'https://app.example.com/base/',
    })
    expect(getProfileLegalLinkUrl('/privacy-policy')).toBe(
      'https://app.example.com/privacy-policy',
    )
  })

  it('throws when the web app config is absent', () => {
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
        api: {
          baseUrl: 'https://api.example.com',
        },
        sentry: {},
      },
    })

    expect(() => getProfileWebAppRuntimeConfig()).toThrow(
      'Missing or invalid profile web app runtime config. Define WEB_APP_BASE_URL in app config env.',
    )
  })

  it('throws when the configured web app base url is blank or malformed', () => {
    __setExpoConfig(
      createMockExpoConfig({
        webApp: {
          baseUrl: '   ',
        },
      }),
    )

    expect(() => getProfileWebAppRuntimeConfig()).toThrow(
      'Missing or invalid profile web app runtime config. Define WEB_APP_BASE_URL in app config env.',
    )

    resetProfileWebAppRuntimeConfigForTests()
    __setExpoConfig(
      createMockExpoConfig({
        webApp: {
          baseUrl: 'notaurl',
        },
      }),
    )

    expect(() => getProfileWebAppRuntimeConfig()).toThrow(
      'Missing or invalid profile web app runtime config. Define WEB_APP_BASE_URL in app config env.',
    )
  })
})
