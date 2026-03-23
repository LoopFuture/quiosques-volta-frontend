import { Text } from 'tamagui'
import { SurfaceCard } from './SurfaceCard'
import { ToneScope } from './tone'
import type { Tone } from './types'

export type StatTileProps = {
  helper?: string
  tone?: Tone
  value: string
  label: string
}

export function StatTile({
  helper,
  tone = 'neutral',
  value,
  label,
}: StatTileProps) {
  return (
    <SurfaceCard flex={1} gap="$2" minW={96} p="$3.5" tone={tone}>
      <Text
        color="$color10"
        fontSize={12}
        fontWeight="700"
        textTransform="uppercase"
      >
        {label}
      </Text>
      <ToneScope tone={tone}>
        <Text color="$color" fontSize={30} fontWeight="900">
          {value}
        </Text>
      </ToneScope>
      {helper ? (
        <Text color="$color11" fontSize={12}>
          {helper}
        </Text>
      ) : null}
    </SurfaceCard>
  )
}
