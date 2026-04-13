import { ScrollView, Text, ToggleGroup } from 'tamagui'
import type { SegmentOption } from './types'

export type SegmentedTabsProps<TValue extends string = string> = {
  onValueChange?: (value: TValue) => void
  options: SegmentOption<TValue>[]
  scrollable?: boolean
  value: TValue
}

export function SegmentedTabs<TValue extends string>({
  onValueChange,
  options,
  scrollable = true,
  value,
}: SegmentedTabsProps<TValue>) {
  const tabs = (
    <ToggleGroup
      accessibilityRole="tablist"
      disableDeactivation
      flexDirection="row"
      flexWrap="nowrap"
      gap="$2"
      onValueChange={(nextValue) => {
        if (nextValue) {
          onValueChange?.(nextValue as TValue)
        }
      }}
      orientation="horizontal"
      type="single"
      value={value}
      width={scrollable ? undefined : '100%'}
    >
      {options.map((option) => {
        const active = option.value === value
        const textColor = active ? '$accent11' : '$color11'

        return (
          <ToggleGroup.Item
            accessibilityLabel={option.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            bg={active ? '$accent3' : '$background'}
            borderColor={active ? '$accent7' : '$color8'}
            borderWidth={1}
            display="flex"
            height={44}
            items="center"
            justify="center"
            key={option.value}
            px="$4"
            rounded={999}
            style={{
              flexGrow: scrollable ? 0 : 1,
              flexShrink: 0,
            }}
            unstyled
            value={option.value}
          >
            <Text
              color={textColor}
              fontSize={15}
              fontWeight="700"
              numberOfLines={1}
              style={{ textAlign: 'center' }}
            >
              {option.label}
            </Text>
          </ToggleGroup.Item>
        )
      })}
    </ToggleGroup>
  )

  if (!scrollable) {
    return tabs
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0, marginHorizontal: -16 }}
      contentContainerStyle={{ px: 16 }}
    >
      {tabs}
    </ScrollView>
  )
}
