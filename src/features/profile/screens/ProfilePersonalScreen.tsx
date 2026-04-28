import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { createZodResolver } from '@/features/app-data/forms'
import { YStack } from 'tamagui'
import {
  FormField,
  PrimaryButton,
  QueryErrorState,
  SeparatedStack,
  SkeletonBlock,
  SurfaceCard,
} from '@/components/ui'
import { useActionToast } from '@/features/app-shell/hooks/useActionToast'
import { ProfileDetailScreenFrame } from '../components/ProfileDetailScreenFrame'
import { SettingsSectionHeader } from '../components/ProfilePreferenceControls'
import {
  getProfilePersonalFormDefaultValues,
  getProfilePersonalFormSchema,
  toProfilePersonalDraft,
  type ProfilePersonalFormValues,
} from '../forms'
import { useProfileQuery, useUpdateProfilePersonalMutation } from '../hooks'
import { getProfileValidationCopy } from '../presentation'
import { type ProfilePersonal } from '../models'

function ProfilePersonalScreenSkeleton() {
  return (
    <SurfaceCard testID="profile-personal-screen-skeleton">
      <SeparatedStack>
        {Array.from({ length: 4 }).map((_, index) => (
          <YStack key={`profile-personal-skeleton-${index}`} gap="$3">
            <SkeletonBlock height={14} width="34%" />
            <SkeletonBlock height={54} width="100%" />
          </YStack>
        ))}
      </SeparatedStack>
    </SurfaceCard>
  )
}

function ProfilePersonalForm({ personal }: { personal: ProfilePersonal }) {
  const updatePersonalMutation = useUpdateProfilePersonalMutation()
  const { showError, showSuccess } = useActionToast()
  const { t } = useTranslation()
  const validationCopy = getProfileValidationCopy(t)
  const { control, handleSubmit, reset } = useForm<ProfilePersonalFormValues>({
    defaultValues: getProfilePersonalFormDefaultValues(personal),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    resolver: createZodResolver(
      getProfilePersonalFormSchema(validationCopy.personal),
    ),
  })

  useEffect(() => {
    reset(getProfilePersonalFormDefaultValues(personal))
  }, [personal, reset])

  return (
    <YStack gap="$4">
      <SettingsSectionHeader
        helperText={t('tabScreens.profile.personal.sectionHelper')}
        title={t('tabScreens.profile.personal.sectionTitle')}
      />

      <SurfaceCard>
        <SeparatedStack separatorSpacing="$3">
          <Controller
            control={control}
            name="name"
            render={({ field, fieldState }) => (
              <FormField
                errorText={fieldState.error?.message}
                label={t('tabScreens.profile.personal.nameLabel')}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                required
                testID="profile-personal-name-input"
                value={field.value}
              />
            )}
          />
          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <FormField
                autoCapitalize="none"
                disabled
                errorText={fieldState.error?.message}
                helperText={
                  fieldState.error
                    ? undefined
                    : t('tabScreens.profile.personal.emailLockedHelper')
                }
                keyboardType="email-address"
                label={t('tabScreens.profile.personal.emailLabel')}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                required
                testID="profile-personal-email-input"
                value={field.value}
              />
            )}
          />
          <Controller
            control={control}
            name="phoneNumber"
            render={({ field, fieldState }) => (
              <FormField
                errorText={fieldState.error?.message}
                helperText={
                  fieldState.error
                    ? undefined
                    : t('tabScreens.profile.personal.phoneNumberHelper')
                }
                keyboardType="phone-pad"
                label={t('tabScreens.profile.personal.phoneNumberLabel')}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                required
                testID="profile-personal-phone-number-input"
                value={field.value}
              />
            )}
          />
          <Controller
            control={control}
            name="nif"
            render={({ field, fieldState }) => (
              <FormField
                errorText={fieldState.error?.message}
                helperText={
                  fieldState.error
                    ? undefined
                    : t('tabScreens.profile.personal.nifHelper')
                }
                keyboardType="number-pad"
                label={t('tabScreens.profile.personal.nifLabel')}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                required
                testID="profile-personal-nif-input"
                value={field.value}
              />
            )}
          />
        </SeparatedStack>
      </SurfaceCard>

      <YStack>
        <PrimaryButton
          isPending={updatePersonalMutation.isPending}
          onPress={handleSubmit((values) => {
            updatePersonalMutation.mutate(
              {
                personal: toProfilePersonalDraft(values),
              },
              {
                onSuccess: () => {
                  showSuccess(
                    t('tabScreens.profile.personal.saveLabel'),
                    t('tabScreens.profile.personal.saveSuccessToast'),
                  )
                },
                onError: () => {
                  showError(
                    t('tabScreens.profile.personal.saveLabel'),
                    t('tabScreens.profile.personal.saveErrorToast'),
                  )
                },
              },
            )
          })}
          testID="profile-personal-save-button"
        >
          {t('tabScreens.profile.personal.saveLabel')}
        </PrimaryButton>
      </YStack>
    </YStack>
  )
}

export function ProfilePersonalScreen() {
  const { t } = useTranslation()
  const { data: profile, isError, isPending, refetch } = useProfileQuery()

  return (
    <ProfileDetailScreenFrame
      description={t('tabScreens.profile.personal.description')}
      testID="profile-personal-screen"
      title={t('tabScreens.profile.personal.title')}
    >
      {isError && !profile ? (
        <QueryErrorState
          onRetry={() => {
            void refetch()
          }}
          testID="profile-personal-screen-error-state"
        />
      ) : !profile || isPending ? (
        <ProfilePersonalScreenSkeleton />
      ) : (
        <ProfilePersonalForm personal={profile.personal} />
      )}
    </ProfileDetailScreenFrame>
  )
}
