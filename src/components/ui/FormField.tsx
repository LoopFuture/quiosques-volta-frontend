import {
  forwardRef,
  type ComponentProps,
  type ElementRef,
  type ReactNode,
  useId,
  useState,
} from 'react'
import { Platform } from 'react-native'
import { Input, Label, Text, XStack, YStack, useThemeName } from 'tamagui'
import { ToneScope } from './tone'
import { useNeutralBorderColor } from './useNeutralBorderColor'

export type FormFieldProps = Omit<ComponentProps<typeof Input>, 'children'> & {
  label: string
  helperText?: string
  errorText?: string
  leading?: ReactNode
  trailing?: ReactNode
}

export const FormField = forwardRef<ElementRef<typeof Input>, FormFieldProps>(
  function FormField(
    {
      accessibilityLabel,
      disabled = false,
      errorText,
      helperText,
      label,
      leading,
      onBlur,
      onFocus,
      required = false,
      style,
      trailing,
      ...rest
    },
    ref,
  ) {
    const inputId = useId()
    const supportingText = errorText ?? helperText
    const [isFocused, setIsFocused] = useState(false)
    const themeName = useThemeName()
    const isDarkTheme = themeName.startsWith('dark')
    const neutralBorderColor = useNeutralBorderColor()
    const fieldTone = errorText ? 'error' : 'neutral'
    const labelColor = disabled
      ? '$color10'
      : errorText
        ? '$color11'
        : '$color12'
    const borderColor = errorText
      ? '$color8'
      : isFocused
        ? '$accent8'
        : neutralBorderColor
    const backgroundColor = disabled
      ? isDarkTheme
        ? '$color2'
        : '$color1'
      : errorText
        ? '$color2'
        : isFocused
          ? '$accent2'
          : '$background'
    const supportingTextColor = disabled ? '$color10' : '$color11'

    return (
      <YStack gap="$2">
        <ToneScope tone={fieldTone}>
          <Label
            color={labelColor}
            htmlFor={inputId}
            fontSize={15}
            fontWeight="700"
          >
            {required ? `${label} *` : label}
          </Label>
        </ToneScope>

        <ToneScope tone={fieldTone}>
          <XStack
            bg={backgroundColor}
            borderColor={borderColor}
            borderWidth={isFocused || errorText ? 2 : 1}
            gap="$3"
            height={58}
            items="center"
            px="$4"
            rounded={29}
          >
            {leading ? <XStack items="center">{leading}</XStack> : null}
            <Input
              ref={ref}
              accessibilityLabel={accessibilityLabel ?? label}
              accessibilityHint={supportingText}
              accessibilityState={{
                disabled,
              }}
              color={disabled ? '$color10' : '$color'}
              disabled={disabled}
              flex={1}
              fontSize={17}
              height="100%"
              id={inputId}
              onBlur={(event) => {
                setIsFocused(false)
                onBlur?.(event)
              }}
              onFocus={(event) => {
                setIsFocused(true)
                onFocus?.(event)
              }}
              placeholderTextColor={disabled ? '$color9' : '$color10'}
              required={required}
              style={[
                {
                  paddingBottom: 0,
                  paddingTop: 0,
                },
                Platform.OS === 'android' ? { paddingVertical: 0 } : null,
                style,
              ]}
              textAlignVertical={
                Platform.OS === 'android' ? 'center' : undefined
              }
              unstyled
              {...rest}
            />
            {trailing ? <XStack items="center">{trailing}</XStack> : null}
          </XStack>
        </ToneScope>

        {errorText ? (
          <ToneScope tone={fieldTone}>
            <Text color="$color11" fontSize={15} fontWeight="700">
              {errorText}
            </Text>
          </ToneScope>
        ) : helperText ? (
          <Text color={supportingTextColor} fontSize={15}>
            {helperText}
          </Text>
        ) : null}
      </YStack>
    )
  },
)
