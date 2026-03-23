import type { ReactNode } from 'react'
import { Theme } from 'tamagui'
import type { Tone } from './types'

const TONE_THEME = {
  neutral: undefined,
  accent: 'accent',
  success: 'success',
  warning: 'warning',
  error: 'error',
} as const

export function getToneThemeName(tone: Tone = 'neutral') {
  return TONE_THEME[tone]
}

export function ToneScope({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: Tone
}) {
  const themeName = getToneThemeName(tone)

  if (!themeName) {
    return <>{children}</>
  }

  return <Theme name={themeName}>{children}</Theme>
}
