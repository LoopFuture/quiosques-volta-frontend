import { useThemeName } from 'tamagui'

export function useNeutralBorderColor() {
  const themeName = useThemeName()

  return themeName.startsWith('dark') ? '$color8' : '$color7'
}
