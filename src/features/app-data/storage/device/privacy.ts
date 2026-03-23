import { useCallback, useMemo } from 'react'
import { useMMKVString } from 'react-native-mmkv'
import { z } from 'zod/v4'
import { clientStorage } from '../mmkv'

export const devicePrivacySettingsSchema = z.object({
  biometricsEnabled: z.boolean(),
  pushNotificationsEnabled: z.boolean(),
})

export type DevicePrivacySettings = z.infer<typeof devicePrivacySettingsSchema>

export const BIOMETRICS_ENABLED_STORAGE_KEY = 'privacy.biometricsEnabled'
export const PUSH_NOTIFICATIONS_ENABLED_STORAGE_KEY =
  'privacy.pushNotificationsEnabled'
export const DEVICE_PRIVACY_STORAGE_VERSION_KEY = 'privacy.settingsVersion'
export const DEVICE_PRIVACY_STORAGE_VERSION = '1'

export const privacyPreferenceStorage = clientStorage

export function parseStoredBoolean(value?: string) {
  return value === 'true'
}

export function getDefaultDevicePrivacySettings(): DevicePrivacySettings {
  return devicePrivacySettingsSchema.parse({
    biometricsEnabled: false,
    pushNotificationsEnabled: false,
  })
}

function ensureDevicePrivacySettingsMigration() {
  const storedVersion = privacyPreferenceStorage.getString(
    DEVICE_PRIVACY_STORAGE_VERSION_KEY,
  )

  if (storedVersion === DEVICE_PRIVACY_STORAGE_VERSION) {
    return
  }

  privacyPreferenceStorage.set(BIOMETRICS_ENABLED_STORAGE_KEY, 'false')
  privacyPreferenceStorage.set(
    DEVICE_PRIVACY_STORAGE_VERSION_KEY,
    DEVICE_PRIVACY_STORAGE_VERSION,
  )
}

export function getStoredDevicePrivacySettings(): DevicePrivacySettings {
  ensureDevicePrivacySettingsMigration()

  const defaultSettings = getDefaultDevicePrivacySettings()
  const storedBiometricsEnabled = privacyPreferenceStorage.getString(
    BIOMETRICS_ENABLED_STORAGE_KEY,
  )
  const storedPushNotificationsEnabled = privacyPreferenceStorage.getString(
    PUSH_NOTIFICATIONS_ENABLED_STORAGE_KEY,
  )

  return devicePrivacySettingsSchema.parse({
    biometricsEnabled:
      storedBiometricsEnabled == null
        ? defaultSettings.biometricsEnabled
        : parseStoredBoolean(storedBiometricsEnabled),
    pushNotificationsEnabled:
      storedPushNotificationsEnabled == null
        ? defaultSettings.pushNotificationsEnabled
        : parseStoredBoolean(storedPushNotificationsEnabled),
  })
}

export function setStoredDevicePrivacySettings(
  nextSettings: DevicePrivacySettings,
) {
  ensureDevicePrivacySettingsMigration()

  privacyPreferenceStorage.set(
    BIOMETRICS_ENABLED_STORAGE_KEY,
    String(nextSettings.biometricsEnabled),
  )
  privacyPreferenceStorage.set(
    PUSH_NOTIFICATIONS_ENABLED_STORAGE_KEY,
    String(nextSettings.pushNotificationsEnabled),
  )
  privacyPreferenceStorage.set(
    DEVICE_PRIVACY_STORAGE_VERSION_KEY,
    DEVICE_PRIVACY_STORAGE_VERSION,
  )
}

export function useDevicePrivacySettings() {
  const initialSettings = getStoredDevicePrivacySettings()
  const [storedBiometricsEnabled, setStoredBiometricsEnabled] = useMMKVString(
    BIOMETRICS_ENABLED_STORAGE_KEY,
    privacyPreferenceStorage,
  )
  const [storedPushNotificationsEnabled, setStoredPushNotificationsEnabled] =
    useMMKVString(
      PUSH_NOTIFICATIONS_ENABLED_STORAGE_KEY,
      privacyPreferenceStorage,
    )

  const settings = useMemo<DevicePrivacySettings>(
    () =>
      devicePrivacySettingsSchema.parse({
        biometricsEnabled:
          storedBiometricsEnabled == null
            ? initialSettings.biometricsEnabled
            : parseStoredBoolean(storedBiometricsEnabled),
        pushNotificationsEnabled:
          storedPushNotificationsEnabled == null
            ? initialSettings.pushNotificationsEnabled
            : parseStoredBoolean(storedPushNotificationsEnabled),
      }),
    [
      initialSettings.biometricsEnabled,
      initialSettings.pushNotificationsEnabled,
      storedBiometricsEnabled,
      storedPushNotificationsEnabled,
    ],
  )

  const setSettings = useCallback(
    (nextSettings: DevicePrivacySettings) => {
      setStoredBiometricsEnabled(String(nextSettings.biometricsEnabled))
      setStoredPushNotificationsEnabled(
        String(nextSettings.pushNotificationsEnabled),
      )
      privacyPreferenceStorage.set(
        DEVICE_PRIVACY_STORAGE_VERSION_KEY,
        DEVICE_PRIVACY_STORAGE_VERSION,
      )
    },
    [setStoredBiometricsEnabled, setStoredPushNotificationsEnabled],
  )

  return {
    settings,
    setSettings,
  }
}
