import { z } from 'zod/v4'

export const pushProviderSchema = z.enum(['expo'])
export const pushPlatformSchema = z.enum(['ios', 'android'])

export const upsertPushInstallationRequestSchema = z.object({
  appVersion: z.string().nullable().optional(),
  buildNumber: z.string().nullable().optional(),
  deviceModel: z.string().nullable().optional(),
  platform: pushPlatformSchema,
  provider: pushProviderSchema,
  token: z.string().min(1),
})

export const pushInstallationResponseSchema = z.object({
  appVersion: z.string().nullable().optional(),
  buildNumber: z.string().nullable().optional(),
  deviceModel: z.string().nullable().optional(),
  installationId: z.string(),
  platform: pushPlatformSchema,
  provider: pushProviderSchema,
  registeredAt: z.string(),
  status: z.literal('active'),
  updatedAt: z.string(),
})

export type UpsertPushInstallationRequest = z.infer<
  typeof upsertPushInstallationRequestSchema
>
export type PushInstallationResponse = z.infer<
  typeof pushInstallationResponseSchema
>
