import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useRouter } from 'expo-router'
import { ArrowLeft } from '@tamagui/lucide-icons'
import { Linking, useWindowDimensions } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Text, XStack, YStack } from 'tamagui'
import {
  FormField,
  PrimaryButton,
  SeparatedStack,
  ScreenContainer,
  StatusBadge,
  StepProgress,
  SurfaceCard,
  TopBar,
} from '@/components/ui'
import { createZodResolver } from '@/features/app-data/forms'
import { useActionToast } from '@/features/app-shell/hooks/useActionToast'
import {
  authenticateWithAvailableBiometrics,
  useBiometricHardwareAvailability,
} from '@/features/auth/biometrics'
import { useAuthSession } from '@/features/auth/hooks/useAuthSession'
import { homeRoutes } from '@/features/home/routes'
import { PushNotificationsPreferenceCard } from '@/features/notifications/components/PushNotificationsPreferenceCard'
import { usePushNotifications } from '@/features/notifications/hooks'
import {
  useCompleteProfileSetupMutation,
  useDevicePrivacySettings,
  useProfileQuery,
} from '../hooks'
import {
  getProfileSetupFormDefaultValues,
  getProfileSetupFormSchema,
  toProfileSetupSnapshot,
  type ProfileSetupFormValues,
} from '../forms'
import {
  getProfileSetupSeedState,
  getProfileSetupSnapshotFromProfile,
} from '../models'
import { SettingsToggleRow } from '../components/ProfilePreferenceControls'
import { getProfileValidationCopy } from '../presentation'

const totalSteps = 3

type SetupStepId = 'payments' | 'personal' | 'security'

const setupStepFieldNames: Record<
  SetupStepId,
  (keyof ProfileSetupFormValues)[]
> = {
  payments: ['iban', 'spinEnabled'],
  personal: ['email', 'name', 'phoneNumber', 'nif'],
  security: ['biometricsEnabled', 'pushNotificationsEnabled'],
}

const setupStepOrder: SetupStepId[] = ['personal', 'payments', 'security']

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

function SetupSectionLabel({ children }: { children: string }) {
  return (
    <Text
      color="$color10"
      fontSize={13}
      fontWeight="700"
      textTransform="uppercase"
    >
      {children}
    </Text>
  )
}

function VerifiedIdentityRow({
  email,
  helperText,
  statusLabel,
  title,
}: {
  email: string
  helperText: string
  statusLabel: string
  title: string
}) {
  return (
    <SurfaceCard tone="accent">
      <YStack gap="$3">
        <XStack items="center" justify="space-between" gap="$3">
          <Text fontSize={16} fontWeight="800" style={{ flex: 1 }}>
            {title}
          </Text>
          <StatusBadge tone="accent">{statusLabel}</StatusBadge>
        </XStack>
        <Text fontSize={18} fontWeight="700">
          {email}
        </Text>
        <Text color="$color11" fontSize={14}>
          {helperText}
        </Text>
      </YStack>
    </SurfaceCard>
  )
}

