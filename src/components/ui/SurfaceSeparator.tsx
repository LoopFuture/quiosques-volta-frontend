import type { GetProps } from 'tamagui'
import { Separator, useThemeName } from 'tamagui'
import type { Tone } from './types'

export type SurfaceSeparatorProps = Omit<
  GetProps<typeof Separator>,
  'borderColor'
> & {
  tone?: Tone
}

export function SurfaceSeparator({
  tone = 'neutral',
  ...rest
}: SurfaceSeparatorProps) {
  const themeName = useThemeName()
  const isDarkTheme = themeName.startsWith('dark')
  const borderColor =
    tone === 'neutral' ? (isDarkTheme ? '$color7' : '$color6') : '$borderColor'

  return <Separator borderColor={borderColor} {...rest} />
}
