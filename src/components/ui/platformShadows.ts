import { Platform } from 'react-native'

type ShadowRole = 'surface' | 'button' | 'iconButton' | 'fab'

type ShadowProps = {
  elevation?: number
  shadowColor?: '$accent8'
  shadowOffset?: {
    width: number
    height: number
  }
  shadowOpacity?: number
  shadowRadius?: number
}

const iosShadowPresets: Record<
  'light' | 'dark',
  Record<ShadowRole, ShadowProps>
> = {
  light: {
    surface: {
      shadowColor: '$accent8',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.14,
      shadowRadius: 28,
    },
    button: {
      shadowColor: '$accent8',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 18,
    },
    iconButton: {
      shadowColor: '$accent8',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 18,
    },
    fab: {
      shadowColor: '$accent8',
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.34,
      shadowRadius: 22,
    },
  },
  dark: {
    surface: {
      shadowColor: '$accent8',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 20,
    },
    button: {
      shadowColor: '$accent8',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 16,
    },
    iconButton: {
      shadowColor: '$accent8',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.14,
      shadowRadius: 16,
    },
    fab: {
      shadowColor: '$accent8',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.28,
      shadowRadius: 18,
    },
  },
}

const androidShadowPresets: Record<
  'light' | 'dark',
  Record<ShadowRole, ShadowProps>
> = {
  light: {
    surface: { elevation: 2 },
    button: { elevation: 2 },
    iconButton: { elevation: 1 },
    fab: { elevation: 5 },
  },
  dark: {
    surface: { elevation: 1 },
    button: { elevation: 1 },
    iconButton: { elevation: 1 },
    fab: { elevation: 4 },
  },
}

export function getPlatformShadowProps(
  role: ShadowRole,
  isDarkTheme: boolean,
): ShadowProps {
  const themeKey = isDarkTheme ? 'dark' : 'light'

  return Platform.OS === 'android'
    ? androidShadowPresets[themeKey][role]
    : iosShadowPresets[themeKey][role]
}
