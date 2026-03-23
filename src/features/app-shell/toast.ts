import type { Tone } from '@/components/ui/types'

export type AppToastVariant = 'success' | 'error' | 'hint' | 'mock'

export const APP_TOAST_DEFAULT_DURATION_MS: Record<AppToastVariant, number> = {
  error: 5000,
  hint: 2500,
  mock: 4500,
  success: 3500,
}

export const APP_TOAST_TONE: Record<AppToastVariant, Tone> = {
  error: 'error',
  hint: 'neutral',
  mock: 'warning',
  success: 'accent',
}

export function getAppToastDuration(
  variant: AppToastVariant,
  duration?: number,
) {
  return duration ?? APP_TOAST_DEFAULT_DURATION_MS[variant]
}

export function getAppToastTone(variant: AppToastVariant) {
  return APP_TOAST_TONE[variant]
}

export function getAppToastVariant(
  variant: AppToastVariant | null | undefined,
): AppToastVariant {
  return variant ?? 'success'
}

declare module '@tamagui/toast' {
  interface CustomData {
    variant?: AppToastVariant
  }
}
