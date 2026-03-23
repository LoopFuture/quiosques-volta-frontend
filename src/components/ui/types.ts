import type { ReactNode } from 'react'

export type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'error'

export type SegmentOption<TValue extends string = string> = {
  value: TValue
  label: string
}

export type DetailItem = {
  label: string
  value: ReactNode
  helper?: string
  tone?: Tone
}

export type TimelineItem = {
  id: string
  label: string
  description?: string
  state: 'done' | 'current' | 'upcoming'
}
