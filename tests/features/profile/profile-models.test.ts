import {
  getStoredDevicePrivacySettings,
  setStoredDevicePrivacySettings,
} from '@/features/app-data/storage/device/privacy'
import {
  getProfileAppSettingsFormDefaultValues,
  getProfileAppSettingsFormSchema,
  getProfilePaymentsFormDefaultValues,
  getProfilePaymentsFormSchema,
  getProfilePersonalFormDefaultValues,
  getProfilePersonalFormSchema,
  getProfilePrivacyFormDefaultValues,
  getProfilePrivacyFormSchema,
  getProfileSetupFormDefaultValues,
  getProfileSetupFormSchema,
  serializeProfileAppSettingsForm,
  serializeProfilePaymentsForm,
  serializeProfilePersonalForm,
  serializeProfilePrivacyForm,
  toProfileSetupSnapshot,
} from '@/features/profile/forms'
import {
  getDefaultDevicePrivacySettings,
  getProfileSetupSeedState,
  getProfileSetupSnapshotFromProfile,
  isSpinPayoutRail,
  payoutAccountInputSchema,
  profilePatchRequestSchema,
  profileResponseSchema,
  profileSetupSnapshotSchema,
} from '@/features/profile/models'
import {
  formatProfileMemberSince,
  getLanguageModeLabel,
  getProfileAppearanceOptions,
  getProfileHeroStats,
  getProfileHubReadiness,
  getProfileHubSections,
  getProfileLanguageOptions,
  getProfileSummarySections,
  getProfileValidationCopy,
  getThemeModeLabel,
} from '@/features/profile/presentation'
import { i18n, setLocaleOverrideForTests, syncLocale } from '@/i18n'

const t = i18n.t.bind(i18n)

const profile = profileResponseSchema.parse({
  memberSince: '2023-04-15T00:00:00.000Z',
  onboarding: {
    completedAt: '2024-01-01T10:00:00.000Z',
    status: 'completed',
  },
  payoutAccount: {
    ibanMasked: 'PT50************90123',
    rail: 'spin',
    spinEnabled: true,
  },
  personal: {
    email: 'joao.ferreira@volta.pt',
    name: 'Joao Ferreira',
    nif: '123456789',
    phoneNumber: '+351911223344',
  },
  preferences: {
    alertsEmail: 'joao.ferreira@volta.pt',
    alertsEnabled: true,
  },
  stats: {
    completedTransfersCount: 4,
    creditsEarned: {
      amountMinor: 150,
      currency: 'EUR',
    },
    processingTransfersCount: 1,
    returnedPackagesCount: 12,
  },
})

