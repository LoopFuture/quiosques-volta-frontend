import type { ReactNode } from 'react'
import { useRouter, type Href } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import {
  Bell,
  CircleHelp,
  CreditCard,
  FileText,
  Info,
  LockKeyhole,
  Palette,
  Shield,
  User,
} from '@tamagui/lucide-icons'
import { useTranslation } from 'react-i18next'
import { Text, YStack } from 'tamagui'
import {
  PrimaryButton,
  QueryErrorState,
  ScreenContainer,
  SkeletonBlock,
  SurfaceCard,
} from '@/components/ui'
import { useBiometricHardwareAvailability } from '@/features/auth/biometrics'
import { useAuthSession } from '@/features/auth/hooks/useAuthSession'
import { authRoutes } from '@/features/auth/routes'
import { TabTopBar } from '@/features/app-shell/navigation/tab-header'
import { useAppPreferences } from '@/hooks/useAppPreferences'
import { ProfileMenuCard } from '../components/ProfileMenuCard'
import { ProfileSectionCard } from '../components/ProfileSectionCard'
import { useDevicePrivacySettings, useProfileQuery } from '../hooks'
import { PROFILE_LEGAL_LINK_PATHS } from '../constants'
import { getProfileHubSections } from '../presentation'
import { profileRoutes } from '../routes'
import { getProfileLegalLinkUrl } from '../runtime'

function ProfileScreenSkeleton() {
  return (
    <>
      <SurfaceCard gap="$4" p="$5" testID="profile-screen-skeleton">
        <YStack gap="$2">
          <SkeletonBlock height={18} width="40%" />
          <SkeletonBlock height={14} width="32%" />
        </YStack>
        <YStack gap="$3">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonBlock
              key={`profile-hero-skeleton-${index}`}
              height={96}
              width="30%"
            />
          ))}
        </YStack>
      </SurfaceCard>

      <YStack gap="$3">
        {Array.from({ length: 4 }).map((_, index) => (
          <SurfaceCard key={`profile-section-skeleton-${index}`}>
            <YStack gap="$3">
              <SkeletonBlock height={18} width="42%" />
              <SkeletonBlock height={14} width="68%" />
              <SkeletonBlock height={14} width="58%" />
            </YStack>
          </SurfaceCard>
        ))}
      </YStack>

      <SurfaceCard gap="$3">
        <SkeletonBlock height={18} width="34%" />
        <SkeletonBlock height={52} width="100%" />
        <SkeletonBlock height={52} width="100%" />
      </SurfaceCard>

      <SkeletonBlock height={50} rounded={999} width="100%" />
    </>
  )
}

