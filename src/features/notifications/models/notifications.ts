import { z } from 'zod/v4'

export const notificationTypeSchema = z.enum(['wallet', 'transfer', 'system'])

export const notificationSchema = z.object({
  body: z.string(),
  createdAt: z.string(),
  id: z.string(),
  read: z.boolean(),
  relatedResourceId: z.string().nullable().optional(),
  title: z.string(),
  type: notificationTypeSchema,
})

export const notificationListResponseSchema = z.object({
  items: z.array(notificationSchema),
  pageInfo: z.object({
    hasNextPage: z.boolean(),
    nextCursor: z.string().nullable().optional(),
  }),
  unreadCount: z.number().int().nonnegative(),
})

export const markNotificationsReadRequestSchema = z.union([
  z.object({
    ids: z.array(z.string()).min(1),
  }),
  z.object({
    markAll: z.literal(true),
  }),
])

export const markNotificationsReadResponseSchema = z.object({
  unreadCount: z.number().int().nonnegative(),
})

export const clearNotificationsResponseSchema = z.object({
  clearedCount: z.number().int().nonnegative(),
  unreadCount: z.number().int().nonnegative(),
})

export type Notification = z.infer<typeof notificationSchema>
export type NotificationListResponse = z.infer<
  typeof notificationListResponseSchema
>
export type MarkNotificationsReadRequest = z.infer<
  typeof markNotificationsReadRequestSchema
>
export type MarkNotificationsReadResponse = z.infer<
  typeof markNotificationsReadResponseSchema
>
export type ClearNotificationsResponse = z.infer<
  typeof clearNotificationsResponseSchema
>
