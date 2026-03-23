import { z } from 'zod/v4'

const defaultBarcodeTtlMs = 45_000

const rawBarcodeResponseSchema = z.object({
  expiresAt: z.string().optional(),
  expirationDateTime: z.string().optional(),
  reference: z.string(),
})

export const barcodeResponseSchema = rawBarcodeResponseSchema.transform(
  (value, context) => {
    const expiresAt = value.expiresAt ?? value.expirationDateTime

    if (!expiresAt) {
      context.addIssue({
        code: 'custom',
        message: 'Barcode expiry is required.',
        path: ['expiresAt'],
      })

      return z.NEVER
    }

    return {
      expiresAt,
      reference: value.reference,
    }
  },
)

export type BarcodeResponse = z.infer<typeof barcodeResponseSchema>
export type RawBarcodeResponse = z.input<typeof barcodeResponseSchema>

export function getBarcodeScreenState(
  overrides: Partial<BarcodeResponse> = {},
): BarcodeResponse {
  return barcodeResponseSchema.parse({
    expiresAt: new Date(Date.now() + defaultBarcodeTtlMs).toISOString(),
    reference: 'VF-0001-RTM-2026',
    ...overrides,
  })
}
