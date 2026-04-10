import { useCallback, useEffect, useMemo } from 'react'
import { useMMKVString } from 'react-native-mmkv'
import { z } from 'zod/v4'
import { clientStorage } from '../mmkv'

export const devicePrivacySettingsSchema = z.object({
  biometricsEnabled: z.boolean(),
  pinEnabled: z.boolean(),
  pushNotificationsEnabled: z.boolean(),
})

export type DevicePrivacySettings = z.infer<typeof devicePrivacySettingsSchema>

export const BIOMETRICS_ENABLED_STORAGE_KEY = 'privacy.biometricsEnabled'
export const PIN_ENABLED_STORAGE_KEY = 'privacy.pinEnabled'
export const PUSH_NOTIFICATIONS_ENABLED_STORAGE_KEY =
  'privacy.pushNotificationsEnabled'
export const DEVICE_PRIVACY_STORAGE_VERSION_KEY = 'privacy.settingsVersion'
export const DEVICE_PRIVACY_STORAGE_VERSION = '2'

export const privacyPreferenceStorage = clientStorage

export function parseStoredBoolean(value?: string) {
  return value === 'true'
}

export function getDefaultDevicePrivacySettings(): DevicePrivacySettings {
  return devicePrivacySettingsSchema.parse({
    biometricsEnabled: false,
    pinEnabled: false,
    pushNotificationsEnabled: false,
  })
}

function readCurrentDevicePrivacySettingsSnapshot() {
  const defaultSettings = getDefaultDevicePrivacySettings()
  const storedBiometricsEnabled = privacyPreferenceStorage.getString(
    BIOMETRICS_ENABLED_STORAGE_KEY,
  )
  const storedPinEnabled = privacyPreferenceStorage.getString(
    PIN_ENABLED_STORAGE_KEY,
  )
  const storedPushNotificationsEnabled = privacyPreferenceStorage.getString(
    PUSH_NOTIFICATIONS_ENABLED_STORAGE_KEY,
  )

  return devicePrivacySettingsSchema.parse({
    biometricsEnabled:
      storedBiometricsEnabled == null
        ? defaultSettings.biometricsEnabled
        : parseStoredBoolean(storedBiometricsEnabled),
    pinEnabled:
      storedPinEnabled == null
        ? defaultSettings.pinEnabled
        : parseStoredBoolean(storedPinEnabled),
    pushNotificationsEnabled:
      storedPushNotificationsEnabled == null
        ? defaultSettings.pushNotificationsEnabled
        : parseStoredBoolean(storedPushNotificationsEnabled),
  })
}

function ensureDevicePrivacySettingsMigration() {
  const storedVersion = privacyPreferenceStorage.getString(
    DEVICE_PRIVACY_STORAGE_VERSION_KEY,
  )

  if (storedVersion === DEVICE_PRIVACY_STORAGE_VERSION) {
    return
  }

  const defaultSettings = getDefaultDevicePrivacySettings()
  const storedBiometricsEnabled = privacyPreferenceStorage.getString(
    BIOMETRICS_ENABLED_STORAGE_KEY,
  )
  const storedPinEnabled = privacyPreferenceStorage.getString(
    PIN_ENABLED_STORAGE_KEY,
  )
  const storedPushNotificationsEnabled = privacyPreferenceStorage.getString(
    PUSH_NOTIFICATIONS_ENABLED_STORAGE_KEY,
  )

  privacyPreferenceStorage.set(
    BIOMETRICS_ENABLED_STORAGE_KEY,
    String(
      storedBiometricsEnabled == null
        ? defaultSettings.biometricsEnabled
        : parseStoredBoolean(storedBiometricsEnabled),
    ),
  )
  privacyPreferenceStorage.set(
    PIN_ENABLED_STORAGE_KEY,
    String(
      storedPinEnabled == null
        ? defaultSettings.pinEnabled
        : parseStoredBoolean(storedPinEnabled),
    ),
  )
  privacyPreferenceStorage.set(
    PUSH_NOTIFICATIONS_ENABLED_STORAGE_KEY,
    String(
      storedPushNotificationsEnabled == null
        ? defaultSettings.pushNotificationsEnabled
        : parseStoredBoolean(storedPushNotificationsEnabled),
    ),
  )
  privacyPreferenceStorage.set(
    DEVICE_PRIVACY_STORAGE_VERSION_KEY,
    DEVICE_PRIVACY_STORAGE_VERSION,
  )
}

export function getStoredDevicePrivacySettings(): DevicePrivacySettings {
  ensureDevicePrivacySettingsMigration()

  return readCurrentDevicePrivacySettingsSnapshot()
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
    PIN_ENABLED_STORAGE_KEY,
    String(nextSettings.pinEnabled),
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
  const initialSettings = readCurrentDevicePrivacySettingsSnapshot()
  const [storedBiometricsEnabled, setStoredBiometricsEnabled] = useMMKVString(
    BIOMETRICS_ENABLED_STORAGE_KEY,
    privacyPreferenceStorage,
  )
  const [storedPinEnabled, setStoredPinEnabled] = useMMKVString(
    PIN_ENABLED_STORAGE_KEY,
    privacyPreferenceStorage,
  )
  const [storedPushNotificationsEnabled, setStoredPushNotificationsEnabled] =
    useMMKVString(
      PUSH_NOTIFICATIONS_ENABLED_STORAGE_KEY,
      privacyPreferenceStorage,
    )

  useEffect(() => {
    ensureDevicePrivacySettingsMigration()
  }, [])

  const settings = useMemo<DevicePrivacySettings>(
    () =>
      devicePrivacySettingsSchema.parse({
        biometricsEnabled:
          storedBiometricsEnabled == null
            ? initialSettings.biometricsEnabled
            : parseStoredBoolean(storedBiometricsEnabled),
        pinEnabled:
          storedPinEnabled == null
            ? initialSettings.pinEnabled
            : parseStoredBoolean(storedPinEnabled),
        pushNotificationsEnabled:
          storedPushNotificationsEnabled == null
            ? initialSettings.pushNotificationsEnabled
            : parseStoredBoolean(storedPushNotificationsEnabled),
      }),
    [
      initialSettings.biometricsEnabled,
      initialSettings.pinEnabled,
      initialSettings.pushNotificationsEnabled,
      storedBiometricsEnabled,
      storedPinEnabled,
      storedPushNotificationsEnabled,
    ],
  )

  const setSettings = useCallback(
    (nextSettings: DevicePrivacySettings) => {
      setStoredBiometricsEnabled(String(nextSettings.biometricsEnabled))
      setStoredPinEnabled(String(nextSettings.pinEnabled))
      setStoredPushNotificationsEnabled(
        String(nextSettings.pushNotificationsEnabled),
      )
      privacyPreferenceStorage.set(
        DEVICE_PRIVACY_STORAGE_VERSION_KEY,
        DEVICE_PRIVACY_STORAGE_VERSION,
      )
    },
    [
      setStoredBiometricsEnabled,
      setStoredPinEnabled,
      setStoredPushNotificationsEnabled,
    ],
  )

  return {
    settings,
    setSettings,
  }
}

export function isDeviceProtectionEnabled(settings: DevicePrivacySettings) {
  return settings.biometricsEnabled || settings.pinEnabled
}
