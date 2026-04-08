import { useEffect } from 'react'
import { Linking } from 'react-native'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { createZodResolver } from '@/features/app-data/forms'
import {
  authenticateWithAvailableBiometrics,
  useBiometricHardwareAvailability,
} from '@/features/auth/biometrics'
import { Text, YStack } from 'tamagui'
import {
  QueryErrorState,
  SeparatedStack,
  SkeletonBlock,
  SurfaceCard,
} from '@/components/ui'
import { useActionToast } from '@/features/app-shell/hooks/useActionToast'
import { PushNotificationsPreferenceCard } from '@/features/notifications/components/PushNotificationsPreferenceCard'
import { usePushNotifications } from '@/features/notifications/hooks'
import { ProfileDetailScreenFrame } from '../components/ProfileDetailScreenFrame'
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
import {
  SettingsSectionHeader,
  SettingsToggleRow,
} from '../components/ProfilePreferenceControls'

function getBiometricErrorToast(
  reason: 'cancelled' | 'failed' | 'not-available' | 'not-enrolled',
  t: ReturnType<typeof useTranslation>['t'],
) {
  if (reason === 'not-available') {
    return t('tabScreens.profile.privacy.biometricNotAvailableToast')
  }

  if (reason === 'not-enrolled') {
    return t('tabScreens.profile.privacy.biometricNotEnrolledToast')
  }

  if (reason === 'cancelled') {
    return t('tabScreens.profile.privacy.biometricCancelledToast')
  }

  return t('tabScreens.profile.privacy.biometricFailedToast')
}

function ProfilePrivacyScreenSkeleton() {
  return (
    <SurfaceCard testID="profile-privacy-screen-skeleton">
      <SeparatedStack>
        {Array.from({ length: 4 }).map((_, index) => (
          <YStack key={`profile-privacy-skeleton-${index}`} gap="$3">
            <SkeletonBlock height={14} width="36%" />
            <SkeletonBlock
              height={index === 0 || index === 2 ? 54 : 42}
              width="100%"
            />
          </YStack>
        ))}
      </SeparatedStack>
    </SurfaceCard>
  )
}

