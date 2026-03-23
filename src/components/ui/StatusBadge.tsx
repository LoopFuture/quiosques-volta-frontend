import type { ReactNode } from 'react'
import { Text, XStack } from 'tamagui'
import { ToneScope } from './tone'
import type { Tone } from './types'

export type StatusBadgeProps = {
  children: ReactNode
  tone?: Tone
}

export function StatusBadge({ children, tone = 'neutral' }: StatusBadgeProps) {
  return (
    <ToneScope tone={tone}>
      <XStack
        bg="$background"
        borderColor="$borderColor"
        borderWidth={1}
        px="$2.5"
        py="$1.5"
        rounded={999}
        style={{ alignSelf: 'flex-start' }}
      >
        <Text color="$color" fontSize={13} fontWeight="800">
          {children}
        </Text>
      </XStack>
    </ToneScope>
  )
}
