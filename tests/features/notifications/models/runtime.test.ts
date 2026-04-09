import {
  getPushNotificationsRuntimeConfig,
  parseNotificationRouteUrl,
  resetPushNotificationsRuntimeConfigForTests,
} from '@/features/notifications/models/runtime'
import { createMockExpoConfig } from '@tests/support/expo-config'

const { __setExpoConfig } = jest.requireMock('expo-constants')

describe('push notifications runtime', () => {
  beforeEach(() => {
    resetPushNotificationsRuntimeConfigForTests()
  })

  it('reads and caches the push notifications project id from Expo config', () => {
    __setExpoConfig(createMockExpoConfig())

    expect(getPushNotificationsRuntimeConfig()).toEqual({
      projectId: '768d0ed6-c7e3-4b88-9ef2-8a4d1ba22381',
    })

    __setExpoConfig({
      extra: {
        eas: {},
      },
    })

    expect(getPushNotificationsRuntimeConfig()).toEqual({
      projectId: '768d0ed6-c7e3-4b88-9ef2-8a4d1ba22381',
    })
  })

  it('throws when the push notifications project id is missing', () => {
    __setExpoConfig({
      extra: {
        eas: {},
      },
    })

    expect(() => getPushNotificationsRuntimeConfig()).toThrow(
      'Missing or invalid Expo notifications runtime config. Define extra.eas.projectId in app config.',
    )
  })

  it('accepts only rooted internal notification routes', () => {
    expect(parseNotificationRouteUrl('/profile/privacy')).toBe(
      '/profile/privacy',
    )
    expect(parseNotificationRouteUrl(' /wallet ')).toBe('/wallet')
    expect(parseNotificationRouteUrl('wallet')).toBeNull()
    expect(parseNotificationRouteUrl('//wallet')).toBeNull()
    expect(parseNotificationRouteUrl('https://volta.example.com/wallet')).toBe(
      null,
    )
    expect(parseNotificationRouteUrl('')).toBeNull()
    expect(parseNotificationRouteUrl(42)).toBeNull()
  })
})
