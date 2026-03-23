import type { ComponentProps } from 'react'
import { Button, Spinner, XStack, useTheme, useThemeName } from 'tamagui'
import { getPlatformShadowProps } from './platformShadows'
import { getToneThemeName } from './tone'
import type { Tone } from './types'

export type PrimaryButtonProps = ComponentProps<typeof Button> & {
  tone?: Tone
  emphasis?: 'solid' | 'outline'
  fullWidth?: boolean
  isPending?: boolean
  pendingLabel?: ComponentProps<typeof Button.Text>['children']
}

export function PrimaryButton({
  accessibilityState,
  children,
  disabled,
  fullWidth = true,
  isPending = false,
  pendingLabel,
  tone = 'accent',
  emphasis = 'solid',
  ...rest
}: PrimaryButtonProps) {
  const theme = useTheme()
  const themeName = useThemeName()
  const isDarkTheme = themeName.startsWith('dark')
  const isAccentSolid = tone === 'accent' && emphasis === 'solid'
  const isNeutralOutline = tone === 'neutral' && emphasis === 'outline'
  const isDisabled = disabled || isPending
  const solidBackgroundColor = isAccentSolid
    ? isDarkTheme
      ? '$accent10'
      : '$accent9'
    : undefined
  const outlineBackgroundColor = isNeutralOutline ? '$color2' : '$background'
  const disabledBackgroundColor =
    emphasis === 'solid' ? '$color4' : isDarkTheme ? '$color3' : '$color2'
  const backgroundColor = isDisabled
    ? disabledBackgroundColor
    : emphasis === 'solid'
      ? solidBackgroundColor
      : outlineBackgroundColor
  const shadowProps =
    emphasis === 'solid'
      ? getPlatformShadowProps('button', isDarkTheme)
      : undefined
  const textColor = isDisabled
    ? '$color10'
    : isAccentSolid
      ? isDarkTheme
        ? '$accent1'
        : '$accent12'
      : isNeutralOutline
        ? '$color'
        : undefined
  const spinnerColor = isDisabled
    ? theme.color10.val
    : isAccentSolid
      ? isDarkTheme
        ? theme.accent1.val
        : theme.accent12.val
      : theme.color.val
  const buttonLabel = isPending && pendingLabel ? pendingLabel : children
  const buttonChildren =
    typeof buttonLabel === 'string' || typeof buttonLabel === 'number' ? (
      <Button.Text
        color={textColor}
        numberOfLines={2}
        style={{ textAlign: 'center' }}
      >
        {buttonLabel}
      </Button.Text>
    ) : (
      buttonLabel
    )
  const content = isPending ? (
    <XStack gap="$2" items="center" justify="center">
      <Spinner color={spinnerColor} size="small" />
      {buttonChildren}
    </XStack>
  ) : (
    buttonChildren
  )

  return (
    <Button.Apply color={textColor}>
      <Button
        accessibilityState={{
          ...accessibilityState,
          busy: isPending,
          disabled: isDisabled,
        }}
        bg={backgroundColor}
        borderColor={
          isDisabled
            ? '$color6'
            : isNeutralOutline
              ? '$color8'
              : emphasis === 'outline'
                ? '$borderColor'
                : 'transparent'
        }
        borderWidth={emphasis === 'outline' || isDisabled ? 1 : 0}
        disabled={isDisabled}
        height={56}
        opacity={1}
        pressStyle={
          isDisabled
            ? undefined
            : {
                opacity: 0.94,
                scale: 0.985,
              }
        }
        rounded={28}
        size="$4"
        style={{
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          maxWidth: '100%',
        }}
        theme={getToneThemeName(tone)}
        {...shadowProps}
        {...rest}
      >
        {content}
      </Button>
    </Button.Apply>
  )
}
