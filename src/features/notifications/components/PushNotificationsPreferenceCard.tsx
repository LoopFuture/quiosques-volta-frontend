import { useWindowDimensions } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'
import { PrimaryButton, SurfaceCard, ToggleSwitch } from '@/components/ui'
import type { Tone } from '@/components/ui'
import type { PushNotificationsRegistrationErrorCode } from '../models/runtime'

type PushNotificationsPreferenceCopy = {
  deniedHelper: string
  deviceRequiredHelper: string
  idleHelper: string
  openSettingsLabel: string
  pendingHelper: string
  readyHelper: string
  registrationErrorHelper: string
  settingsHelper: string
  tokenValue: (value: { token: string }) => string
}

type PushNotificationsPreferenceCardProps = {
  canAskAgain: boolean
  checked: boolean
  copy: PushNotificationsPreferenceCopy
  disabled?: boolean
  expoPushToken: string | null
  framed?: boolean
  isPending?: boolean
  isPhysicalDevice: boolean
  label: string
  onCheckedChange: (checked: boolean) => void
  onOpenSettings?: () => void
  permissionStatus: 'denied' | 'granted' | 'undetermined'
  registrationErrorCode: PushNotificationsRegistrationErrorCode | null
  testID?: string
  tone?: Tone
}

function isPushNotificationsBlocked({
  canAskAgain,
  permissionStatus,
}: Pick<
  PushNotificationsPreferenceCardProps,
  'canAskAgain' | 'permissionStatus'
>) {
  return permissionStatus === 'denied' && !canAskAgain
}

function getHelperText({
  canAskAgain,
  checked,
  copy,
  expoPushToken,
  isPending,
  isPhysicalDevice,
  permissionStatus,
  registrationErrorCode,
}: Pick<
  PushNotificationsPreferenceCardProps,
  | 'canAskAgain'
  | 'checked'
  | 'copy'
  | 'expoPushToken'
  | 'isPending'
  | 'isPhysicalDevice'
  | 'permissionStatus'
  | 'registrationErrorCode'
>) {
  if (isPending) {
    return {
      helperText: copy.pendingHelper,
      showOpenSettings: false,
      supportingText: undefined,
    }
  }

  if (!isPhysicalDevice || registrationErrorCode === 'device-required') {
    return {
      helperText: copy.deviceRequiredHelper,
      showOpenSettings: false,
      supportingText: undefined,
    }
  }

  if (registrationErrorCode) {
    return {
      helperText: copy.registrationErrorHelper,
      showOpenSettings: false,
      supportingText: undefined,
    }
  }

  if (checked && permissionStatus === 'granted') {
    return {
      helperText: copy.readyHelper,
      showOpenSettings: false,
      supportingText: expoPushToken
        ? copy.tokenValue({ token: expoPushToken })
        : undefined,
    }
  }

  if (permissionStatus === 'denied' && !canAskAgain) {
    return {
      helperText: copy.settingsHelper,
      showOpenSettings: true,
      supportingText: undefined,
    }
  }

  if (permissionStatus === 'denied') {
    return {
      helperText: copy.deniedHelper,
      showOpenSettings: false,
      supportingText: undefined,
    }
  }

  return {
    helperText: copy.idleHelper,
    showOpenSettings: false,
    supportingText: undefined,
  }
}

export function PushNotificationsPreferenceCard({
  canAskAgain,
  checked,
  copy,
  disabled = false,
  expoPushToken,
  framed = true,
  isPending = false,
  isPhysicalDevice,
  label,
  onCheckedChange,
  onOpenSettings,
  permissionStatus,
  registrationErrorCode,
  testID,
  tone = 'accent',
}: PushNotificationsPreferenceCardProps) {
  const { width } = useWindowDimensions()
  const isCompactWidth = width < 360
  const isBlocked = isPushNotificationsBlocked({
    canAskAgain,
    permissionStatus,
  })
  const effectiveChecked = checked && permissionStatus === 'granted'
  const isToggleDisabled = disabled || isPending || isBlocked
  const { helperText, showOpenSettings, supportingText } = getHelperText({
    canAskAgain,
    checked: effectiveChecked,
    copy,
    expoPushToken,
    isPending,
    isPhysicalDevice,
    permissionStatus,
    registrationErrorCode,
  })

  const content = (
    <YStack gap="$3">
      {isCompactWidth ? (
        <YStack gap="$3">
          <YStack gap="$1" style={{ minWidth: 0 }}>
            <Text fontSize={15} fontWeight="700">
              {label}
            </Text>
            <Text color="$color11" fontSize={14}>
              {helperText}
            </Text>
          </YStack>
          <XStack justify="flex-end">
            <ToggleSwitch
              accessibilityLabel={label}
              checked={effectiveChecked}
              disabled={isToggleDisabled}
              onCheckedChange={onCheckedChange}
            />
          </XStack>
        </YStack>
      ) : (
        <XStack gap="$3" items="center" justify="space-between">
          <YStack flex={1} gap="$1" style={{ minWidth: 0 }}>
            <Text fontSize={15} fontWeight="700">
              {label}
            </Text>
            <Text color="$color11" fontSize={14}>
              {helperText}
            </Text>
          </YStack>
          <ToggleSwitch
            accessibilityLabel={label}
            checked={effectiveChecked}
            disabled={isToggleDisabled}
            onCheckedChange={onCheckedChange}
          />
        </XStack>
      )}

      {supportingText ? (
        <Text color="$color10" fontSize={13} fontWeight="700">
          {supportingText}
        </Text>
      ) : null}

      {showOpenSettings && onOpenSettings ? (
        <PrimaryButton
          emphasis="outline"
          fullWidth={isCompactWidth}
          tone="neutral"
          onPress={onOpenSettings}
        >
          {copy.openSettingsLabel}
        </PrimaryButton>
      ) : null}
    </YStack>
  )

  if (!framed) {
    return <YStack testID={testID}>{content}</YStack>
  }

  return (
    <SurfaceCard testID={testID} tone={tone}>
      {content}
    </SurfaceCard>
  )
}
