import { createV5Theme, defaultChildrenThemes } from '@tamagui/config/v5'
import { v5ComponentThemes } from '@tamagui/themes/v5'
import {
  yellow,
  yellowDark,
  red,
  redDark,
  green,
  greenDark,
} from '@tamagui/colors'

const brandPrimary = '#0cc3d7'
const brandNeutral = '#e0e0e0'
const brandWhite = '#ffffff'
const brandBlack = '#000000'

// Palette values sourced from Volta_Brandbook_23FEV.pdf.
const darkPalette = [
  '#050505',
  '#0b0b0b',
  '#101010',
  '#171717',
  '#202020',
  '#2b2b2b',
  '#3a3a3a',
  '#525252',
  '#747474',
  '#949494',
  brandNeutral,
  brandWhite,
]
const lightPalette = [
  brandWhite,
  '#fcfcfc',
  '#f8f8f8',
  '#f3f3f3',
  '#ebebeb',
  brandNeutral,
  '#cccccc',
  '#afafaf',
  '#909090',
  '#737373',
  '#1f1f1f',
  brandBlack,
]

const accentLight = {
  accent1: '#effcff',
  accent2: '#daf9fd',
  accent3: '#c0f2f8',
  accent4: '#a4ebf3',
  accent5: '#85e3ee',
  accent6: '#60d9e7',
  accent7: '#39cfe0',
  accent8: '#1ac7da',
  accent9: brandPrimary,
  accent10: '#09a7b8',
  accent11: '#056b75',
  accent12: '#02353c',
}

const accentDark = {
  accent1: '#02262b',
  accent2: '#033037',
  accent3: '#043b43',
  accent4: '#054850',
  accent5: '#06565e',
  accent6: '#07656d',
  accent7: '#097780',
  accent8: '#0a8b95',
  accent9: brandPrimary,
  accent10: '#34d4e4',
  accent11: '#7fe5ef',
  accent12: '#d9fbff',
}

const builtThemes = createV5Theme({
  darkPalette,
  lightPalette,
  componentThemes: v5ComponentThemes,
  accent: {
    light: accentLight,
    dark: accentDark,
  },
  childrenThemes: {
    ...defaultChildrenThemes,
    warning: {
      light: yellow,
      dark: yellowDark,
    },
    error: {
      light: red,
      dark: redDark,
    },
    success: {
      light: green,
      dark: greenDark,
    },
  },
})

export type Themes = typeof builtThemes

// the process.env conditional here is optional but saves web client-side bundle
// size by leaving out themes JS. tamagui automatically hydrates themes from CSS
// back into JS for you, and the bundler plugins set TAMAGUI_ENVIRONMENT. so
// long as you are using the Vite, Next, Webpack plugins this should just work,
// but if not you can just export builtThemes directly as themes:
export const themes: Themes =
  process.env.TAMAGUI_ENVIRONMENT === 'client' &&
  process.env.NODE_ENV === 'production'
    ? ({} as any)
    : (builtThemes as any)
