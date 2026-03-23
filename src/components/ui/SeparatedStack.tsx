import type { ReactNode } from 'react'
import { Children } from 'react'
import type { YStackProps } from 'tamagui'
import { YStack } from 'tamagui'
import {
  SurfaceSeparator,
  type SurfaceSeparatorProps,
} from './SurfaceSeparator'

export type SeparatedStackProps = YStackProps & {
  children: ReactNode
  separatorProps?: SurfaceSeparatorProps
  separatorSpacing?: YStackProps['py']
}

export function SeparatedStack({
  children,
  separatorProps,
  separatorSpacing,
  ...stackProps
}: SeparatedStackProps) {
  const items = Children.toArray(children).filter(Boolean)

  return (
    <YStack {...stackProps}>
      {items.map((child, index) => (
        <YStack key={index}>
          {index > 0 ? (
            <YStack py={separatorSpacing}>
              <SurfaceSeparator {...separatorProps} />
            </YStack>
          ) : null}
          {child}
        </YStack>
      ))}
    </YStack>
  )
}
