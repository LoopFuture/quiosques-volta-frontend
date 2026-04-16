import {
  BIOMETRICS_ENABLED_STORAGE_KEY,
  DEVICE_PRIVACY_STORAGE_VERSION,
  DEVICE_PRIVACY_STORAGE_VERSION_KEY,
  getStoredDevicePrivacySettings,
  parseStoredBoolean,
  PIN_ENABLED_STORAGE_KEY,
  privacyPreferenceStorage,
  PUSH_NOTIFICATIONS_ENABLED_STORAGE_KEY,
  setStoredDevicePrivacySettings,
} from '@/features/app-data/storage/device/privacy'

describe('device privacy storage', () => {
  beforeEach(() => {
    privacyPreferenceStorage.clearAll()
  })

  it('parses stored booleans and migrates stored pin and push notification values', () => {
    privacyPreferenceStorage.set(BIOMETRICS_ENABLED_STORAGE_KEY, 'true')
    privacyPreferenceStorage.set(PIN_ENABLED_STORAGE_KEY, 'true')
    privacyPreferenceStorage.set(
      PUSH_NOTIFICATIONS_ENABLED_STORAGE_KEY,
      'false',
    )

    expect(parseStoredBoolean('true')).toBe(true)
    expect(parseStoredBoolean('false')).toBe(false)
    expect(getStoredDevicePrivacySettings()).toEqual({
      biometricsEnabled: true,
      pinEnabled: true,
      pushNotificationsEnabled: false,
    })
    expect(
      privacyPreferenceStorage.getString(DEVICE_PRIVACY_STORAGE_VERSION_KEY),
    ).toBe(DEVICE_PRIVACY_STORAGE_VERSION)
  })

  it('stores explicit privacy preference updates', () => {
    setStoredDevicePrivacySettings({
      biometricsEnabled: false,
      pinEnabled: true,
      pushNotificationsEnabled: true,
    })

    expect(
      privacyPreferenceStorage.getString(BIOMETRICS_ENABLED_STORAGE_KEY),
    ).toBe('false')
    expect(privacyPreferenceStorage.getString(PIN_ENABLED_STORAGE_KEY)).toBe(
      'true',
    )
    expect(
      privacyPreferenceStorage.getString(
        PUSH_NOTIFICATIONS_ENABLED_STORAGE_KEY,
      ),
    ).toBe('true')
  })
})