describe('profile models and forms', () => {
  beforeEach(() => {
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')
  })

  afterAll(() => {
    setLocaleOverrideForTests('pt-PT')
    syncLocale('system')
  })

  it('builds localized profile hub, readiness, and summary sections', () => {
    const deviceSettings = {
      biometricsEnabled: true,
      pushNotificationsEnabled: true,
    }
    const hubSections = getProfileHubSections(t, {
      deviceSettings,
      languageMode: 'system',
      profile,
      themeMode: 'system',
    })
    const readiness = getProfileHubReadiness(t, {
      deviceSettings,
      profile,
    })
    const summarySections = getProfileSummarySections(
      t,
      'pt',
      profile.stats,
      profile.memberSince,
    )
    const heroStats = getProfileHeroStats(t, 'pt', profile.stats)

    expect(getThemeModeLabel(t, 'system')).toBe('Sistema')
    expect(getThemeModeLabel(t, 'light')).toBe('Claro')
    expect(getThemeModeLabel(t, 'dark')).toBe('Escuro')
    expect(getLanguageModeLabel(t, 'system')).toBe('Sistema')
    expect(getLanguageModeLabel(t, 'pt')).toBe('Português')
    expect(getLanguageModeLabel(t, 'en')).toBe('English')
    expect(
      getProfileAppearanceOptions(t).map((option) => option.value),
    ).toEqual(['system', 'light', 'dark'])
    expect(getProfileLanguageOptions(t).map((option) => option.value)).toEqual([
      'system',
      'pt',
      'en',
    ])
    expect(hubSections.map((section) => section.id)).toEqual([
      'personal',
      'payments',
      'privacy',
      'appSettings',
    ])
    expect(
      hubSections.find((section) => section.id === 'personal')?.previewRows[0]
        ?.value,
    ).toBe('Joao Ferreira')
    expect(
      hubSections.find((section) => section.id === 'payments')?.previewRows[0]
        ?.value,
    ).toBe('PT50************90123')
    expect(readiness.badgeTone).toBe('success')
    expect(readiness.items).toHaveLength(3)
    expect(summarySections.hero.headlineValue).toContain('1,50')
    expect(summarySections.hero.supportingText).toContain('2023')
    expect(heroStats).toHaveLength(3)
    expect(formatProfileMemberSince('pt', profile.memberSince)).toContain(
      '2023',
    )
  })

  it('omits biometric review rows when the device does not support biometrics and normalizes legacy setup preferences', () => {
    const deviceSettings = {
      biometricsEnabled: false,
      pushNotificationsEnabled: true,
    }
    const hubSections = getProfileHubSections(t, {
      biometricsSupported: false,
      deviceSettings,
      languageMode: 'en',
      profile,
      themeMode: 'dark',
    })
    const readiness = getProfileHubReadiness(t, {
      biometricsSupported: false,
      deviceSettings,
      profile,
    })
    const privacySection = hubSections.find(
      (section) => section.id === 'privacy',
    )
    const snapshot = profileSetupSnapshotSchema.parse({
      payments: {
        iban: 'PT50000700001111222233',
        spinEnabled: false,
      },
      personal: {
        email: 'legacy@volta.pt',
        name: 'Legacy User',
        nif: '123456789',
        phoneNumber: '+351911223344',
      },
      preferences: {
        biometricsEnabled: true,
        notificationsAccepted: false,
      },
    })

    expect(
      privacySection?.previewRows.find(
        (row) => row.label === t('tabScreens.profile.hub.rows.biometricsTitle'),
      ),
    ).toBeUndefined()
    expect(readiness.badgeTone).toBe('success')
    expect(
      readiness.items.find((item) => item.id === 'security'),
    ).toBeUndefined()
    expect(snapshot.preferences.pushNotificationsEnabled).toBe(false)
  })

  it('builds defaults and normalizes personal, payments, privacy, app settings, and setup payloads', () => {
    const setupSnapshot = getProfileSetupSnapshotFromProfile(profile, {
      biometricsEnabled: true,
      pushNotificationsEnabled: false,
    })

    expect(getProfilePersonalFormDefaultValues(profile.personal)).toEqual({
      email: 'joao.ferreira@volta.pt',
      name: 'Joao Ferreira',
      nif: '123456789',
      phoneNumber: '+351911223344',
    })
    expect(getProfilePaymentsFormDefaultValues(profile.payoutAccount)).toEqual({
      iban: '',
      spinEnabled: true,
    })
    expect(
      getProfilePrivacyFormDefaultValues({
        alertsEmail: ' joao.ferreira@volta.pt ',
        alertsEnabled: true,
        biometricsEnabled: false,
        pushNotificationsEnabled: true,
      }),
    ).toEqual({
      alertsEmail: 'joao.ferreira@volta.pt',
      alertsEnabled: true,
      biometricsEnabled: false,
      pushNotificationsEnabled: true,
    })
    expect(
      getProfileAppSettingsFormDefaultValues({
        languageMode: 'en',
        themeMode: 'dark',
      }),
    ).toEqual({
      languageMode: 'en',
      themeMode: 'dark',
    })
    expect(getProfileSetupFormDefaultValues(setupSnapshot)).toEqual({
      biometricsEnabled: true,
      email: 'joao.ferreira@volta.pt',
      iban: '',
      name: 'Joao Ferreira',
      nif: '123456789',
      phoneNumber: '+351911223344',
      pushNotificationsEnabled: false,
      spinEnabled: true,
    })
    expect(
      serializeProfilePersonalForm({
        email: ' joao.ferreira@volta.pt ',
        name: ' Joao Ferreira ',
        nif: '123 456 789',
        phoneNumber: ' +351 911 223 344 ',
      }),
    ).toEqual({
      email: 'joao.ferreira@volta.pt',
      name: 'Joao Ferreira',
      nif: '123456789',
      phoneNumber: '+351911223344',
    })
    expect(
      serializeProfilePaymentsForm({
        iban: 'pt50 0007 0000 1111 2222 33',
        spinEnabled: false,
      }),
    ).toEqual({
      iban: 'PT50000700001111222233',
      spinEnabled: false,
    })
    expect(
      serializeProfilePrivacyForm({
        alertsEmail: ' alerts@volta.pt ',
        alertsEnabled: true,
        biometricsEnabled: true,
        pushNotificationsEnabled: false,
      }),
    ).toEqual({
      alertsEmail: 'alerts@volta.pt',
      alertsEnabled: true,
    })
    expect(
      serializeProfileAppSettingsForm({
        languageMode: 'pt',
        themeMode: 'light',
      }),
    ).toEqual({
      languageMode: 'pt',
      themeMode: 'light',
    })
    expect(
      toProfileSetupSnapshot({
        biometricsEnabled: true,
        email: ' joao.ferreira@volta.pt ',
        iban: 'pt50 0007 0000 1111 2222 33',
        name: ' Joao Ferreira ',
        nif: '123 456 789',
        phoneNumber: ' +351 911 223 344 ',
        pushNotificationsEnabled: false,
        spinEnabled: true,
      }),
    ).toEqual({
      payments: {
        iban: 'PT50000700001111222233',
        spinEnabled: true,
      },
      personal: {
        email: 'joao.ferreira@volta.pt',
        name: 'Joao Ferreira',
        nif: '123456789',
        phoneNumber: '+351911223344',
      },
      preferences: {
        biometricsEnabled: true,
        pushNotificationsEnabled: false,
      },
    })
    expect(isSpinPayoutRail('spin')).toBe(true)
    expect(isSpinPayoutRail('sepa')).toBe(false)
  })

  it('returns localized validation errors and validates payout account patch shapes', () => {
    const validationCopy = getProfileValidationCopy(t)

    expect(
      getProfilePersonalFormSchema(validationCopy.personal).safeParse({
        email: 'not-an-email',
        name: '',
        nif: '123',
        phoneNumber: '123',
      }).success,
    ).toBe(false)
    expect(
      getProfilePaymentsFormSchema(validationCopy.payments).safeParse({
        iban: 'PT50 1234',
        spinEnabled: true,
      }).success,
    ).toBe(false)
    expect(
      getProfilePrivacyFormSchema(validationCopy.privacy).safeParse({
        alertsEmail: 'not-an-email',
        alertsEnabled: true,
        biometricsEnabled: true,
        pushNotificationsEnabled: true,
      }).success,
    ).toBe(false)
    expect(
      getProfileAppSettingsFormSchema(validationCopy.appSettings).safeParse({
        languageMode: 'fr',
        themeMode: 'blue',
      }).success,
    ).toBe(false)
    expect(
      getProfileSetupFormSchema({
        payments: validationCopy.payments,
        personal: validationCopy.personal,
      }).safeParse({
        biometricsEnabled: true,
        email: 'not-an-email',
        iban: 'PT50 1234',
        name: '',
        nif: '123',
        phoneNumber: '123',
        pushNotificationsEnabled: false,
        spinEnabled: true,
      }).success,
    ).toBe(false)
    expect(
      payoutAccountInputSchema.parse({
        iban: 'PT50000700001111222233',
        spinEnabled: true,
      }),
    ).toEqual({
      iban: 'PT50000700001111222233',
      rail: 'spin',
    })
    expect(
      payoutAccountInputSchema.safeParse({
        iban: 'PT50000700001111222233',
        rail: 'sepa',
        spinEnabled: true,
      }).success,
    ).toBe(false)
    expect(profilePatchRequestSchema.safeParse({}).success).toBe(false)
  })

  it('hydrates setup seed state from auth identity and persists device privacy settings', () => {
    const seedState = getProfileSetupSeedState({
      identity: {
        email: 'jwt-email@volta.pt',
        name: 'JWT User',
      },
      profile,
    })

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
    expect(seedState.profile.onboarding.status).toBe('in_progress')
    expect(seedState.profile.personal.email).toBe('jwt-email@volta.pt')
    expect(seedState.profile.personal.name).toBe('JWT User')
    expect(seedState.profile.preferences?.alertsEmail).toBe(
      'jwt-email@volta.pt',
    )
  })

  it('falls back to empty setup defaults and normalizes nullable profile fields', () => {
    const emptySeedState = getProfileSetupSeedState()

    expect(emptySeedState.profile.personal.email).toBe('setup@volta.invalid')
    expect(emptySeedState.profile.personal.name).toBeNull()
    expect(emptySeedState.profile.preferences).toEqual({
      alertsEmail: 'setup@volta.invalid',
      alertsEnabled: false,
    })
    expect(emptySeedState.profile.onboarding.status).toBe('in_progress')

    const nullableProfile = profileResponseSchema.parse({
      ...profile,
      payoutAccount: null,
      personal: {
        email: 'profile-email@volta.pt',
        name: null,
        nif: null,
        phoneNumber: null,
      },
      preferences: null,
    })

    const fallbackSeedState = getProfileSetupSeedState({
      identity: {
        email: null,
        name: null,
      },
      profile: nullableProfile,
    })

    expect(fallbackSeedState.profile.personal.email).toBe(
      'profile-email@volta.pt',
    )
    expect(fallbackSeedState.profile.personal.name).toBeNull()
    expect(fallbackSeedState.profile.preferences).toEqual({
      alertsEmail: 'profile-email@volta.pt',
      alertsEnabled: false,
    })
    expect(
      getProfileSetupSnapshotFromProfile(nullableProfile, {
        biometricsEnabled: false,
        pushNotificationsEnabled: true,
      }),
    ).toEqual({
      payments: {
        iban: '',
        spinEnabled: false,
      },
      personal: {
        email: 'profile-email@volta.pt',
        name: '',
        nif: '',
        phoneNumber: '',
      },
      preferences: {
        biometricsEnabled: false,
        pushNotificationsEnabled: true,
      },
    })
  })
})
