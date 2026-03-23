import { Check } from '@tamagui/lucide-icons'
import { forwardRef, type ElementRef } from 'react'
import { Checkbox, type GetProps, useThemeName } from 'tamagui'

export type CheckboxControlProps = Omit<GetProps<typeof Checkbox>, 'children'>

export const CheckboxControl = forwardRef<
  ElementRef<typeof Checkbox>,
  CheckboxControlProps
>(function CheckboxControl({ disabled = false, size = '$1.5', ...rest }, ref) {
  const themeName = useThemeName()
  const isDarkTheme = themeName.startsWith('dark')
  const inactiveBorderColor = isDarkTheme ? '$color8' : '$color7'
  const activeBorderColor = isDarkTheme ? '$accent9' : '$accent10'
  const activeBackgroundColor = isDarkTheme ? '$accent10' : '$accent9'
  const indicatorColor = isDarkTheme ? '$accent1' : '$accent12'

  return (
    <Checkbox
      ref={ref}
      activeStyle={{
        background: activeBackgroundColor,
        borderColor: activeBorderColor,
      }}
      bg="$background"
      borderColor={inactiveBorderColor}
      borderWidth={1}
      disabled={disabled}
      focusStyle={{ borderColor: '$accent8' }}
      opacity={disabled ? 0.5 : 1}
      pressStyle={
        disabled
          ? undefined
          : {
              opacity: 0.9,
            }
      }
      rounded={10}
      size={size}
      {...rest}
    >
      <Checkbox.Indicator>
        <Check color={indicatorColor} size={12} strokeWidth={3} />
      </Checkbox.Indicator>
    </Checkbox>
  )
})