export function ProfileSetupScreen() {
  const router = useRouter()
  const { identity } = useAuthSession()
  const { t } = useTranslation()
  const hasBiometricHardware = useBiometricHardwareAvailability()
  const { showError, showSuccess } = useActionToast()
  const completeSetupMutation = useCompleteProfileSetupMutation()
  const { data: profile } = useProfileQuery()
  const { settings, setSettings } = useDevicePrivacySettings()
  const {
    canAskAgain,
    expoPushToken,
    isPhysicalDevice,
    isSyncing: isSyncingPushNotifications,
    permissionStatus,
    registrationErrorCode,
    requestPushPermissionAndToken,
  } = usePushNotifications()
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const { width } = useWindowDimensions()
  const validationCopy = getProfileValidationCopy(t)
  const isCompactWidth = width < 360
  const stepTitleFontSize = isCompactWidth ? 26 : 30
  const stepTitleLineHeight = isCompactWidth ? 32 : 36
  const stepDescriptionFontSize = isCompactWidth ? 16 : 17
  const stepDescriptionLineHeight = isCompactWidth ? 23 : 25
  const defaultSnapshot = useMemo(() => {
    const setupProfile = getProfileSetupSeedState({
      deviceSettings: settings,
      identity,
      profile: profile ?? undefined,
    }).profile

    return getProfileSetupSnapshotFromProfile(setupProfile, settings)
  }, [identity, profile, settings])
  const currentStepId = setupStepOrder[activeStepIndex]
  const { control, getValues, handleSubmit, reset, setValue, trigger } =
    useForm<ProfileSetupFormValues>({
      defaultValues: getProfileSetupFormDefaultValues(defaultSnapshot),
      mode: 'onSubmit',
      reValidateMode: 'onChange',
      resolver: createZodResolver(
        getProfileSetupFormSchema({
          payments: validationCopy.payments,
          personal: validationCopy.personal,
        }),
      ),
    })

  useEffect(() => {
    reset(getProfileSetupFormDefaultValues(defaultSnapshot))
  }, [defaultSnapshot, reset])

  useEffect(() => {
    if (permissionStatus === 'granted') {
      return
    }

    if (!getValues('pushNotificationsEnabled')) {
      return
    }

    setValue('pushNotificationsEnabled', false)
  }, [getValues, permissionStatus, setValue])

  const pushNotificationsCopy = {
    deniedHelper: t('tabScreens.profile.privacy.pushNotificationsDeniedHelper'),
    deviceRequiredHelper: t(
      'tabScreens.profile.privacy.pushNotificationsDeviceRequiredHelper',
    ),
    idleHelper: t(
      'tabScreens.profile.setup.steps.security.pushNotificationsHelper',
    ),
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

  async function handlePushNotificationsToggleChange(
    nextValue: boolean,
    onChange: (value: boolean) => void,
  ) {
    if (!nextValue) {
      onChange(false)
      return
    }

    const result = await requestPushPermissionAndToken()

    onChange(result.isEnabled)
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

  async function handleAdvance() {
    const isValid = await trigger(setupStepFieldNames[currentStepId])

    if (!isValid) {
      return
    }

    if (currentStepId === 'security') {
      await handleSubmit(async (values) => {
        setSubmissionError(null)
        try {
          await completeSetupMutation.mutateAsync({
            snapshot: toProfileSetupSnapshot(values),
          })
          showSuccess(
            t('tabScreens.profile.setup.actions.finishLabel'),
            t('tabScreens.profile.setup.successToast'),
          )
          setSettings({
            biometricsEnabled: values.biometricsEnabled,
            pushNotificationsEnabled: values.pushNotificationsEnabled,
          })
          router.replace(homeRoutes.index)
        } catch (error) {
          showError(
            t('tabScreens.profile.setup.actions.finishLabel'),
            t('tabScreens.profile.setup.submitError'),
          )
          setSubmissionError(
            error instanceof Error
              ? error.message
              : t('tabScreens.profile.setup.submitError'),
          )
        }
      })()

      return
    }

    setActiveStepIndex((currentIndex) =>
      Math.min(currentIndex + 1, setupStepOrder.length - 1),
    )
  }

  const headerTitle = t('tabScreens.profile.setup.topBarTitle')

  return (
    <ScreenContainer
      bottomInset
      contentProps={{ gap: '$5', pb: '$0' }}
      decorativeBackground={false}
      footer={
        <YStack gap="$3" pt="$5">
          {submissionError ? (
            <SurfaceCard
              bg="$red2"
              borderColor="$red8"
              testID="profile-setup-error"
            >
              <Text color="$red11" fontWeight="700">
                {submissionError}
              </Text>
            </SurfaceCard>
          ) : null}

          {isCompactWidth ? (
            <YStack gap="$3">
              {activeStepIndex > 0 ? (
                <PrimaryButton
                  emphasis="outline"
                  onPress={() => {
                    setActiveStepIndex((currentIndex) =>
                      Math.max(currentIndex - 1, 0),
                    )
                  }}
                  testID="profile-setup-back-button"
                  tone="neutral"
                >
                  {t('tabScreens.profile.setup.actions.backLabel')}
                </PrimaryButton>
              ) : null}

              <PrimaryButton
                isPending={completeSetupMutation.isPending}
                onPress={() => {
                  void handleAdvance()
                }}
                testID={
                  currentStepId === 'security'
                    ? 'profile-setup-finish-button'
                    : 'profile-setup-next-button'
                }
              >
                {currentStepId === 'security'
                  ? t('tabScreens.profile.setup.actions.finishLabel')
                  : t('tabScreens.profile.setup.actions.nextLabel')}
              </PrimaryButton>
            </YStack>
          ) : (
            <XStack gap="$3" justify="space-between">
              {activeStepIndex > 0 ? (
                <PrimaryButton
                  emphasis="outline"
                  flex={1}
                  fullWidth={false}
                  onPress={() => {
                    setActiveStepIndex((currentIndex) =>
                      Math.max(currentIndex - 1, 0),
                    )
                  }}
                  testID="profile-setup-back-button"
                  tone="neutral"
                >
                  {t('tabScreens.profile.setup.actions.backLabel')}
                </PrimaryButton>
              ) : (
                <XStack flex={1} />
              )}

              <PrimaryButton
                flex={1}
                fullWidth={false}
                isPending={completeSetupMutation.isPending}
                onPress={() => {
                  void handleAdvance()
                }}
                testID={
                  currentStepId === 'security'
                    ? 'profile-setup-finish-button'
                    : 'profile-setup-next-button'
                }
              >
                {currentStepId === 'security'
                  ? t('tabScreens.profile.setup.actions.finishLabel')
                  : t('tabScreens.profile.setup.actions.nextLabel')}
              </PrimaryButton>
            </XStack>
          )}
        </YStack>
      }
      header={
        <TopBar
          leftAction={
            activeStepIndex > 0
              ? {
                  icon: <ArrowLeft color="$accent11" size={18} />,
                  label: t('tabScreens.profile.setup.actions.backLabel'),
                  onPress: () => {
                    setActiveStepIndex((currentIndex) =>
                      Math.max(currentIndex - 1, 0),
                    )
                  },
                }
              : undefined
          }
          title={headerTitle}
          variant="title"
        />
      }
      keyboardAware
      scrollable
      testID="profile-setup-screen"
    >
      <YStack gap="$4" testID={`profile-setup-step-${currentStepId}`}>
        <StepProgress
          currentStep={activeStepIndex + 1}
          label={t('tabScreens.profile.setup.progressLabel')}
          totalSteps={totalSteps}
          valueLabel={t('tabScreens.profile.setup.progressValue', {
            currentStep: activeStepIndex + 1,
            totalSteps,
          })}
        />

        {currentStepId === 'personal' ? (
          <>
            <YStack gap="$2">
              <Text
                fontSize={stepTitleFontSize}
                fontWeight="900"
                lineHeight={stepTitleLineHeight}
              >
                {t('tabScreens.profile.setup.steps.personal.title')}
              </Text>
              <Text
                color="$color11"
                fontSize={stepDescriptionFontSize}
                lineHeight={stepDescriptionLineHeight}
              >
                {t('tabScreens.profile.setup.steps.personal.description')}
              </Text>
            </YStack>

            <VerifiedIdentityRow
              email={defaultSnapshot.personal.email}
              helperText={t(
                'tabScreens.profile.setup.steps.personal.lockedEmailHelper',
              )}
              statusLabel={t(
                'tabScreens.profile.setup.steps.personal.verifiedBadgeLabel',
              )}
              title={t('tabScreens.profile.setup.steps.personal.verifiedTitle')}
            />

            <SurfaceCard>
              <SeparatedStack separatorProps={{ my: '$4' }}>
                <YStack gap="$3">
                  <SetupSectionLabel>
                    {t(
                      'tabScreens.profile.setup.steps.personal.contactSectionLabel',
                    )}
                  </SetupSectionLabel>
                  <Controller
                    control={control}
                    name="name"
                    render={({ field, fieldState }) => (
                      <FormField
                        errorText={fieldState.error?.message}
                        label={t('tabScreens.profile.personal.nameLabel')}
                        onBlur={field.onBlur}
                        onChangeText={field.onChange}
                        required
                        value={field.value}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="phoneNumber"
                    render={({ field, fieldState }) => (
                      <FormField
                        errorText={fieldState.error?.message}
                        helperText={
                          fieldState.error
                            ? undefined
                            : t('tabScreens.profile.personal.phoneNumberHelper')
                        }
                        keyboardType="phone-pad"
                        label={t(
                          'tabScreens.profile.personal.phoneNumberLabel',
                        )}
                        onBlur={field.onBlur}
                        onChangeText={field.onChange}
                        required
                        value={field.value}
                      />
                    )}
                  />
                </YStack>

                <YStack gap="$3">
                  <SetupSectionLabel>
                    {t(
                      'tabScreens.profile.setup.steps.personal.taxSectionLabel',
                    )}
                  </SetupSectionLabel>
                  <Controller
                    control={control}
                    name="nif"
                    render={({ field, fieldState }) => (
                      <FormField
                        errorText={fieldState.error?.message}
                        helperText={
                          fieldState.error
                            ? undefined
                            : t('tabScreens.profile.personal.nifHelper')
                        }
                        keyboardType="number-pad"
                        label={t('tabScreens.profile.personal.nifLabel')}
                        onBlur={field.onBlur}
                        onChangeText={field.onChange}
                        required
                        value={field.value}
                      />
                    )}
                  />
                </YStack>
              </SeparatedStack>
            </SurfaceCard>
          </>
        ) : null}

        {currentStepId === 'payments' ? (
          <>
            <YStack gap="$2">
              <Text
                fontSize={stepTitleFontSize}
                fontWeight="900"
                lineHeight={stepTitleLineHeight}
              >
                {t('tabScreens.profile.setup.steps.payments.title')}
              </Text>
              <Text
                color="$color11"
                fontSize={stepDescriptionFontSize}
                lineHeight={stepDescriptionLineHeight}
              >
                {t('tabScreens.profile.setup.steps.payments.description')}
              </Text>
            </YStack>

            <SurfaceCard>
              <SeparatedStack separatorProps={{ my: '$4' }}>
                <YStack gap="$3">
                  <SetupSectionLabel>
                    {t(
                      'tabScreens.profile.setup.steps.payments.accountSectionLabel',
                    )}
                  </SetupSectionLabel>
                  <Controller
                    control={control}
                    name="iban"
                    render={({ field, fieldState }) => (
                      <FormField
                        autoCapitalize="characters"
                        errorText={fieldState.error?.message}
                        helperText={
                          fieldState.error
                            ? undefined
                            : t('tabScreens.profile.payments.ibanHelper')
                        }
                        label={t('tabScreens.profile.payments.ibanLabel')}
                        onBlur={field.onBlur}
                        onChangeText={field.onChange}
                        required
                        value={field.value}
                      />
                    )}
                  />
                </YStack>
                <YStack gap="$3">
                  <SetupSectionLabel>
                    {t(
                      'tabScreens.profile.setup.steps.payments.speedSectionLabel',
                    )}
                  </SetupSectionLabel>
                  <Controller
                    control={control}
                    name="spinEnabled"
                    render={({ field }) => (
                      <SettingsToggleRow
                        checked={field.value}
                        helperText={t('tabScreens.profile.payments.spinHelper')}
                        label={t('tabScreens.profile.payments.spinLabel')}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </YStack>
              </SeparatedStack>
            </SurfaceCard>
          </>
        ) : null}

        {currentStepId === 'security' ? (
          <>
            <YStack gap="$2">
              <Text
                fontSize={stepTitleFontSize}
                fontWeight="900"
                lineHeight={stepTitleLineHeight}
              >
                {t('tabScreens.profile.setup.steps.security.title')}
              </Text>
              <Text
                color="$color11"
                fontSize={stepDescriptionFontSize}
                lineHeight={stepDescriptionLineHeight}
              >
                {t('tabScreens.profile.setup.steps.security.description')}
              </Text>
            </YStack>

            {hasBiometricHardware ? (
              <SurfaceCard>
                <SeparatedStack>
                  <YStack gap="$3">
                    <SetupSectionLabel>
                      {t(
                        'tabScreens.profile.setup.steps.security.deviceSectionLabel',
                      )}
                    </SetupSectionLabel>
                    <Controller
                      control={control}
                      name="biometricsEnabled"
                      render={({ field }) => (
                        <SettingsToggleRow
                          checked={field.value}
                          helperText={t(
                            'tabScreens.profile.setup.steps.security.biometricsHelper',
                          )}
                          label={t('tabScreens.profile.privacy.biometricLabel')}
                          onCheckedChange={(checked) => {
                            void handleBiometricsToggleChange(
                              checked,
                              field.onChange,
                            )
                          }}
                        />
                      )}
                    />
                  </YStack>
                </SeparatedStack>
              </SurfaceCard>
            ) : null}

            <YStack gap="$3">
              <SetupSectionLabel>
                {t(
                  'tabScreens.profile.setup.steps.security.notificationsSectionLabel',
                )}
              </SetupSectionLabel>
              <Controller
                control={control}
                name="pushNotificationsEnabled"
                render={({ field }) => (
                  <PushNotificationsPreferenceCard
                    canAskAgain={canAskAgain}
                    checked={field.value}
                    copy={pushNotificationsCopy}
                    disabled={completeSetupMutation.isPending}
                    expoPushToken={expoPushToken}
                    isPending={isSyncingPushNotifications}
                    isPhysicalDevice={isPhysicalDevice}
                    label={t(
                      'tabScreens.profile.setup.steps.security.pushNotificationsLabel',
                    )}
                    permissionStatus={permissionStatus}
                    registrationErrorCode={registrationErrorCode}
                    testID="profile-setup-push-notifications-card"
                    tone="neutral"
                    onCheckedChange={(checked) => {
                      void handlePushNotificationsToggleChange(
                        checked,
                        field.onChange,
                      )
                    }}
                    onOpenSettings={() => {
                      void Linking.openSettings()
                    }}
                  />
                )}
              />
            </YStack>
          </>
        ) : null}
      </YStack>
    </ScreenContainer>
  )
}
