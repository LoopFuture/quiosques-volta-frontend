import type { TFunction } from 'i18next'
import type { LanguageMode } from '@/features/app-data/storage/preferences/language'
import type { ThemeMode } from '@/features/app-data/storage/preferences/theme'
import {
  formatCurrencyFromCents,
  formatMonthYear,
  formatNumber,
} from '@/i18n/format'
import {
  profileHubSectionSchema,
  profileSummaryStatSchema,
  type DevicePrivacySettings,
  type ProfileResponse,
  type ProfileSummaryMetrics,
} from './models'

function getProfileDisplayValue(value: string | null | undefined) {
  return value && value.trim().length > 0 ? value : '-'
}

function getProfilePaymentsReadinessValue(
  t: TFunction,
  profile: ProfileResponse,
) {
  if (!profile.payoutAccount?.ibanMasked) {
    return t('tabScreens.profile.hub.readiness.paymentsReviewValue')
  }

  const accountHolderName =
    profile.payoutAccount.accountHolderName ?? profile.personal.name

  if (accountHolderName) {
    return t(
      'tabScreens.profile.hub.readiness.paymentsEnabledValueWithAccountHolder',
      {
        accountHolderName: getProfileDisplayValue(accountHolderName),
        iban: getProfileDisplayValue(profile.payoutAccount.ibanMasked),
      },
    )
  }

  return t('tabScreens.profile.hub.readiness.paymentsEnabledValue', {
    iban: getProfileDisplayValue(profile.payoutAccount.ibanMasked),
  })
}

export function getProfileValidationCopy(t: TFunction) {
  return {
    appSettings: {
      invalidLanguageMode: t(
        'tabScreens.profile.validation.appSettings.invalidLanguageMode',
      ),
      invalidThemeMode: t(
        'tabScreens.profile.validation.appSettings.invalidThemeMode',
      ),
    },
    payments: {
      accountHolderNameRequired: t(
        'tabScreens.profile.validation.payments.accountHolderNameRequired',
      ),
      ibanInvalid: t('tabScreens.profile.validation.payments.ibanInvalid'),
      ibanRequired: t('tabScreens.profile.validation.payments.ibanRequired'),
    },
    personal: {
      emailInvalid: t('tabScreens.profile.validation.personal.emailInvalid'),
      emailRequired: t('tabScreens.profile.validation.personal.emailRequired'),
      nameRequired: t('tabScreens.profile.validation.personal.nameRequired'),
      nifInvalid: t('tabScreens.profile.validation.personal.nifInvalid'),
      nifRequired: t('tabScreens.profile.validation.personal.nifRequired'),
      phoneNumberInvalid: t(
        'tabScreens.profile.validation.personal.phoneNumberInvalid',
      ),
      phoneNumberRequired: t(
        'tabScreens.profile.validation.personal.phoneNumberRequired',
      ),
    },
    privacy: {
      alertsEmailInvalid: t(
        'tabScreens.profile.validation.privacy.alertsEmailInvalid',
      ),
      alertsEmailRequired: t(
        'tabScreens.profile.validation.privacy.alertsEmailRequired',
      ),
    },
  } as const
}

export function getThemeModeLabel(t: TFunction, themeMode: ThemeMode) {
  if (themeMode === 'dark') {
    return t('tabScreens.profile.appSettings.appearance.darkOption')
  }

  if (themeMode === 'light') {
    return t('tabScreens.profile.appSettings.appearance.lightOption')
  }

  return t('tabScreens.profile.appSettings.appearance.systemOption')
}

export function getLanguageModeLabel(t: TFunction, languageMode: LanguageMode) {
  if (languageMode === 'en') {
    return t('tabScreens.profile.appSettings.language.englishOption')
  }

  if (languageMode === 'pt') {
    return t('tabScreens.profile.appSettings.language.portugueseOption')
  }

  return t('tabScreens.profile.appSettings.language.systemOption')
}

export function getProfileAppearanceOptions(t: TFunction) {
  return [
    {
      label: t('tabScreens.profile.appSettings.appearance.systemOption'),
      value: 'system' as const,
    },
    {
      label: t('tabScreens.profile.appSettings.appearance.lightOption'),
      value: 'light' as const,
    },
    {
      label: t('tabScreens.profile.appSettings.appearance.darkOption'),
      value: 'dark' as const,
    },
  ]
}

export function getProfileLanguageOptions(t: TFunction) {
  return [
    {
      label: t('tabScreens.profile.appSettings.language.systemOption'),
      value: 'system' as const,
    },
    {
      label: t('tabScreens.profile.appSettings.language.portugueseOption'),
      value: 'pt' as const,
    },
    {
      label: t('tabScreens.profile.appSettings.language.englishOption'),
      value: 'en' as const,
    },
  ]
}

