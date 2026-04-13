import type { ReactNode } from 'react'
import type { GetProps } from 'tamagui'
import { Card, useThemeName, YStack } from 'tamagui'
import { getPlatformShadowProps } from './platformShadows'
import { ToneScope } from './tone'
import type { Tone } from './types'
import { useNeutralBorderColor } from './useNeutralBorderColor'

export type SurfaceCardProps = GetProps<typeof Card> & {
  children: ReactNode
  decorativeAccent?: boolean
  maxHeight?: number | string
  minHeight?: number | string
  tone?: Tone
}

export function SurfaceCard({
  bg = '$background',
  borderColor: customBorderColor,
  borderWidth = 1,
  children,
  decorativeAccent = false,
  flex,
  gap = '$3',
  height,
  items,
  justify,
  maxHeight,
  minHeight,
  p = '$4',
  pb,
  pl,
  pr,
  pt,
  px,
  py,
  rounded = 28,
  style,
  tone = 'neutral',
  width,
  ...rest
}: SurfaceCardProps) {
  const themeName = useThemeName()
  const isDarkTheme = themeName.startsWith('dark')
  const neutralBorderColor = useNeutralBorderColor()
  const borderColor =
    customBorderColor ??
    (tone === 'neutral' ? neutralBorderColor : '$borderColor')
  const shadowProps = getPlatformShadowProps('surface', isDarkTheme)

  const content = (
    <YStack
      flex={flex}
      height={height}
      overflow="visible"
      rounded={rounded}
      style={[
        maxHeight !== undefined || minHeight !== undefined
          ? { maxHeight, minHeight }
          : null,
        style,
      ]}
      width={width}
      {...shadowProps}
      {...rest}
    >
      <Card
        bg={bg}
        borderColor={borderColor}
        borderWidth={borderWidth}
        flex={flex}
        gap={gap}
        height={height}
        items={items}
        justify={justify}
        overflow="hidden"
        p={p}
        pb={pb}
        pl={pl}
        pr={pr}
        pt={pt}
        px={px}
        py={py}
        rounded={rounded}
        style={
          maxHeight !== undefined || minHeight !== undefined
            ? { maxHeight, minHeight }
            : undefined
        }
        width={width}
      >
        {tone !== 'neutral' && decorativeAccent ? (
          <Card.Background>
            <YStack
              pointerEvents="none"
              position="absolute"
              rounded={36}
              bg="$accent3"
              opacity={0.1}
              style={{ top: -18, right: -8, width: 72, height: 72 }}
            />
          </Card.Background>
        ) : null}
        {children}
      </Card>
    </YStack>
  )

  return <ToneScope tone={tone}>{content}</ToneScope>
}
