import { useEffect } from 'react'
import { Linking } from 'react-native'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Text, YStack } from 'tamagui'
import {
  QueryErrorState,
  SeparatedStack,
  SkeletonBlock,
  SurfaceCard,
} from '@/components/ui'
import { createZodResolver } from '@/features/app-data/forms'
import { useE2EForcedQueryError } from '@/features/app-data/e2e/hooks'
import { useActionToast } from '@/features/app-shell/hooks/useActionToast'
import { PushNotificationsPreferenceCard } from '@/features/notifications/components/PushNotificationsPreferenceCard'
import { usePushNotifications } from '@/features/notifications/hooks'
import { ProfileDetailScreenFrame } from '../components/ProfileDetailScreenFrame'
import {
  SettingsSectionHeader,
  SettingsToggleRow,
} from '../components/ProfilePreferenceControls'
import {
  getProfilePrivacyFormDefaultValues,
  getProfilePrivacyFormSchema,
  toProfilePreferencesDraft,
  type ProfilePrivacyFormValues,
} from '../forms'
import {
  useDevicePrivacySettings,
  useProfileQuery,
  useUpdateProfilePreferencesMutation,
} from '../hooks'
import { getProfileValidationCopy } from '../presentation'

function ProfileAlertsScreenSkeleton() {
  return (
    <SurfaceCard testID="profile-alerts-screen-skeleton">
      <SeparatedStack>
        {Array.from({ length: 2 }).map((_, index) => (
          <YStack key={`profile-alerts-skeleton-${index}`} gap="$3">
            <SkeletonBlock height={14} width="36%" />
            <SkeletonBlock height={54} width="100%" />
          </YStack>
        ))}
      </SeparatedStack>
    </SurfaceCard>
  )
}

