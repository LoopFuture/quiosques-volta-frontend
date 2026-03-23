import { Text, XStack, YStack } from 'tamagui'
import { SurfaceCard } from './SurfaceCard'
import { ToneScope } from './tone'
import type { TimelineItem, Tone } from './types'

export type StatusTimelineProps = {
  items: TimelineItem[]
}

const timelineTones: Record<TimelineItem['state'], Tone> = {
  current: 'accent',
  done: 'success',
  upcoming: 'neutral',
}

export function StatusTimeline({ items }: StatusTimelineProps) {
  return (
    <SurfaceCard gap="$2">
      {items.map((item, index) => {
        const tone = timelineTones[item.state]
        const marker =
          item.state === 'done' ? '✓' : item.state === 'current' ? '•' : ''
        const isActiveState = item.state === 'done' || item.state === 'current'

        return (
          <XStack key={item.id} gap="$3" items="stretch">
            <YStack items="center">
              <ToneScope tone={tone}>
                <YStack
                  bg={isActiveState ? '$accent9' : '$background'}
                  borderColor={isActiveState ? '$accent9' : '$borderColor'}
                  borderWidth={1}
                  height={24}
                  items="center"
                  justify="center"
                  rounded={12}
                  width={24}
                >
                  <Text
                    color={isActiveState ? '$accent1' : '$color'}
                    fontSize={12}
                    fontWeight="800"
                  >
                    {marker}
                  </Text>
                </YStack>
              </ToneScope>

              {index < items.length - 1 ? (
                <YStack
                  bg={item.state === 'upcoming' ? '$borderColor' : '$accent8'}
                  flex={1}
                  mt="$1"
                  rounded={999}
                  width={2}
                />
              ) : null}
            </YStack>

            <ToneScope tone={tone}>
              <YStack
                flex={1}
                gap="$1"
                pb="$3"
                px="$2.5"
                py="$2"
                rounded="$5"
                bg={item.state === 'current' ? '$accent2' : '$background'}
                borderWidth={item.state === 'current' ? 1 : 0}
                borderColor={
                  item.state === 'current' ? '$accent7' : 'transparent'
                }
              >
                <Text color="$color" fontSize={16} fontWeight="800">
                  {item.label}
                </Text>
                {item.description ? (
                  <Text color="$color11" fontSize={13}>
                    {item.description}
                  </Text>
                ) : null}
              </YStack>
            </ToneScope>
          </XStack>
        )
      })}
    </SurfaceCard>
  )
}
