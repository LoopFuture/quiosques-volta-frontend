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
}

type PushNotificationsPreferenceCardProps = {
  canAskAgain: boolean
  checked: boolean
  copy: PushNotificationsPreferenceCopy
  disabled?: boolean
  framed?: boolean
  isPending?: boolean
  isPhysicalDevice: boolean
  label: string
  onCheckedChange: (checked: boolean) => void
  onOpenSettings?: () => void
  permissionStatus: 'denied' | 'granted' | 'undetermined'
  registrationErrorCode: PushNotificationsRegistrationErrorCode | null
  testID?: string
  toggleTestID?: string
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
  isPending,
  isPhysicalDevice,
  permissionStatus,
  registrationErrorCode,
}: Pick<
  PushNotificationsPreferenceCardProps,
  | 'canAskAgain'
  | 'checked'
  | 'copy'
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
      supportingText: undefined,
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
  framed = true,
  isPending = false,
  isPhysicalDevice,
  label,
  onCheckedChange,
  onOpenSettings,
  permissionStatus,
  registrationErrorCode,
  testID,
  toggleTestID,
  tone = 'accent',
}: PushNotificationsPreferenceCardProps) {
  const { fontScale, width } = useWindowDimensions()
  const isCompactLayout = width < 360 || fontScale > 1.15
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
    isPending,
    isPhysicalDevice,
    permissionStatus,
    registrationErrorCode,
  })
  const accessibilityHint = [helperText, supportingText]
    .filter(Boolean)
    .join('. ')

  const content = (
    <YStack gap="$3">
      {isCompactLayout ? (
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
              accessibilityHint={accessibilityHint}
              checked={effectiveChecked}
              disabled={isToggleDisabled}
              onCheckedChange={onCheckedChange}
              testID={toggleTestID}
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
            accessibilityHint={accessibilityHint}
            checked={effectiveChecked}
            disabled={isToggleDisabled}
            onCheckedChange={onCheckedChange}
            testID={toggleTestID}
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
          accessibilityHint={helperText}
          emphasis="outline"
          fullWidth={isCompactLayout}
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
