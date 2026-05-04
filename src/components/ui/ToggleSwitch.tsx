import { forwardRef, type ElementRef } from 'react'
import { Switch, type GetProps, useThemeName } from 'tamagui'

export type ToggleSwitchProps = Omit<GetProps<typeof Switch>, 'children'>

export const ToggleSwitch = forwardRef<
  ElementRef<typeof Switch>,
  ToggleSwitchProps
>(function ToggleSwitch(
  { checked = false, disabled = false, size = '$3.5', testID, ...rest },
  ref,
) {
  const themeName = useThemeName()
  const isDarkTheme = themeName.startsWith('dark')
  const stateTestID = testID
    ? `${testID}-${checked ? 'checked' : 'unchecked'}`
    : undefined
  const inactiveTrackColor = disabled
    ? isDarkTheme
      ? '$color4'
      : '$color3'
    : isDarkTheme
      ? '$color5'
      : '$color4'
  const inactiveTrackBorderColor = disabled
    ? '$color6'
    : isDarkTheme
      ? '$color8'
      : '$color8'
  const activeTrackColor = disabled
    ? isDarkTheme
      ? '$accent7'
      : '$accent6'
    : isDarkTheme
      ? '$accent10'
      : '$accent9'
  const activeTrackBorderColor = disabled
    ? isDarkTheme
      ? '$accent8'
      : '$accent7'
    : isDarkTheme
      ? '$accent9'
      : '$accent10'
  const thumbColor = disabled
    ? isDarkTheme
      ? '$color8'
      : '$color9'
    : isDarkTheme
      ? '$color1'
      : '$background'

  return (
    <Switch
      ref={ref}
      activeStyle={{
        backgroundColor: activeTrackColor,
        borderColor: activeTrackBorderColor,
      }}
      bg={inactiveTrackColor}
      borderColor={inactiveTrackBorderColor}
      borderWidth={1.5}
      checked={checked}
      disabled={disabled}
      focusStyle={{
        borderColor: '$accent9',
        outlineColor: '$accent7',
        outlineWidth: 2,
      }}
      opacity={1}
      pressStyle={
        disabled
          ? undefined
          : {
              opacity: 0.96,
            }
      }
      size={size}
      testID={testID}
      {...rest}
    >
      <Switch.Thumb bg={thumbColor} size="$3" testID={stateTestID} />
    </Switch>
  )
})
