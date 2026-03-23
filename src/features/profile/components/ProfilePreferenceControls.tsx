import { Text, XStack, YStack } from 'tamagui'
import {
  SegmentedTabs,
  SurfaceCard,
  ToggleSwitch,
  type SegmentOption,
} from '@/components/ui'

export function SettingsToggleRow({
  checked,
  disabled = false,
  helperText,
  label,
  onCheckedChange,
}: {
  checked: boolean
  disabled?: boolean
  helperText: string
  label: string
  onCheckedChange: (value: boolean) => void
}) {
  return (
    <XStack gap="$3" items="flex-start" justify="space-between">
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
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </XStack>
  )
}

export function SettingsSectionHeader({
  eyebrow,
  helperText,
  title,
}: {
  eyebrow?: string
  helperText?: string
  title: string
}) {
  return (
    <YStack gap="$1.5">
      {eyebrow ? (
        <Text
          color="$color10"
          fontSize={12}
          fontWeight="800"
          textTransform="uppercase"
        >
          {eyebrow}
        </Text>
      ) : null}
      <Text fontSize={18} fontWeight="800">
        {title}
      </Text>
      {helperText ? (
        <Text color="$color11" fontSize={14}>
          {helperText}
        </Text>
      ) : null}
    </YStack>
  )
}

export function PreferenceCard<TValue extends string>({
  description,
  label,
  onValueChange,
  options,
  supportingLabel,
  supportingValue,
  value,
}: {
  description: string
  label: string
  onValueChange: (value: TValue) => void
  options: SegmentOption<TValue>[]
  supportingLabel?: string
  supportingValue?: string
  value: TValue
}) {
  return (
    <SurfaceCard>
      <YStack gap="$3">
        <YStack gap="$1.5">
          <Text
            color="$color10"
            fontSize={13}
            fontWeight="700"
            textTransform="uppercase"
          >
            {label}
          </Text>
          <Text color="$color11" fontSize={14}>
            {description}
          </Text>
          {supportingValue ? (
            <YStack gap="$0.5">
              {supportingLabel ? (
                <Text color="$color10" fontSize={12} fontWeight="800">
                  {supportingLabel}
                </Text>
              ) : null}
              <Text color="$color10" fontSize={13} fontWeight="600">
                {supportingValue}
              </Text>
            </YStack>
          ) : null}
        </YStack>

        <SegmentedTabs
          onValueChange={onValueChange}
          options={options}
          value={value}
        />
      </YStack>
    </SurfaceCard>
  )
}