export function getProfileHubSections(
  t: TFunction,
  {
    biometricsSupported = true,
    deviceSettings,
    languageMode,
    profile,
    themeMode,
  }: {
    biometricsSupported?: boolean
    deviceSettings: DevicePrivacySettings
    languageMode: LanguageMode
    profile: ProfileResponse
    themeMode: ThemeMode
  },
) {
  return profileHubSectionSchema.array().parse([
    {
      id: 'alerts',
      previewRows: [
        {
          label: t('tabScreens.profile.hub.rows.alertsEmailTitle'),
          value: profile.preferences?.alertsEnabled
            ? t('tabScreens.profile.hub.rows.alertsEmailEnabledHelper')
            : t('tabScreens.profile.hub.rows.alertsEmailDisabledHelper'),
        },
        {
          label: t('tabScreens.profile.hub.rows.pushNotificationsTitle'),
          value: deviceSettings.pushNotificationsEnabled
            ? t('tabScreens.profile.hub.rows.pushNotificationsEnabledHelper')
            : t('tabScreens.profile.hub.rows.pushNotificationsDisabledHelper'),
        },
      ],
      summary: t('tabScreens.profile.hub.summaries.alerts'),
      title: t('tabScreens.profile.hub.cards.alerts'),
    },
    {
      id: 'personal',
      previewRows: [
        {
          label: t('tabScreens.profile.hub.rows.nameTitle'),
          value: getProfileDisplayValue(profile.personal.name),
        },
        {
          label: t('tabScreens.profile.hub.rows.emailTitle'),
          value: profile.personal.email,
        },
        {
          label: t('tabScreens.profile.hub.rows.phoneNumberTitle'),
          value: getProfileDisplayValue(profile.personal.phoneNumber),
        },
        {
          label: t('tabScreens.profile.hub.rows.nifTitle'),
          value: getProfileDisplayValue(profile.personal.nif),
        },
      ],
      summary: t('tabScreens.profile.hub.summaries.personal'),
      title: t('tabScreens.profile.hub.cards.personal'),
    },
    {
      id: 'payments',
      previewRows: [
        {
          label: t('tabScreens.profile.hub.rows.accountHolderNameTitle'),
          value: getProfileDisplayValue(
            profile.payoutAccount?.accountHolderName ?? profile.personal.name,
          ),
        },
        {
          label: t('tabScreens.profile.hub.rows.ibanTitle'),
          value: getProfileDisplayValue(profile.payoutAccount?.ibanMasked),
        },
      ],
      summary: t('tabScreens.profile.hub.summaries.payments'),
      title: t('tabScreens.profile.hub.cards.payments'),
    },
    {
      id: 'privacy',
      previewRows: [
        {
          label: t('tabScreens.profile.hub.rows.pinTitle'),
          value: deviceSettings.pinEnabled
            ? t('tabScreens.profile.hub.rows.pinEnabledHelper')
            : t('tabScreens.profile.hub.rows.pinDisabledHelper'),
        },
        ...(biometricsSupported
          ? [
              {
                label: t('tabScreens.profile.hub.rows.biometricsTitle'),
                value: deviceSettings.biometricsEnabled
                  ? t('tabScreens.profile.hub.rows.biometricsEnabledHelper')
                  : t('tabScreens.profile.hub.rows.biometricsDisabledHelper'),
              },
            ]
          : []),
      ],
      summary: t('tabScreens.profile.hub.summaries.privacy'),
      title: t('tabScreens.profile.hub.cards.privacy'),
    },
    {
      id: 'appSettings',
      previewRows: [
        {
          label: t('tabScreens.profile.hub.rows.appAppearanceTitle'),
          value: getThemeModeLabel(t, themeMode),
        },
        {
          label: t('tabScreens.profile.hub.rows.languageTitle'),
          value: getLanguageModeLabel(t, languageMode),
        },
      ],
      summary: t('tabScreens.profile.hub.summaries.appSettings'),
      title: t('tabScreens.profile.hub.cards.appSettings'),
    },
  ])
}

