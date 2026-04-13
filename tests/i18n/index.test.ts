import { getProfileLanguageOptions } from '@/features/profile/presentation'
import { getWalletHistoryFilterOptions } from '@/features/wallet/presentation'
import {
  fallbackLocale,
  i18n,
  primaryLocale,
  resolveAppLocale,
  setLocaleOverrideForTests,
  syncLocale,
} from '@/i18n'

const { __setMockLocales } = jest.requireMock('expo-localization')
const t = i18n.t.bind(i18n)

describe('i18n index', () => {
  afterEach(() => {
    __setMockLocales([
      {
        languageCode: 'pt',
        languageTag: 'pt-PT',
      },
    ])
    setLocaleOverrideForTests('pt-PT')
    syncLocale()
  })

  it('uses English copy and interpolation when the device locale is English', () => {
    setLocaleOverrideForTests('en-US')
    expect(syncLocale()).toBe(fallbackLocale)

    expect(i18n.t('tabs.home.label')).toBe('Home')
    expect(i18n.t('tabScreens.barcode.card.title')).toBe('Your Volta code')
    expect(i18n.t('tabScreens.home.overview.title')).toBe('Right now')
    expect(i18n.t('tabScreens.wallet.movementsPage.title')).toBe('Full history')
    expect(
      i18n.t('tabScreens.home.balanceCard.badges.returns', {
        count: 1,
      }),
    ).toBe('1 container')
    expect(
      i18n.t('tabScreens.home.balanceCard.badges.returns', {
        count: 24,
      }),
    ).toBe('24 containers')
    expect(i18n.t('tabScreens.profile.personal.photoTitle')).toBe(
      'Profile photo',
    )
    expect(getWalletHistoryFilterOptions(t)[0]?.label).toBe('All')
  })

  it('defaults to Portuguese Portugal for unsupported locales', () => {
    setLocaleOverrideForTests('fr-FR')
    expect(syncLocale()).toBe(primaryLocale)

    expect(i18n.t('tabs.home.label')).toBe('Início')
    expect(i18n.t('tabs.home.header.eyebrow')).toBe('Bem-vindo')
    expect(i18n.t('tabScreens.barcode.card.title')).toBe('O teu código Volta')
    expect(getProfileLanguageOptions(t)[0]?.label).toBe('Sistema')
    expect(i18n.t('tabScreens.profile.privacy.title')).toBe(
      'Privacidade e segurança',
    )
  })

  it('uses Portuguese Portugal pluralization and interpolation for Portuguese device locales', () => {
    setLocaleOverrideForTests('pt-BR')
    expect(syncLocale()).toBe(primaryLocale)

    expect(i18n.t('tabScreens.home.overview.title')).toBe('Neste momento')
    expect(
      i18n.t('tabScreens.home.balanceCard.badges.credits', {
        count: 1,
      }),
    ).toBe('1 crédito')
    expect(
      i18n.t('tabScreens.home.balanceCard.badges.transfers', {
        count: 2,
      }),
    ).toBe('2 transferências pendentes')
    expect(i18n.t('tabScreens.profile.personal.photoTitle')).toBe(
      'Foto de perfil',
    )
    expect(getWalletHistoryFilterOptions(t)[0]?.label).toBe('Todos')
  })

  it('resolves explicit locale overrides without using the device locale', () => {
    expect(resolveAppLocale('en', 'pt-PT')).toBe(fallbackLocale)
    expect(resolveAppLocale('pt', 'en-US')).toBe(primaryLocale)
  })

  it('resolves system locale preferences from the device locale', () => {
    expect(resolveAppLocale('system', 'en-US')).toBe(fallbackLocale)
    expect(resolveAppLocale('system', 'fr-FR')).toBe(primaryLocale)
  })

  it('falls back from missing locale tags to language codes and primary defaults', () => {
    setLocaleOverrideForTests(null)
    __setMockLocales([
      {
        languageCode: 'en',
        languageTag: undefined as unknown as string,
      },
    ])

    expect(resolveAppLocale()).toBe(fallbackLocale)

    __setMockLocales([
      {
        languageCode: undefined as unknown as string,
        languageTag: undefined as unknown as string,
      },
    ])

    expect(syncLocale()).toBe(primaryLocale)
  })
})
