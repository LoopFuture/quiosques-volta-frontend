import { z } from 'zod/v4'
import { languageModeSchema, themeModeSchema } from '@/features/profile/models'
import type { LanguageMode } from '@/features/app-data/storage/preferences/language'
import type { ThemeMode } from '@/features/app-data/storage/preferences/theme'

export type ProfileAppSettingsFormValues = {
  languageMode: LanguageMode
  themeMode: ThemeMode
}

export const profileAppSettingsRequestSchema = z.object({
  languageMode: languageModeSchema,
  themeMode: themeModeSchema,
})

export type ProfileAppSettingsRequest = z.infer<
  typeof profileAppSettingsRequestSchema
>

export type ProfileAppSettingsValidationCopy = {
  invalidLanguageMode: string
  invalidThemeMode: string
}

export function getProfileAppSettingsFormSchema(
  validation: ProfileAppSettingsValidationCopy,
) {
  return z.object({
    languageMode: z.custom<LanguageMode>(
      (value) => languageModeSchema.safeParse(value).success,
      { error: validation.invalidLanguageMode },
    ),
    themeMode: z.custom<ThemeMode>(
      (value) => themeModeSchema.safeParse(value).success,
      { error: validation.invalidThemeMode },
    ),
  })
}

export function getProfileAppSettingsFormDefaultValues({
  languageMode,
  themeMode,
}: ProfileAppSettingsFormValues): ProfileAppSettingsFormValues {
  return {
    languageMode,
    themeMode,
  }
}

export function serializeProfileAppSettingsForm(
  values: ProfileAppSettingsFormValues,
): ProfileAppSettingsRequest {
  return profileAppSettingsRequestSchema.parse(values)
}
