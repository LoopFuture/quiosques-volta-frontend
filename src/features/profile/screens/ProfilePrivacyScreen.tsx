import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { createZodResolver } from '@/features/app-data/forms'
import {
  authenticateWithAvailableBiometrics,
  useBiometricHardwareAvailability,
} from '@/features/auth/biometrics'
import { clearStoredAppPin, saveStoredAppPin } from '@/features/auth/pin'
import { YStack } from 'tamagui'
import { QueryErrorState, SkeletonBlock, SurfaceCard } from '@/components/ui'
import { useActionToast } from '@/features/app-shell/hooks/useActionToast'
import { ProfileDetailScreenFrame } from '../components/ProfileDetailScreenFrame'
import {
  getProfilePrivacyFormDefaultValues,
  getProfilePrivacyFormSchema,
  type ProfilePrivacyFormValues,
} from '../forms'
import { useDevicePrivacySettings, useProfileQuery } from '../hooks'
import { getProfileValidationCopy } from '../presentation'
import {
  SettingsSectionHeader,
  SettingsToggleRow,
} from '../components/ProfilePreferenceControls'
import { PinPreferenceCard } from '../components/PinPreferenceCard'

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
      <YStack gap="$3">
        {Array.from({ length: 2 }).map((_, index) => (
          <YStack key={`profile-privacy-skeleton-${index}`} gap="$3">
            <SkeletonBlock height={14} width="36%" />
            <SkeletonBlock height={index === 0 ? 54 : 42} width="100%" />
          </YStack>
        ))}
      </YStack>
    </SurfaceCard>
  )
}

function ProfilePrivacyForm() {
  const hasBiometricHardware = useBiometricHardwareAvailability()
  const { settings, setSettings } = useDevicePrivacySettings()
  const { showError, showSuccess } = useActionToast()
  const { t } = useTranslation()
  const validationCopy = getProfileValidationCopy(t)
  const { control, setValue } = useForm<ProfilePrivacyFormValues>({
    defaultValues: getProfilePrivacyFormDefaultValues({
      alertsEmail: '',
      alertsEnabled: false,
      ...settings,
    }),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    resolver: createZodResolver(
      getProfilePrivacyFormSchema(validationCopy.privacy),
    ),
  })

  useEffect(() => {
    setValue('biometricsEnabled', settings.biometricsEnabled)
    setValue('pinEnabled', settings.pinEnabled)
  }, [setValue, settings.biometricsEnabled, settings.pinEnabled])
  const pinCopy = {
    cancelLabel: t('tabScreens.profile.privacy.pinCancelLabel'),
    changeLabel: t('tabScreens.profile.privacy.pinChangeLabel'),
    confirmPinLabel: t('tabScreens.profile.privacy.pinConfirmLabel'),
    enabledHelper: t('tabScreens.profile.privacy.pinEnabledHelper'),
    invalidPinError: t('tabScreens.profile.privacy.pinInvalidError'),
    label: t('tabScreens.profile.privacy.pinLabel'),
    mismatchError: t('tabScreens.profile.privacy.pinMismatchError'),
    pinHelper: t('tabScreens.profile.privacy.pinHelper'),
    pinLabel: t('tabScreens.profile.privacy.pinInputLabel'),
    removeLabel: t('tabScreens.profile.privacy.pinRemoveLabel'),
    saveLabel: t('tabScreens.profile.privacy.pinSaveLabel'),
    setLabel: t('tabScreens.profile.privacy.pinSetLabel'),
  } as const

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

  async function handleSavePin(pin: string) {
    try {
      await saveStoredAppPin(pin)
      setValue('pinEnabled', true)
      setSettings({
        ...settings,
        pinEnabled: true,
      })
      showSuccess(
        t('tabScreens.profile.privacy.pinLabel'),
        t('tabScreens.profile.privacy.savedOnThisDeviceToast'),
      )
    } catch {
      showError(
        t('tabScreens.profile.privacy.pinLabel'),
        t('tabScreens.profile.privacy.pinSaveErrorToast'),
      )
      throw new Error('pin-save-failed')
    }
  }

  async function handleRemovePin() {
    try {
      await clearStoredAppPin()
      setValue('pinEnabled', false)
      setSettings({
        ...settings,
        pinEnabled: false,
      })
      showSuccess(
        t('tabScreens.profile.privacy.pinLabel'),
        t('tabScreens.profile.privacy.savedOnThisDeviceToast'),
      )
    } catch {
      showError(
        t('tabScreens.profile.privacy.pinLabel'),
        t('tabScreens.profile.privacy.pinRemoveErrorToast'),
      )
    }
  }

  return (
    <YStack gap="$4">
      <YStack gap="$3">
        <SettingsSectionHeader
          helperText={t('tabScreens.profile.privacy.deviceSectionHelper')}
          title={t('tabScreens.profile.privacy.deviceSectionTitle')}
        />
        {hasBiometricHardware ? (
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
        ) : null}
        <PinPreferenceCard
          copy={pinCopy}
          enabled={settings.pinEnabled}
          onRemovePin={() => handleRemovePin()}
          onSavePin={handleSavePin}
          testIDPrefix="profile-privacy-pin"
        />
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
        <ProfilePrivacyForm />
      )}
    </ProfileDetailScreenFrame>
  )
}