export function getProfileHubReadiness(
  t: TFunction,
  {
    biometricsSupported = true,
    deviceSettings,
    profile,
  }: {
    biometricsSupported?: boolean
    deviceSettings: DevicePrivacySettings
    profile: ProfileResponse
  },
) {
  const paymentsReady = Boolean(profile.payoutAccount?.ibanMasked)
  const securityReady =
    deviceSettings.pinEnabled ||
    (biometricsSupported && deviceSettings.biometricsEnabled)
  const alertsReady =
    (profile.preferences?.alertsEnabled ?? false) ||
    deviceSettings.pushNotificationsEnabled
  const badgeTone =
    paymentsReady && securityReady && alertsReady ? 'success' : 'warning'
  const securityItems: {
    id: 'security'
    label: string
    tone: 'success' | 'warning'
    value: string
  }[] = [
    {
      id: 'security',
      label: t('tabScreens.profile.hub.readiness.securityLabel'),
      tone: securityReady ? 'success' : 'warning',
      value:
        deviceSettings.pinEnabled && deviceSettings.biometricsEnabled
          ? t('tabScreens.profile.hub.readiness.securityAllValue')
          : deviceSettings.pinEnabled
            ? t('tabScreens.profile.hub.readiness.securityPinValue')
            : deviceSettings.biometricsEnabled
              ? t('tabScreens.profile.hub.readiness.securityBiometricsValue')
              : t(
                  biometricsSupported
                    ? 'tabScreens.profile.hub.readiness.securityReviewValue'
                    : 'tabScreens.profile.hub.readiness.securityReviewPinValue',
                ),
    },
  ]

  return {
    badgeLabel:
      badgeTone === 'success'
        ? t('tabScreens.profile.hub.readiness.readyBadge')
        : t('tabScreens.profile.hub.readiness.reviewBadge'),
    badgeTone,
    description:
      badgeTone === 'success'
        ? t('tabScreens.profile.hub.readiness.readyDescription')
        : t('tabScreens.profile.hub.readiness.reviewDescription'),
    items: [
      {
        id: 'payments',
        label: t('tabScreens.profile.hub.readiness.paymentsLabel'),
        tone: paymentsReady ? 'success' : 'warning',
        value: getProfilePaymentsReadinessValue(t, profile),
      },
      ...securityItems,
      {
        id: 'alerts',
        label: t('tabScreens.profile.hub.readiness.alertsLabel'),
        tone: alertsReady ? 'success' : 'warning',
        value:
          (profile.preferences?.alertsEnabled ?? false) &&
          deviceSettings.pushNotificationsEnabled
            ? t('tabScreens.profile.hub.readiness.alertsAllValue')
            : profile.preferences?.alertsEnabled
              ? t('tabScreens.profile.hub.readiness.alertsEmailValue')
              : deviceSettings.pushNotificationsEnabled
                ? t('tabScreens.profile.hub.readiness.alertsPushValue')
                : t('tabScreens.profile.hub.readiness.alertsReviewValue'),
      },
    ] as const,
    title:
      badgeTone === 'success'
        ? t('tabScreens.profile.hub.readiness.readyTitle')
        : t('tabScreens.profile.hub.readiness.reviewTitle'),
  } as const
}

export function getProfileHeroStats(
  t: TFunction,
  locale: string,
  stats: ProfileSummaryMetrics,
) {
  return profileSummaryStatSchema.array().parse([
    {
      label: t(
        'tabScreens.profile.summary.sections.totals.returnedPackagesLabel',
      ),
      value: formatNumber(stats.returnedPackagesCount, locale),
    },
    {
      helper:
        stats.processingTransfersCount > 0
          ? t('tabScreens.profile.summary.sections.hero.pendingTransferActive')
          : t('tabScreens.profile.summary.sections.hero.pendingTransferEmpty'),
      label: t(
        'tabScreens.profile.summary.sections.totals.completedTransfersLabel',
      ),
      value: formatNumber(stats.completedTransfersCount, locale),
    },
    {
      label: t(
        'tabScreens.profile.summary.sections.totals.pendingTransfersLabel',
      ),
      value: formatNumber(stats.processingTransfersCount, locale),
    },
  ])
}

export function getProfileSummarySections(
  t: TFunction,
  locale: string,
  stats: ProfileSummaryMetrics,
  memberSince: string,
) {
  const memberSinceValue = formatProfileMemberSince(locale, memberSince)

  return {
    hero: {
      detailStats: getProfileHeroStats(t, locale, stats),
      headlineLabel: t(
        'tabScreens.profile.summary.sections.hero.headlineLabel',
      ),
      headlineValue: formatCurrencyFromCents(
        stats.creditsEarned.amountMinor,
        locale,
      ),
      supportingText: t(
        'tabScreens.profile.summary.sections.hero.supportingText',
        {
          memberSince: memberSinceValue,
          pendingTransfers: formatNumber(
            stats.processingTransfersCount,
            locale,
          ),
        },
      ),
      title: t('tabScreens.profile.summary.sections.hero.title'),
    },
  } as const
}

export function formatProfileMemberSince(locale: string, memberSince: string) {
  return formatMonthYear(memberSince, locale)
}