export default function ProfileScreen() {
  const router = useRouter()
  const { t } = useTranslation()
  const { signOut } = useAuthSession()
  const hasBiometricHardware = useBiometricHardwareAvailability()
  const { languageMode, themeMode } = useAppPreferences()
  const { settings } = useDevicePrivacySettings()
  const {
    data: profile,
    isError,
    isPending,
    isRefetching,
    refetch,
  } = useProfileQuery()
  const hubIcons = {
    alerts: <Bell color="$accent11" size={20} />,
    appSettings: <Palette color="$accent11" size={20} />,
    payments: <CreditCard color="$accent11" size={20} />,
    personal: <User color="$accent11" size={20} />,
    privacy: <LockKeyhole color="$accent11" size={20} />,
  } as const
  const hubRoutes = {
    alerts: profileRoutes.alerts,
    appSettings: profileRoutes.appSettings,
    payments: profileRoutes.payments,
    personal: profileRoutes.personal,
    privacy: profileRoutes.privacy,
  } as const

  const handleRefresh = () => {
    void refetch()
  }

  const hubSections = profile
    ? getProfileHubSections(t, {
        biometricsSupported: hasBiometricHardware !== false,
        deviceSettings: settings,
        languageMode,
        profile,
        themeMode,
      })
    : undefined
  const orderedSections = hubSections
    ? (
        ['payments', 'personal', 'alerts', 'privacy', 'appSettings'] as const
      ).flatMap((id) => hubSections.find((section) => section.id === id) ?? [])
    : undefined
  const accountSections = orderedSections?.filter(
    (section) =>
      section.id === 'personal' ||
      section.id === 'payments' ||
      section.id === 'alerts',
  )
  const accountSecondarySections = orderedSections?.filter(
    (section) => section.id === 'personal' || section.id === 'alerts',
  )
  const deviceSections = orderedSections?.filter(
    (section) => section.id === 'privacy' || section.id === 'appSettings',
  )
  const isLoadingProfileHub =
    !profile || !hubSections || !orderedSections || isPending
  const handleOpenHelpCenter = () => {
    void WebBrowser.openBrowserAsync(
      getProfileLegalLinkUrl(PROFILE_LEGAL_LINK_PATHS.helpCenter),
    )
  }
  const handleOpenPrivacyPolicy = () => {
    void WebBrowser.openBrowserAsync(
      getProfileLegalLinkUrl(PROFILE_LEGAL_LINK_PATHS.privacyPolicy),
    )
  }
  const handleOpenTermsAndConditions = () => {
    void WebBrowser.openBrowserAsync(
      getProfileLegalLinkUrl(PROFILE_LEGAL_LINK_PATHS.termsAndConditions),
    )
  }
  const toMenuSummary = (
    section: NonNullable<typeof orderedSections>[number],
  ): {
    helper?: string
    summary: ReactNode
  } => {
    const [primaryRow, secondaryRow] = section.previewRows

    return {
      helper: secondaryRow
        ? `${secondaryRow.label}: ${secondaryRow.value}`
        : undefined,
      summary: primaryRow
        ? `${primaryRow.label}: ${primaryRow.value}`
        : t('tabScreens.profile.hub.cards.summary'),
    }
  }

  return (
    <ScreenContainer
      decorativeBackground={false}
      header={<TabTopBar routeName="profile" />}
      onRefresh={handleRefresh}
      refreshing={isRefetching}
      scrollable
      testID="profile-screen"
    >
      {isError && !profile ? (
        <QueryErrorState
          description={t('tabScreens.profile.errors.description')}
          onRetry={handleRefresh}
          recoveryHint={t('tabScreens.profile.errors.recoveryHint')}
          testID="profile-screen-error-state"
          title={t('tabScreens.profile.errors.title')}
        />
      ) : isLoadingProfileHub ? (
        <ProfileScreenSkeleton />
      ) : (
        <>
          <YStack gap="$4.5">
            <YStack gap="$2">
              <Text color="$color10" fontSize={12} fontWeight="800">
                {t('tabScreens.profile.hub.sections.account')}
              </Text>
              <Text color="$color11" fontSize={14}>
                {t('tabScreens.profile.hub.sections.accountDescription')}
              </Text>
            </YStack>
            {accountSections?.[0] ? (
              <ProfileSectionCard
                key={accountSections[0].id}
                decorativeAccent
                leading={hubIcons[accountSections[0].id]}
                onPress={() => router.push(hubRoutes[accountSections[0].id])}
                previewRows={accountSections[0].previewRows}
                title={accountSections[0].title}
                tone="accent"
              />
            ) : null}
            {accountSecondarySections?.length ? (
              <ProfileMenuCard
                rows={accountSecondarySections.map((section) => {
                  const { helper, summary } = toMenuSummary(section)

                  return {
                    helper,
                    icon: hubIcons[section.id],
                    onPress: () => router.push(hubRoutes[section.id]),
                    summary,
                    title: section.title,
                  }
                })}
              />
            ) : null}
          </YStack>

          <YStack gap="$4.5">
            <YStack gap="$2">
              <Text color="$color10" fontSize={12} fontWeight="800">
                {t('tabScreens.profile.hub.sections.device')}
              </Text>
              <Text color="$color11" fontSize={14}>
                {t('tabScreens.profile.hub.sections.deviceDescription')}
              </Text>
            </YStack>
            {deviceSections?.length ? (
              <ProfileMenuCard
                rows={deviceSections.map((section) => {
                  const { helper, summary } = toMenuSummary(section)

                  return {
                    helper,
                    icon: hubIcons[section.id],
                    onPress: () => router.push(hubRoutes[section.id]),
                    summary,
                    title: section.title,
                  }
                })}
              />
            ) : null}
          </YStack>

          <YStack gap="$3.5">
            <YStack gap="$2">
              <Text color="$color10" fontSize={12} fontWeight="800">
                {t('tabScreens.profile.hub.sections.help')}
              </Text>
              <Text color="$color11" fontSize={14}>
                {t('tabScreens.profile.hub.sections.helpDescription')}
              </Text>
            </YStack>
            <ProfileMenuCard
              rows={[
                {
                  icon: <Info color="$accent11" size={18} />,
                  onPress: () => router.push(profileRoutes.help),
                  summary: t('tabScreens.profile.hub.rows.onboardingTitle'),
                  helper: undefined,
                  title: t('tabScreens.profile.hub.helpRowLabel'),
                },
                {
                  accessibilityLabel: [
                    t('tabScreens.profile.hub.rows.helpCenterTitle'),
                    t('tabScreens.profile.hub.rows.opensInBrowserLabel'),
                  ].join('. '),
                  external: true,
                  icon: <CircleHelp color="$accent11" size={18} />,
                  onPress: handleOpenHelpCenter,
                  summary: t('tabScreens.profile.hub.rows.helpCenterSummary'),
                  helper: undefined,
                  title: t('tabScreens.profile.hub.rows.helpCenterLabel'),
                },
                {
                  accessibilityLabel: [
                    t('tabScreens.profile.hub.rows.privacyPolicyTitle'),
                    t('tabScreens.profile.hub.rows.opensInBrowserLabel'),
                  ].join('. '),
                  external: true,
                  icon: <Shield color="$accent11" size={18} />,
                  onPress: handleOpenPrivacyPolicy,
                  summary: t(
                    'tabScreens.profile.hub.rows.privacyPolicySummary',
                  ),
                  helper: undefined,
                  title: t('tabScreens.profile.hub.rows.privacyPolicyLabel'),
                },
                {
                  accessibilityLabel: [
                    t('tabScreens.profile.hub.rows.termsTitle'),
                    t('tabScreens.profile.hub.rows.opensInBrowserLabel'),
                  ].join('. '),
                  external: true,
                  icon: <FileText color="$accent11" size={18} />,
                  onPress: handleOpenTermsAndConditions,
                  summary: t('tabScreens.profile.hub.rows.termsSummary'),
                  helper: undefined,
                  title: t('tabScreens.profile.hub.rows.termsLabel'),
                },
              ]}
            />
          </YStack>

          <SurfaceCard gap="$3" mt="$1">
            <YStack gap="$1">
              <Text color="$color10" fontSize={12} fontWeight="800">
                {t('tabScreens.profile.hub.sessionLabel')}
              </Text>
              <Text color="$color11" fontSize={14}>
                {t('tabScreens.profile.hub.sessionDescription')}
              </Text>
            </YStack>
            <PrimaryButton
              accessibilityLabel={t('tabScreens.profile.hub.logoutLabel')}
              emphasis="outline"
              tone="error"
              onPress={() => {
                void (async () => {
                  await signOut()
                  router.replace(authRoutes.index as Href)
                })()
              }}
              testID="profile-logout-button"
            >
              {t('tabScreens.profile.hub.logoutLabel')}
            </PrimaryButton>
          </SurfaceCard>
        </>
      )}
    </ScreenContainer>
  )
}
