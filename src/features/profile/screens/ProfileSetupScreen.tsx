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
import { clearStoredAppPin, saveStoredAppPin } from '@/features/auth/pin'
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
import { PinPreferenceCard } from '../components/PinPreferenceCard'
import { getProfileValidationCopy } from '../presentation'

const totalSteps = 4

type SetupStepId = 'notifications' | 'payments' | 'personal' | 'security'

const setupStepFieldNames: Record<
  SetupStepId,
  (keyof ProfileSetupFormValues)[]
> = {
  notifications: ['alertsEnabled', 'pushNotificationsEnabled'],
  payments: ['accountHolderName', 'iban'],
  personal: ['email', 'name', 'phoneNumber', 'nif'],
  security: ['biometricsEnabled', 'pinEnabled'],
}

const setupStepOrder: SetupStepId[] = [
  'personal',
  'payments',
  'notifications',
  'security',
]

const visuallyHiddenTextStyle = {
  height: 1,
  left: 0,
  opacity: 0,
  position: 'absolute' as const,
  top: 0,
  width: 1,
}

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
      accessibilityRole="header"
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
  isCompactLayout,
  statusLabel,
  title,
}: {
  email: string
  helperText: string
  isCompactLayout: boolean
  statusLabel: string
  title: string
}) {
  return (
    <SurfaceCard tone="accent">
      <YStack gap="$3">
        <XStack
          flexDirection={isCompactLayout ? 'column' : 'row'}
          items={isCompactLayout ? 'flex-start' : 'center'}
          justify="space-between"
          gap="$3"
          style={{ minWidth: 0 }}
        >
          <Text
            fontSize={16}
            fontWeight="800"
            style={{ flex: isCompactLayout ? undefined : 1, minWidth: 0 }}
          >
            {title}
          </Text>
          <StatusBadge tone="accent">{statusLabel}</StatusBadge>
        </XStack>
        <Text fontSize={18} fontWeight="700" style={{ flexShrink: 1 }}>
          {email}
        </Text>
        <Text color="$color11" fontSize={14} style={{ flexShrink: 1 }}>
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
    isPhysicalDevice,
    isSyncing: isSyncingPushNotifications,
    permissionStatus,
    registrationErrorCode,
    requestPushPermissionAndToken,
  } = usePushNotifications()
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const { fontScale, width } = useWindowDimensions()
  const validationCopy = getProfileValidationCopy(t)
  const prefersExpandedTextLayout = fontScale > 1.15
  const isCompactLayout = width < 360 || prefersExpandedTextLayout
  const stepTitleFontSize = isCompactLayout ? 26 : 30
  const stepTitleLineHeight = isCompactLayout ? 32 : 36
  const stepDescriptionFontSize = 16
  const stepDescriptionLineHeight = isCompactLayout ? 24 : 25
  const defaultSnapshot = useMemo(() => {
    const setupProfile = getProfileSetupSeedState({
      deviceSettings: settings,
      identity,
      profile: profile ?? undefined,
    }).profile

    return getProfileSetupSnapshotFromProfile(setupProfile, settings)
  }, [identity, profile, settings])
  const currentStepId = setupStepOrder[activeStepIndex]
  const currentStepTitle = t(
    `tabScreens.profile.setup.steps.${currentStepId}.title`,
  )
  const currentStepValueLabel = t('tabScreens.profile.setup.progressValue', {
    currentStep: activeStepIndex + 1,
    totalSteps,
  })
  const currentStepAnnouncement = `${currentStepValueLabel}. ${currentStepTitle}`
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
      'tabScreens.profile.setup.steps.notifications.pushNotificationsHelper',
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
  } as const
  const pinCopy = {
    cancelLabel: t('tabScreens.profile.privacy.pinCancelLabel'),
    changeLabel: t('tabScreens.profile.privacy.pinChangeLabel'),
    confirmPinLabel: t('tabScreens.profile.privacy.pinConfirmLabel'),
    enabledHelper: t('tabScreens.profile.privacy.pinEnabledHelper'),
    invalidPinError: t('tabScreens.profile.privacy.pinInvalidError'),
    label: t('tabScreens.profile.privacy.pinLabel'),
    mismatchError: t('tabScreens.profile.privacy.pinMismatchError'),
    pinHelper: t('tabScreens.profile.setup.steps.security.pinHelper'),
    pinLabel: t('tabScreens.profile.privacy.pinInputLabel'),
    removeLabel: t('tabScreens.profile.privacy.pinRemoveLabel'),
    saveLabel: t('tabScreens.profile.privacy.pinSaveLabel'),
    setLabel: t('tabScreens.profile.privacy.pinSetLabel'),
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

  async function handleAdvance() {
    const isValid = await trigger(setupStepFieldNames[currentStepId])

    if (!isValid) {
      return
    }

    if (currentStepId === 'security') {
      await handleSubmit(async (values) => {
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
            pinEnabled: values.pinEnabled,
            pushNotificationsEnabled: values.pushNotificationsEnabled,
          })
          router.replace(homeRoutes.index)
        } catch {
          showError(
            t('tabScreens.profile.setup.actions.finishLabel'),
            t('tabScreens.profile.setup.submitError'),
          )
        }
      })()

      return
    }

    if (currentStepId === 'personal') {
      const currentAccountHolderName = getValues('accountHolderName').trim()

      if (currentAccountHolderName.length === 0) {
        setValue('accountHolderName', getValues('name').trim(), {
          shouldDirty: false,
          shouldTouch: false,
          shouldValidate: false,
        })
      }
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
          {isCompactLayout ? (
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
        <Text
          accessibilityLiveRegion="polite"
          style={visuallyHiddenTextStyle}
          testID="profile-setup-step-announcement"
        >
          {currentStepAnnouncement}
        </Text>

        <StepProgress
          currentStep={activeStepIndex + 1}
          label={t('tabScreens.profile.setup.progressLabel')}
          totalSteps={totalSteps}
          valueLabel={currentStepValueLabel}
        />

        {currentStepId === 'personal' ? (
          <>
            <YStack gap="$2">
              <Text
                accessibilityRole="header"
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
              isCompactLayout={isCompactLayout}
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
                        testID="profile-setup-name-input"
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
                        testID="profile-setup-phone-number-input"
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
                        testID="profile-setup-nif-input"
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
                accessibilityRole="header"
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
                    name="accountHolderName"
                    render={({ field, fieldState }) => (
                      <FormField
                        autoCapitalize="words"
                        errorText={fieldState.error?.message}
                        helperText={
                          fieldState.error
                            ? undefined
                            : t(
                                'tabScreens.profile.payments.accountHolderNameHelper',
                              )
                        }
                        label={t(
                          'tabScreens.profile.payments.accountHolderNameLabel',
                        )}
                        onBlur={field.onBlur}
                        onChangeText={field.onChange}
                        required
                        testID="profile-setup-account-holder-name-input"
                        value={field.value}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="iban"
                    render={({ field, fieldState }) => (
                      <FormField
                        autoComplete="off"
                        autoCapitalize="characters"
                        autoCorrect={false}
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
                        spellCheck={false}
                        testID="profile-setup-iban-input"
                        value={field.value}
                      />
                    )}
                  />
                </YStack>
              </SeparatedStack>
            </SurfaceCard>
          </>
        ) : null}

        {currentStepId === 'notifications' ? (
          <>
            <YStack gap="$2">
              <Text
                accessibilityRole="header"
                fontSize={stepTitleFontSize}
                fontWeight="900"
                lineHeight={stepTitleLineHeight}
              >
                {t('tabScreens.profile.setup.steps.notifications.title')}
              </Text>
              <Text
                color="$color11"
                fontSize={stepDescriptionFontSize}
                lineHeight={stepDescriptionLineHeight}
              >
                {t('tabScreens.profile.setup.steps.notifications.description')}
              </Text>
            </YStack>

            <YStack gap="$3">
              <SetupSectionLabel>
                {t(
                  'tabScreens.profile.setup.steps.notifications.accountSectionLabel',
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
                    isPending={isSyncingPushNotifications}
                    isPhysicalDevice={isPhysicalDevice}
                    label={t(
                      'tabScreens.profile.setup.steps.notifications.pushNotificationsLabel',
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

            <YStack gap="$3">
              <SetupSectionLabel>
                {t(
                  'tabScreens.profile.setup.steps.notifications.emailSectionLabel',
                )}
              </SetupSectionLabel>
              <SurfaceCard tone="accent">
                <SeparatedStack
                  separatorProps={{ tone: 'accent' }}
                  separatorSpacing="$3"
                >
                  <YStack gap="$1">
                    <Text fontSize={14} fontWeight="700">
                      {t(
                        'tabScreens.profile.setup.steps.notifications.emailAlertsTitle',
                      )}
                    </Text>
                    <Text color="$color11" fontSize={13}>
                      {t(
                        'tabScreens.profile.setup.steps.notifications.emailAlertsHelper',
                        {
                          email: defaultSnapshot.personal.email,
                        },
                      )}
                    </Text>
                  </YStack>
                  <Controller
                    control={control}
                    name="alertsEnabled"
                    render={({ field }) => (
                      <SettingsToggleRow
                        checked={field.value}
                        helperText={t(
                          'tabScreens.profile.setup.steps.notifications.emailAlertsConsentLabel',
                        )}
                        label={t(
                          'tabScreens.profile.setup.steps.notifications.emailAlertsLabel',
                        )}
                        onCheckedChange={(checked) => {
                          field.onChange(checked)
                        }}
                      />
                    )}
                  />
                </SeparatedStack>
              </SurfaceCard>
            </YStack>
          </>
        ) : null}

        {currentStepId === 'security' ? (
          <>
            <YStack gap="$2">
              <Text
                accessibilityRole="header"
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

            <YStack gap="$3">
              <SetupSectionLabel>
                {t(
                  'tabScreens.profile.setup.steps.security.deviceSectionLabel',
                )}
              </SetupSectionLabel>
              {hasBiometricHardware ? (
                <SurfaceCard>
                  <SeparatedStack>
                    <YStack gap="$3">
                      <Controller
                        control={control}
                        name="biometricsEnabled"
                        render={({ field }) => (
                          <SettingsToggleRow
                            checked={field.value}
                            helperText={t(
                              'tabScreens.profile.setup.steps.security.biometricsHelper',
                            )}
                            label={t(
                              'tabScreens.profile.privacy.biometricLabel',
                            )}
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
              <PinPreferenceCard
                copy={pinCopy}
                enabled={settings.pinEnabled}
                onRemovePin={() => handleRemovePin()}
                onSavePin={handleSavePin}
                testIDPrefix="profile-setup-pin"
              />
            </YStack>
          </>
        ) : null}
      </YStack>
    </ScreenContainer>
  )
}
