import { zodResolver } from '@hookform/resolvers/zod'
import type { FieldValues, Resolver } from 'react-hook-form'
import type * as z from 'zod/v4/core'

export function createZodResolver<TFieldValues extends FieldValues>(
  schema: z.$ZodType<TFieldValues, TFieldValues>,
): Resolver<TFieldValues> {
  return zodResolver(
    schema as unknown as Parameters<typeof zodResolver>[0],
  ) as Resolver<TFieldValues>
}
