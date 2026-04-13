import { z } from 'zod/v4'

const rawBarcodeResponseSchema = z.object({
  code: z.string(),
  expiresAt: z.string(),
})

export const barcodeResponseSchema = rawBarcodeResponseSchema

export type BarcodeResponse = z.infer<typeof barcodeResponseSchema>
export type RawBarcodeResponse = z.input<typeof barcodeResponseSchema>
