import { useRouter, type Href } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import {
  Bell,
  CreditCard,
  FileText,
  Info,
  LockKeyhole,
  Palette,
  Shield,
  User,
} from '@tamagui/lucide-icons'
import { useTranslation } from 'react-i18next'
import { Text, XStack, YStack } from 'tamagui'
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
import { ProfileReadinessCard } from '../components/ProfileReadinessCard'
import { ProfileSectionCard } from '../components/ProfileSectionCard'
import { useDevicePrivacySettings, useProfileQuery } from '../hooks'
import { getProfileHubReadiness, getProfileHubSections } from '../presentation'
import { profileRoutes } from '../routes'
import { PROFILE_LEGAL_LINK_PATHS } from '../constants'
import { getProfileLegalLinkUrl } from '../runtime'

function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      color="$color10"
      fontSize={14}
      fontWeight="800"
      textTransform="uppercase"
    >
      {children}
    </Text>
  )
}

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
  const readiness = profile
    ? getProfileHubReadiness(t, {
        biometricsSupported: hasBiometricHardware !== false,
        deviceSettings: settings,
        profile,
      })
    : undefined
  const readinessItems =
    readiness?.items.filter((item) => item.tone === 'warning') ?? []
  const readinessActions = readinessItems.slice(0, 2).map((item) => {
    if (item.id === 'payments') {
      return {
        label: t('tabScreens.profile.hub.actions.reviewPayments'),
        onPress: () => router.push(profileRoutes.payments),
      }
    }

    return {
      label:
        item.id === 'security'
          ? t('tabScreens.profile.hub.actions.reviewSecurity')
          : t('tabScreens.profile.hub.actions.reviewAlerts'),
      onPress: () =>
        router.push(
          item.id === 'security' ? profileRoutes.privacy : profileRoutes.alerts,
        ),
    }
  })
  const orderedSections = hubSections
    ? (
        ['personal', 'payments', 'alerts', 'privacy', 'appSettings'] as const
      ).flatMap((id) => hubSections.find((section) => section.id === id) ?? [])
    : undefined
  const handleOpenPrivacyPolicy = () => {
    void WebBrowser.openBrowserAsync(
      getProfileLegalLinkUrl(PROFILE_LEGAL_LINK_PATHS.privacyPolicy),
    )
  }
  const handleOpenHelpCenter = () => {
    void WebBrowser.openBrowserAsync(
      getProfileLegalLinkUrl(PROFILE_LEGAL_LINK_PATHS.helpCenter),
    )
  }
  const handleOpenTermsAndConditions = () => {
    void WebBrowser.openBrowserAsync(
      getProfileLegalLinkUrl(PROFILE_LEGAL_LINK_PATHS.termsAndConditions),
    )
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
      ) : !profile ||
        !hubSections ||
        !readiness ||
        !orderedSections ||
        isPending ? (
        <ProfileScreenSkeleton />
      ) : (
        <>
          <ProfileReadinessCard
            actions={readinessActions}
            badgeLabel={readiness.badgeLabel}
            badgeTone={readiness.badgeTone}
            description={readiness.description}
            items={
              readinessItems.length > 0
                ? readinessItems.slice(0, 2)
                : readiness.items.slice(0, 2)
            }
            title={readiness.title}
          />

          <YStack gap="$3">
            <SectionLabel>
              {t('tabScreens.profile.hub.sections.primary')}
            </SectionLabel>
            <Text color="$color11" fontSize={15}>
              {t('tabScreens.profile.hub.accountDescription')}
            </Text>
          </YStack>

          <YStack gap="$3">
            {orderedSections.map((section) => (
              <ProfileSectionCard
                key={section.id}
                leading={hubIcons[section.id]}
                onPress={() => router.push(hubRoutes[section.id])}
                previewRows={section.previewRows}
                title={section.title}
              />
            ))}
          </YStack>

          <YStack gap="$4">
            <YStack gap="$2">
              <XStack items="center" justify="space-between">
                <YStack gap="$1">
                  <Text color="$color10" fontSize={12} fontWeight="800">
                    {t('tabScreens.profile.hub.supportLabel')}
                  </Text>
                  <Text color="$color11" fontSize={14}>
                    {t('tabScreens.profile.hub.supportDescription')}
                  </Text>
                </YStack>
              </XStack>
              <ProfileMenuCard
                rows={[
                  {
                    icon: <Info color="$accent11" size={18} />,
                    onPress: () => router.push(profileRoutes.help),
                    summary: t('tabScreens.profile.hub.rows.onboardingTitle'),
                    helper: t('tabScreens.profile.hub.rows.onboardingHelper'),
                    title: t('tabScreens.profile.hub.helpRowLabel'),
                  },
                ]}
              />
            </YStack>

            <YStack gap="$2" pt="$1">
              <YStack gap="$1">
                <Text color="$color10" fontSize={12} fontWeight="800">
                  {t('tabScreens.profile.hub.sections.help')}
                </Text>
                <Text color="$color11" fontSize={14}>
                  {t('tabScreens.profile.hub.helpLinksDescription')}
                </Text>
              </YStack>
              <ProfileMenuCard
                rows={[
                  {
                    icon: <Info color="$accent11" size={18} />,
                    onPress: handleOpenHelpCenter,
                    summary: t('tabScreens.profile.hub.rows.helpCenterTitle'),
                    helper: t('tabScreens.profile.hub.rows.helpCenterHelper'),
                    title: t('tabScreens.profile.hub.rows.helpCenterTitle'),
                  },
                  {
                    icon: <Shield color="$accent11" size={18} />,
                    onPress: handleOpenPrivacyPolicy,
                    summary: t(
                      'tabScreens.profile.hub.rows.privacyPolicyTitle',
                    ),
                    helper: t(
                      'tabScreens.profile.hub.rows.privacyPolicyHelper',
                    ),
                    title: t('tabScreens.profile.hub.rows.privacyPolicyTitle'),
                  },
                  {
                    icon: <FileText color="$accent11" size={18} />,
                    onPress: handleOpenTermsAndConditions,
                    summary: t('tabScreens.profile.hub.rows.termsTitle'),
                    helper: t('tabScreens.profile.hub.rows.termsHelper'),
                    title: t('tabScreens.profile.hub.rows.termsTitle'),
                  },
                ]}
              />
            </YStack>
          </YStack>

          <SurfaceCard gap="$3">
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
