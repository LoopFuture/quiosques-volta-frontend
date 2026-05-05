import { useEffect, useState } from 'react'
import { useWindowDimensions } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'
import { FormField, PrimaryButton, SurfaceCard } from '@/components/ui'
import { APP_PIN_LENGTH, verifyStoredAppPin } from '@/features/auth/pin'

type PinPreferenceCardCopy = {
  cancelLabel: string
  changeLabel: string
  confirmPinLabel: string
  currentPinInvalidError: string
  currentPinLabel: string
  currentPinMismatchError: string
  enabledHelper: string
  invalidPinError: string
  label: string
  mismatchError: string
  pinHelper: string
  pinLabel: string
  removeLabel: string
  saveLabel: string
  setLabel: string
}

export function PinPreferenceCard({
  copy,
  enabled,
  onRemovePin,
  onSavePin,
  testIDPrefix,
}: {
  copy: PinPreferenceCardCopy
  enabled: boolean
  onRemovePin: () => Promise<void> | void
  onSavePin: (pin: string) => Promise<void>
  testIDPrefix?: string
}) {
  const { fontScale, width } = useWindowDimensions()
  const isCompactLayout = width < 360 || fontScale > 1.15
  const [confirmPin, setConfirmPin] = useState('')
  const [errorText, setErrorText] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [pin, setPin] = useState('')
  const [currentPin, setCurrentPin] = useState('')
  const currentPinInvalidText =
    errorText === copy.currentPinInvalidError ? errorText : undefined
  const currentPinMismatchText =
    errorText === copy.currentPinMismatchError ? errorText : undefined
  const pinErrorText =
    errorText === copy.invalidPinError ? errorText : undefined
  const confirmPinErrorText =
    errorText === copy.mismatchError ? errorText : undefined

  useEffect(() => {
    if (!enabled) {
      setIsEditing(false)
      setCurrentPin('')
      setPin('')
      setConfirmPin('')
      setErrorText(null)
    }
  }, [enabled])

  function resetEditor() {
    setCurrentPin('')
    setConfirmPin('')
    setErrorText(null)
    setIsEditing(false)
    setPin('')
  }

  async function handleSave() {
    if (enabled) {
      if (!/^\d{4}$/.test(currentPin)) {
        setErrorText(copy.currentPinInvalidError)
        return
      }

      if (!(await verifyStoredAppPin(currentPin))) {
        setErrorText(copy.currentPinMismatchError)
        return
      }
    }

    if (!/^\d{4}$/.test(pin)) {
      setErrorText(copy.invalidPinError)
      return
    }

    if (pin !== confirmPin) {
      setErrorText(copy.mismatchError)
      return
    }

    setIsSaving(true)
    setErrorText(null)

    try {
      await onSavePin(pin)
      resetEditor()
    } catch {
      setErrorText(null)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleRemove() {
    await onRemovePin()
    resetEditor()
  }

  return (
    <SurfaceCard>
      <YStack gap="$3">
        <YStack gap="$1">
          <Text fontSize={15} fontWeight="700">
            {copy.label}
          </Text>
          <Text color="$color11" fontSize={14}>
            {enabled && !isEditing ? copy.enabledHelper : copy.pinHelper}
          </Text>
        </YStack>

        {isEditing ? (
          <YStack gap="$3">
            {enabled ? (
              <FormField
                errorText={currentPinInvalidText ?? currentPinMismatchText}
                keyboardType="number-pad"
                label={copy.currentPinLabel}
                maxLength={APP_PIN_LENGTH}
                onChangeText={(value) => {
                  setCurrentPin(
                    value.replace(/\D/g, '').slice(0, APP_PIN_LENGTH),
                  )
                  if (errorText) {
                    setErrorText(null)
                  }
                }}
                secureTextEntry
                testID={
                  testIDPrefix ? `${testIDPrefix}-current-pin-input` : undefined
                }
                textContentType="oneTimeCode"
                value={currentPin}
              />
            ) : null}
            <FormField
              errorText={pinErrorText}
              keyboardType="number-pad"
              label={copy.pinLabel}
              maxLength={APP_PIN_LENGTH}
              onChangeText={(value) => {
                setPin(value.replace(/\D/g, '').slice(0, APP_PIN_LENGTH))
                if (errorText) {
                  setErrorText(null)
                }
              }}
              secureTextEntry
              testID={testIDPrefix ? `${testIDPrefix}-pin-input` : undefined}
              textContentType="oneTimeCode"
              value={pin}
            />
            <FormField
              errorText={confirmPinErrorText}
              keyboardType="number-pad"
              label={copy.confirmPinLabel}
              maxLength={APP_PIN_LENGTH}
              onChangeText={(value) => {
                setConfirmPin(value.replace(/\D/g, '').slice(0, APP_PIN_LENGTH))
                if (errorText) {
                  setErrorText(null)
                }
              }}
              secureTextEntry
              testID={
                testIDPrefix ? `${testIDPrefix}-confirm-pin-input` : undefined
              }
              textContentType="oneTimeCode"
              value={confirmPin}
            />
            <XStack gap="$3" flexDirection={isCompactLayout ? 'column' : 'row'}>
              <PrimaryButton
                flex={1}
                fullWidth={false}
                isPending={isSaving}
                onPress={() => {
                  void handleSave()
                }}
                testID={
                  testIDPrefix ? `${testIDPrefix}-save-button` : undefined
                }
              >
                {copy.saveLabel}
              </PrimaryButton>
              <PrimaryButton
                emphasis="outline"
                flex={1}
                fullWidth={false}
                onPress={resetEditor}
                testID={
                  testIDPrefix ? `${testIDPrefix}-cancel-button` : undefined
                }
                tone="neutral"
              >
                {copy.cancelLabel}
              </PrimaryButton>
            </XStack>
          </YStack>
        ) : (
          <XStack gap="$3" flexDirection={isCompactLayout ? 'column' : 'row'}>
            <PrimaryButton
              emphasis="outline"
              flex={1}
              fullWidth={false}
              onPress={() => {
                setIsEditing(true)
                setErrorText(null)
              }}
              testID={
                testIDPrefix
                  ? `${testIDPrefix}-${enabled ? 'change' : 'set'}-button`
                  : undefined
              }
              tone="neutral"
            >
              {enabled ? copy.changeLabel : copy.setLabel}
            </PrimaryButton>
            {enabled ? (
              <PrimaryButton
                emphasis="outline"
                flex={1}
                fullWidth={false}
                onPress={() => {
                  void handleRemove()
                }}
                testID={
                  testIDPrefix ? `${testIDPrefix}-remove-button` : undefined
                }
                tone="neutral"
              >
                {copy.removeLabel}
              </PrimaryButton>
            ) : null}
          </XStack>
        )}
      </YStack>
    </SurfaceCard>
  )
}
