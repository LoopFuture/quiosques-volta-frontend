import {
  getProfileAppSettingsFormSchema,
  getProfilePaymentsFormSchema,
  getProfilePersonalFormSchema,
  getProfilePrivacyFormSchema,
  getProfileSetupFormSchema,
  serializeProfileAppSettingsForm,
  serializeProfilePaymentsForm,
  serializeProfilePersonalForm,
  serializeProfilePrivacyForm,
  toProfileSetupSnapshot,
} from '@/features/profile/forms'
import {
  getDefaultDevicePrivacySettings,
  getProfileMockData,
  getProfileSetupSeedState,
  getProfileSetupSnapshotFromProfile,
} from '@/features/profile/models'
import {
  getStoredDevicePrivacySettings,
  setStoredDevicePrivacySettings,
} from '@/features/app-data/storage/device/privacy'
import {
  getProfileHubSections,
  getProfileHubReadiness,
  getProfileSummarySections,
  getProfileValidationCopy,
} from '@/features/profile/presentation'
import { i18n, setLocaleOverrideForTests, syncLocale } from '@/i18n'

const t = i18n.t.bind(i18n)

describe('profile models and forms', () => {
  beforeEach(() => {
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')
  })

  afterAll(() => {
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')
  })

  it('builds profile hub and summary sections from backend-owned profile data and local device settings', () => {
    const profile = getProfileMockData()
    const deviceSettings = getDefaultDevicePrivacySettings()
    const hubSections = getProfileHubSections(t, {
      deviceSettings,
      languageMode: 'system',
      profile,
      themeMode: 'system',
    })
    const summarySections = getProfileSummarySections(
      t,
      'pt',
      profile.stats,
      profile.memberSince,
    )
    const personalSection = hubSections.find(
      (section) => section.id === 'personal',
    )
    const paymentsSection = hubSections.find(
      (section) => section.id === 'payments',
    )

    expect(paymentsSection?.previewRows[0]?.value).toBe('PT50************90123')
    expect(personalSection?.previewRows[0]?.value).toBe('Joao Ferreira')
    expect(summarySections.hero.headlineValue).toContain('1,50')
    expect(summarySections.hero.supportingText).toContain('2023')
    expect(summarySections.hero.detailStats).toHaveLength(3)
  })

  it('omits biometric review UI from the hub when the device has no biometric hardware', () => {
    const profile = getProfileMockData()
    const deviceSettings = getDefaultDevicePrivacySettings()
    const hubSections = getProfileHubSections(t, {
      biometricsSupported: false,
      deviceSettings,
      languageMode: 'system',
      profile,
      themeMode: 'system',
    })
    const readiness = getProfileHubReadiness(t, {
      biometricsSupported: false,
      deviceSettings,
      profile,
    })
    const privacySection = hubSections.find(
      (section) => section.id === 'privacy',
    )

    expect(
      privacySection?.previewRows.find(
        (row) => row.label === t('tabScreens.profile.hub.rows.biometricsTitle'),
      ),
    ).toBeUndefined()
    expect(readiness.badgeTone).toBe('success')
    expect(
      readiness.items.find((item) => item.id === 'security'),
    ).toBeUndefined()
  })

  it('defaults biometrics to off and preserves explicit post-migration opt-ins', () => {
    expect(getDefaultDevicePrivacySettings()).toEqual({
      biometricsEnabled: false,
      pushNotificationsEnabled: false,
    })

    setStoredDevicePrivacySettings({
      biometricsEnabled: true,
      pushNotificationsEnabled: false,
    })

    expect(getStoredDevicePrivacySettings()).toEqual({
      biometricsEnabled: true,
      pushNotificationsEnabled: false,
    })
  })

  it('normalizes personal, payments, privacy, and app settings payloads', () => {
    expect(
      serializeProfilePersonalForm({
        email: ' ana.silva@sdr.pt ',
        name: ' Ana Silva ',
        nif: '123 456 789',
        phoneNumber: ' +351 912 345 678 ',
      }),
    ).toEqual({
      email: 'ana.silva@sdr.pt',
      name: 'Ana Silva',
      nif: '123456789',
      phoneNumber: '+351912345678',
    })

    expect(
      serializeProfilePaymentsForm({
        iban: 'pt50 0007 0000 1111 2222 3',
        spinEnabled: false,
      }),
    ).toEqual({
      iban: 'PT5000070000111122223',
      spinEnabled: false,
    })

    expect(
      serializeProfilePrivacyForm({
        alertsEmail: ' alertas@sdr.pt ',
        alertsEnabled: true,
        biometricsEnabled: false,
        pushNotificationsEnabled: false,
      }),
    ).toEqual({
      alertsEmail: 'alertas@sdr.pt',
      alertsEnabled: true,
    })

    expect(
      serializeProfileAppSettingsForm({
        languageMode: 'en',
        themeMode: 'dark',
      }),
    ).toEqual({
      languageMode: 'en',
      themeMode: 'dark',
    })

    expect(
      toProfileSetupSnapshot({
        biometricsEnabled: true,
        email: ' ana.silva@sdr.pt ',
        iban: 'pt50 0007 0000 1111 2222 3',
        name: ' Ana Silva ',
        nif: '123 456 789',
        phoneNumber: ' +351 912 345 678 ',
        pushNotificationsEnabled: false,
        spinEnabled: true,
      }),
    ).toEqual({
      payments: {
        iban: 'PT5000070000111122223',
        spinEnabled: true,
      },
      personal: {
        email: 'ana.silva@sdr.pt',
        name: 'Ana Silva',
        nif: '123456789',
        phoneNumber: '+351912345678',
      },
      preferences: {
        biometricsEnabled: true,
        pushNotificationsEnabled: false,
      },
    })
  })

  it('returns localized validation errors for invalid profile form values', () => {
    const validationCopy = getProfileValidationCopy(t)
    const personalResult = getProfilePersonalFormSchema(
      validationCopy.personal,
    ).safeParse({
      email: 'nope',
      name: '',
      nif: '123',
      phoneNumber: '123',
    })
    const paymentsResult = getProfilePaymentsFormSchema(
      validationCopy.payments,
    ).safeParse({
      iban: 'PT50 1234',
      spinEnabled: true,
    })
    const privacyResult = getProfilePrivacyFormSchema(
      validationCopy.privacy,
    ).safeParse({
      alertsEmail: 'alertas',
      alertsEnabled: true,
      biometricsEnabled: true,
      pushNotificationsEnabled: true,
    })
    const appSettingsResult = getProfileAppSettingsFormSchema(
      validationCopy.appSettings,
    ).safeParse({
      languageMode: 'fr',
      themeMode: 'blue',
    })
    const setupResult = getProfileSetupFormSchema({
      payments: validationCopy.payments,
      personal: validationCopy.personal,
    }).safeParse({
      biometricsEnabled: true,
      email: 'nope',
      iban: 'PT50 1234',
      name: '',
      nif: '123',
      phoneNumber: '123',
      pushNotificationsEnabled: true,
      spinEnabled: true,
    })

    expect(personalResult.success).toBe(false)
    expect(paymentsResult.success).toBe(false)
    expect(privacyResult.success).toBe(false)
    expect(appSettingsResult.success).toBe(false)
    expect(setupResult.success).toBe(false)
  })

  it('builds setup seed data from auth identity and local device settings', () => {
    const seedState = getProfileSetupSeedState({
      identity: {
        email: 'jwt-email@sdr.pt',
        name: 'JWT User',
      },
    })
    const snapshot = getProfileSetupSnapshotFromProfile(
      seedState.profile,
      seedState.deviceSettings,
    )

    expect(seedState.profile.onboarding.status).toBe('in_progress')
    expect(seedState.profile.personal.email).toBe('jwt-email@sdr.pt')
    expect(seedState.profile.personal.phoneNumber).toBe('+351912345678')
    expect(snapshot.personal.email).toBe('jwt-email@sdr.pt')
    expect(snapshot.personal.phoneNumber).toBe('+351912345678')
    expect(snapshot.preferences.pushNotificationsEnabled).toBe(false)
  })
})
