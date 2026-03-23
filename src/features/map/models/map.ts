import { z } from 'zod/v4'

export const collectionPointSchema = z.object({
  acceptedMaterials: z
    .array(z.enum(['plastic', 'glass', 'aluminum']))
    .optional(),
  address: z.string().nullable().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  id: z.string(),
  name: z.string(),
  status: z.enum(['active', 'temporarily_unavailable', 'offline']),
})

export const collectionPointListResponseSchema = z.object({
  items: z.array(collectionPointSchema),
})

export type CollectionPoint = z.infer<typeof collectionPointSchema>
export type CollectionPointListResponse = z.infer<
  typeof collectionPointListResponseSchema
>