function ProfilePrivacyForm({
  alertsEnabled,
  currentEmail,
}: {
  alertsEnabled: boolean
  currentEmail: string
}) {
  const hasBiometricHardware = useBiometricHardwareAvailability()
  const updatePreferencesMutation = useUpdateProfilePreferencesMutation()
  const { settings, setSettings } = useDevicePrivacySettings()
  const { showError, showSuccess } = useActionToast()
  const { t } = useTranslation()
  const validationCopy = getProfileValidationCopy(t)
  const {
    canAskAgain,
    expoPushToken,
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
        ...settings,
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

    if (!settings.pushNotificationsEnabled) {
      return
    }

    setSettings({
      ...settings,
      pushNotificationsEnabled: false,
    })
  }, [getValues, permissionStatus, setSettings, setValue, settings])

  useEffect(() => {
    reset(
      getProfilePrivacyFormDefaultValues({
        alertsEmail: currentEmail,
        alertsEnabled,
        ...settings,
      }),
      {
        keepDirtyValues: true,
      },
    )
  }, [alertsEnabled, currentEmail, reset, settings])

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
    tokenValue: ({ token }: { token: string }) =>
      t('tabScreens.profile.privacy.pushNotificationsTokenValue', {
        token,
      }),
  } as const

  async function handlePushNotificationsToggleChange(nextValue: boolean) {
    if (!nextValue) {
      setSettings({
        ...settings,
        pushNotificationsEnabled: false,
      })
      showSuccess(
        t('tabScreens.profile.privacy.pushNotificationsLabel'),
        t('tabScreens.profile.privacy.savedOnThisDeviceToast'),
      )
      return
    }

    const result = await requestPushPermissionAndToken()

    if (!result.isEnabled) {
      setValue('pushNotificationsEnabled', false)
      setSettings({
        ...settings,
        pushNotificationsEnabled: false,
      })
      showError(
        t('tabScreens.profile.privacy.pushNotificationsLabel'),
        t('tabScreens.profile.privacy.pushNotificationsUnavailableToast'),
      )
      return
    }

    setSettings({
      ...settings,
      pushNotificationsEnabled: true,
    })
    showSuccess(
      t('tabScreens.profile.privacy.pushNotificationsLabel'),
      t('tabScreens.profile.privacy.savedOnThisDeviceToast'),
    )
  }

  async function handleBiometricsToggleChange(
    nextValue: boolean,
    onChange: (value: boolean) => void,
  ) {
    if (!nextValue) {
      onChange(false)
      setSettings({
        ...settings,
        biometricsEnabled: false,
      })
      showSuccess(
        t('tabScreens.profile.privacy.biometricLabel'),
        t('tabScreens.profile.privacy.savedOnThisDeviceToast'),
      )
      return
    }

    const result = await authenticateWithAvailableBiometrics({
      cancelLabel: t('auth.lock.cancelLabel'),
      promptMessage: t('auth.lock.promptMessage'),
    })

    if (!result.success) {
      onChange(false)
      setValue('biometricsEnabled', false)
      showError(
        t('tabScreens.profile.privacy.biometricLabel'),
        getBiometricErrorToast(result.reason, t),
      )
      return
    }

    onChange(true)
    setSettings({
      ...settings,
      biometricsEnabled: true,
    })
    showSuccess(
      t('tabScreens.profile.privacy.biometricLabel'),
      t('tabScreens.profile.privacy.savedOnThisDeviceToast'),
    )
  }

  function handleEmailAlertsToggleChange(nextValue: boolean) {
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
          showError(
            t('tabScreens.profile.privacy.emailAlertsLabel'),
            t('tabScreens.profile.privacy.emailAlertsErrorToast'),
          )
        },
        onSuccess: () => {
          showSuccess(
            t('tabScreens.profile.privacy.emailAlertsLabel'),
            t('tabScreens.profile.privacy.emailAlertsSuccessToast'),
          )
        },
      },
    )
  }

  return (
    <YStack gap="$4">
      {hasBiometricHardware ? (
        <YStack gap="$3">
          <SettingsSectionHeader
            helperText={t('tabScreens.profile.privacy.deviceSectionHelper')}
            title={t('tabScreens.profile.privacy.deviceSectionTitle')}
          />
          <SurfaceCard>
            <Controller
              control={control}
              name="biometricsEnabled"
              render={({ field }) => (
                <SettingsToggleRow
                  checked={field.value}
                  helperText={t('tabScreens.profile.privacy.biometricHelper')}
                  label={t('tabScreens.profile.privacy.biometricLabel')}
                  onCheckedChange={(checked) => {
                    void handleBiometricsToggleChange(checked, field.onChange)
                  }}
                />
              )}
            />
          </SurfaceCard>
        </YStack>
      ) : null}

      <YStack gap="$3">
        <SettingsSectionHeader
          helperText={t('tabScreens.profile.privacy.accountSectionHelper')}
          title={t('tabScreens.profile.privacy.accountSectionTitle')}
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
                  expoPushToken={expoPushToken}
                  framed={false}
                  isPending={isSyncingPushNotifications}
                  isPhysicalDevice={isPhysicalDevice}
                  label={t('tabScreens.profile.privacy.pushNotificationsLabel')}
                  permissionStatus={permissionStatus}
                  registrationErrorCode={registrationErrorCode}
                  testID="profile-privacy-push-notifications-card"
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
                {t('tabScreens.profile.privacy.securityPreferencesTitle')}
              </Text>
              <Text color="$color11" fontSize={13}>
                {t('tabScreens.profile.privacy.securityPreferencesHelper', {
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
                  helperText={t('tabScreens.profile.privacy.emailAlertsHelper')}
                  label={t('tabScreens.profile.privacy.emailAlertsLabel')}
                  onCheckedChange={(checked) => {
                    field.onChange(checked)
                    handleEmailAlertsToggleChange(checked)
                  }}
                />
              )}
            />
          </SeparatedStack>
        </SurfaceCard>
      </YStack>
    </YStack>
  )
}

export function ProfilePrivacyScreen() {
  const { t } = useTranslation()
  const { data: profile, isError, isPending, refetch } = useProfileQuery()

  return (
    <ProfileDetailScreenFrame
      description={t('tabScreens.profile.privacy.description')}
      testID="profile-privacy-screen"
      title={t('tabScreens.profile.privacy.title')}
    >
      {isError && !profile ? (
        <QueryErrorState
          onRetry={() => {
            void refetch()
          }}
          testID="profile-privacy-screen-error-state"
        />
      ) : !profile || isPending ? (
        <ProfilePrivacyScreenSkeleton />
      ) : (
        <ProfilePrivacyForm
          alertsEnabled={profile.preferences?.alertsEnabled ?? false}
          currentEmail={
            profile.preferences?.alertsEmail ?? profile.personal.email
          }
        />
      )}
    </ProfileDetailScreenFrame>
  )
}
