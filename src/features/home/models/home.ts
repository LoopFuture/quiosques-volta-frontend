import { z } from 'zod/v4'
import { moneySchema } from '@/features/app-data/models'
import {
  activityPreviewSchema,
  transferEligibilitySchema,
} from '@/features/wallet/models'

export const userStatsSchema = z.object({
  completedTransfersCount: z.number().int().nonnegative(),
  creditsEarned: moneySchema,
  processingTransfersCount: z.number().int().nonnegative(),
  returnedPackagesCount: z.number().int().nonnegative(),
})

export const homeGreetingSchema = z.object({
  displayName: z.string(),
  memberSince: z.string(),
})

export const homeResponseSchema = z.object({
  greeting: homeGreetingSchema,
  recentActivity: z.array(activityPreviewSchema),
  stats: userStatsSchema,
  transferEligibility: transferEligibilitySchema,
  unreadNotificationsCount: z.number().int().nonnegative(),
  walletBalance: moneySchema,
})

export type UserStats = z.infer<typeof userStatsSchema>
export type HomeResponse = z.infer<typeof homeResponseSchema>
