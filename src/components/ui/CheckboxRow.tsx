import { useId } from 'react'
import { Label, Text, XStack, YStack } from 'tamagui'
import { CheckboxControl } from './CheckboxControl'

export type CheckboxRowProps = {
  checked: boolean
  description?: string
  label: string
  onCheckedChange?: (checked: boolean) => void
}

export function CheckboxRow({
  checked,
  description,
  label,
  onCheckedChange,
}: CheckboxRowProps) {
  const checkboxId = useId()

  const handleChange = (value: boolean | 'indeterminate') => {
    onCheckedChange?.(value === true)
  }

  return (
    <XStack
      accessibilityLabel={label}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      gap="$3"
      items="flex-start"
      onPress={() => onCheckedChange?.(!checked)}
      pressStyle={{ opacity: 0.85 }}
    >
      <CheckboxControl
        checked={checked}
        id={checkboxId}
        onCheckedChange={handleChange}
        mt="$1"
      />

      <YStack flex={1} gap="$1">
        <Label htmlFor={checkboxId} fontSize={14} lineHeight={20}>
          {label}
        </Label>
        {description ? (
          <Text color="$color11" fontSize={13}>
            {description}
          </Text>
        ) : null}
      </YStack>
    </XStack>
  )
}