function ProfileAlertsForm({
  alertsEnabled,
  currentEmail,
}: {
  alertsEnabled: boolean
  currentEmail: string
}) {
  const updatePreferencesMutation = useUpdateProfilePreferencesMutation()
  const { settings, setSettings } = useDevicePrivacySettings()
  const { biometricsEnabled, pinEnabled, pushNotificationsEnabled } = settings
  const { showError, showSuccess } = useActionToast()
  const { t } = useTranslation()
  const validationCopy = getProfileValidationCopy(t)
  const {
    canAskAgain,
    isPhysicalDevice,
    isSyncing: isSyncingPushNotifications,
    permissionStatus,
    registrationErrorCode,
    requestPushPermissionAndToken,
  } = usePushNotifications()
  const { control, getValues, reset, setValue } =
    useForm<ProfilePrivacyFormValues>({
      defaultValues: getProfilePrivacyFormDefaultValues({
        alertsEmail: currentEmail,
        alertsEnabled,
        biometricsEnabled,
        pinEnabled,
        pushNotificationsEnabled,
      }),
      mode: 'onSubmit',
      reValidateMode: 'onChange',
      resolver: createZodResolver(
        getProfilePrivacyFormSchema(validationCopy.privacy),
      ),
    })

  useEffect(() => {
    if (permissionStatus === 'granted') {
      return
    }

    if (getValues('pushNotificationsEnabled')) {
      setValue('pushNotificationsEnabled', false)
    }

    if (!pushNotificationsEnabled) {
      return
    }

    setSettings({
      biometricsEnabled,
      pinEnabled,
      pushNotificationsEnabled: false,
    })
  }, [
    biometricsEnabled,
    getValues,
    permissionStatus,
    pinEnabled,
    pushNotificationsEnabled,
    setSettings,
    setValue,
  ])

  useEffect(() => {
    reset(
      getProfilePrivacyFormDefaultValues({
        alertsEmail: currentEmail,
        alertsEnabled,
        biometricsEnabled,
        pinEnabled,
        pushNotificationsEnabled,
      }),
      {
        keepDirtyValues: true,
      },
    )
  }, [
    alertsEnabled,
    biometricsEnabled,
    currentEmail,
    pinEnabled,
    pushNotificationsEnabled,
    reset,
  ])

  const pushNotificationsCopy = {
    deniedHelper: t('tabScreens.profile.privacy.pushNotificationsDeniedHelper'),
    deviceRequiredHelper: t(
      'tabScreens.profile.privacy.pushNotificationsDeviceRequiredHelper',
    ),
    idleHelper: t('tabScreens.profile.privacy.pushNotificationsHelper'),
    openSettingsLabel: t(
      'tabScreens.profile.privacy.pushNotificationsOpenSettingsLabel',
    ),
    pendingHelper: t(
      'tabScreens.profile.privacy.pushNotificationsPendingHelper',
    ),
    readyHelper: t('tabScreens.profile.privacy.pushNotificationsReadyHelper'),
    registrationErrorHelper: t(
      'tabScreens.profile.privacy.pushNotificationsRegistrationErrorHelper',
    ),
    settingsHelper: t(
      'tabScreens.profile.privacy.pushNotificationsSettingsHelper',
    ),
  } as const

  async function handlePushNotificationsToggleChange(nextValue: boolean) {
    if (!nextValue) {
      setSettings({
        biometricsEnabled,
        pinEnabled,
        pushNotificationsEnabled: false,
      })
      showSuccess(
        t('tabScreens.profile.alerts.pushNotificationsLabel'),
        t('tabScreens.profile.privacy.savedOnThisDeviceToast'),
      )
      return
    }

    const result = await requestPushPermissionAndToken()

    if (!result.isEnabled) {
      setValue('pushNotificationsEnabled', false)
      setSettings({
        biometricsEnabled,
        pinEnabled,
        pushNotificationsEnabled: false,
      })
      showError(
        t('tabScreens.profile.alerts.pushNotificationsLabel'),
        t('tabScreens.profile.privacy.pushNotificationsUnavailableToast'),
      )
      return
    }

    setSettings({
      biometricsEnabled,
      pinEnabled,
      pushNotificationsEnabled: true,
    })
    showSuccess(
      t('tabScreens.profile.alerts.pushNotificationsLabel'),
      t('tabScreens.profile.privacy.savedOnThisDeviceToast'),
    )
  }

  function handleEmailAlertsToggleChange(
    nextValue: boolean,
    previousValue: boolean,
  ) {
    setValue('alertsEnabled', nextValue)
    updatePreferencesMutation.mutate(
      {
        preferences: toProfilePreferencesDraft({
          ...getValues(),
          alertsEmail: currentEmail,
          alertsEnabled: nextValue,
        }),
      },
      {
        onError: () => {
          setValue('alertsEnabled', previousValue)
          showError(
            t('tabScreens.profile.alerts.emailAlertsLabel'),
            t('tabScreens.profile.alerts.emailAlertsErrorToast'),
          )
        },
        onSuccess: () => {
          showSuccess(
            t('tabScreens.profile.alerts.emailAlertsLabel'),
            t('tabScreens.profile.alerts.emailAlertsSuccessToast'),
          )
        },
      },
    )
  }

  return (
    <YStack gap="$4">
      <YStack gap="$3">
        <SettingsSectionHeader
          helperText={t('tabScreens.profile.alerts.sectionHelper')}
          title={t('tabScreens.profile.alerts.sectionTitle')}
        />
        <SurfaceCard tone="accent">
          <SeparatedStack
            separatorProps={{ tone: 'accent' }}
            separatorSpacing="$3"
          >
            <Controller
              control={control}
              name="pushNotificationsEnabled"
              render={({ field }) => (
                <PushNotificationsPreferenceCard
                  canAskAgain={canAskAgain}
                  checked={field.value}
                  copy={pushNotificationsCopy}
                  disabled={false}
                  framed={false}
                  isPending={isSyncingPushNotifications}
                  isPhysicalDevice={isPhysicalDevice}
                  label={t('tabScreens.profile.alerts.pushNotificationsLabel')}
                  permissionStatus={permissionStatus}
                  registrationErrorCode={registrationErrorCode}
                  testID="profile-alerts-push-notifications-card"
                  toggleTestID="profile-alerts-push-notifications-toggle"
                  onCheckedChange={(checked) => {
                    field.onChange(checked)
                    void handlePushNotificationsToggleChange(checked)
                  }}
                  onOpenSettings={() => {
                    void Linking.openSettings()
                  }}
                />
              )}
            />
            <YStack gap="$1">
              <Text fontSize={14} fontWeight="700">
                {t('tabScreens.profile.alerts.securityPreferencesTitle')}
              </Text>
              <Text color="$color11" fontSize={13}>
                {t('tabScreens.profile.alerts.securityPreferencesHelper', {
                  email: currentEmail,
                })}
              </Text>
            </YStack>
            <Controller
              control={control}
              name="alertsEnabled"
              render={({ field }) => (
                <SettingsToggleRow
                  checked={field.value}
                  disabled={updatePreferencesMutation.isPending}
                  helperText={t('tabScreens.profile.alerts.emailAlertsHelper')}
                  label={t('tabScreens.profile.alerts.emailAlertsLabel')}
                  onCheckedChange={(checked) => {
                    handleEmailAlertsToggleChange(checked, field.value)
                  }}
                  testID="profile-alerts-email-alerts-toggle"
                />
              )}
            />
          </SeparatedStack>
        </SurfaceCard>
      </YStack>
    </YStack>
  )
}

export function ProfileAlertsScreen() {
  const { clearForcedQueryError, isForcedQueryError } = useE2EForcedQueryError()
  const { t } = useTranslation()
  const { data: profile, isError, isPending, refetch } = useProfileQuery()

  return (
    <ProfileDetailScreenFrame
      description={t('tabScreens.profile.alerts.description')}
      testID="profile-alerts-screen"
      title={t('tabScreens.profile.alerts.title')}
    >
      {isForcedQueryError || (isError && !profile) ? (
        <QueryErrorState
          onRetry={() => {
            if (isForcedQueryError) {
              clearForcedQueryError()
              return
            }

            void refetch()
          }}
          testID="profile-alerts-screen-error-state"
        />
      ) : !profile || isPending ? (
        <ProfileAlertsScreenSkeleton />
      ) : (
        <ProfileAlertsForm
          alertsEnabled={profile.preferences?.alertsEnabled ?? false}
          currentEmail={
            profile.preferences?.alertsEmail ?? profile.personal.email
          }
        />
      )}
    </ProfileDetailScreenFrame>
  )
}
