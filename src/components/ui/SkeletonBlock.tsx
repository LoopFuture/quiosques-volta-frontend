import type { YStackProps } from 'tamagui'
import { YStack } from 'tamagui'

export function SkeletonBlock({
  bg = '$accent3',
  opacity = 0.28,
  rounded = 16,
  ...rest
}: YStackProps) {
  return <YStack bg={bg} opacity={opacity} rounded={rounded} {...rest} />
}
