import { Children, type ReactNode } from 'react'
import { XStack, YStack } from 'tamagui'

type StatTileGridProps = {
  children: ReactNode
}

export function StatTileGrid({ children }: StatTileGridProps) {
  const tiles = Children.toArray(children)
  const firstRowTiles = tiles.slice(0, 2)
  const remainingTiles = tiles.slice(2)

  return (
    <YStack gap="$3">
      {firstRowTiles.length > 0 ? (
        <XStack gap="$3">{firstRowTiles}</XStack>
      ) : null}
      {remainingTiles.map((tile, index) => (
        <XStack key={`stat-tile-grid-row-${index}`}>{tile}</XStack>
      ))}
    </YStack>
  )
}
