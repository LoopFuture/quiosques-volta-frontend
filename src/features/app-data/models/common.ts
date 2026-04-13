import { z } from 'zod/v4'

export const moneySchema = z.object({
  amountMinor: z.number().int(),
  currency: z.literal('EUR'),
})

export const pageInfoSchema = z.object({
  hasNextPage: z.boolean(),
  nextCursor: z.string().nullable().optional(),
})

export const errorSchema = z.object({
  code: z.string(),
  message: z.string(),
  requestId: z.string().optional(),
})

export const errorResponseSchema = z.object({
  error: errorSchema,
})

export const validationIssueSchema = z.object({
  code: z.string(),
  field: z.string(),
  message: z.string(),
})

export const validationErrorResponseSchema = z.object({
  error: errorSchema,
  issues: z.array(validationIssueSchema),
})

export const toneSchema = z.enum([
  'neutral',
  'accent',
  'success',
  'warning',
  'error',
])

export const segmentOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
})

export const detailItemSchema = z.object({
  helper: z.string().optional(),
  label: z.string(),
  tone: toneSchema.optional(),
  value: z.string(),
})

export const timelineItemStateSchema = z.enum(['done', 'current', 'upcoming'])

export const timelineItemSchema = z.object({
  accessibilityStateLabel: z.string().optional(),
  description: z.string().optional(),
  id: z.string(),
  label: z.string(),
  state: timelineItemStateSchema,
})

export type Money = z.infer<typeof moneySchema>
export type PageInfo = z.infer<typeof pageInfoSchema>
