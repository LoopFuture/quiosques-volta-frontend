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
  getProfilePaymentsFormDefaultValues,
  getProfilePaymentsFormSchema,
  toProfilePaymentsDraft,
  type ProfilePaymentsFormValues,
} from '../forms'
import { useProfileQuery, useUpdateProfilePaymentsMutation } from '../hooks'
import { getProfileValidationCopy } from '../presentation'
import { type PayoutAccount } from '../models'

function ProfilePaymentsScreenSkeleton() {
  return (
    <SurfaceCard testID="profile-payments-screen-skeleton">
      <SeparatedStack>
        <YStack gap="$3">
          <SkeletonBlock height={14} width="32%" />
          <SkeletonBlock height={54} width="100%" />
        </YStack>
        <YStack gap="$3">
          <SkeletonBlock height={18} width="36%" />
          <SkeletonBlock height={14} width="70%" />
        </YStack>
      </SeparatedStack>
    </SurfaceCard>
  )
}

function ProfilePaymentsForm({
  fallbackAccountHolderName,
  payments,
}: {
  fallbackAccountHolderName?: string | null
  payments: PayoutAccount | null
}) {
  const updatePaymentsMutation = useUpdateProfilePaymentsMutation()
  const { showError, showSuccess } = useActionToast()
  const { t } = useTranslation()
  const validationCopy = getProfileValidationCopy(t)
  const { control, handleSubmit, reset } = useForm<ProfilePaymentsFormValues>({
    defaultValues: getProfilePaymentsFormDefaultValues(
      payments,
      fallbackAccountHolderName,
    ),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    resolver: createZodResolver(
      getProfilePaymentsFormSchema(validationCopy.payments),
    ),
  })

  useEffect(() => {
    reset(
      getProfilePaymentsFormDefaultValues(payments, fallbackAccountHolderName),
    )
  }, [fallbackAccountHolderName, payments, reset])

  return (
    <YStack gap="$4">
      <SettingsSectionHeader
        helperText={t('tabScreens.profile.payments.sectionHelper')}
        title={t('tabScreens.profile.payments.sectionTitle')}
      />

      <SurfaceCard>
        <SeparatedStack separatorSpacing="$3">
          <Controller
            control={control}
            name="accountHolderName"
            render={({ field, fieldState }) => (
              <FormField
                autoCapitalize="words"
                errorText={fieldState.error?.message}
                helperText={
                  fieldState.error
                    ? undefined
                    : t('tabScreens.profile.payments.accountHolderNameHelper')
                }
                label={t('tabScreens.profile.payments.accountHolderNameLabel')}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                required
                testID="profile-payments-account-holder-name-input"
                value={field.value}
              />
            )}
          />
          <Controller
            control={control}
            name="iban"
            render={({ field, fieldState }) => (
              <FormField
                autoComplete="off"
                autoCapitalize="characters"
                autoCorrect={false}
                errorText={fieldState.error?.message}
                helperText={
                  fieldState.error
                    ? undefined
                    : payments?.ibanMasked
                      ? t('tabScreens.profile.payments.currentIbanHelper', {
                          iban: payments.ibanMasked,
                        })
                      : t('tabScreens.profile.payments.ibanHelper')
                }
                label={t('tabScreens.profile.payments.ibanLabel')}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                required
                spellCheck={false}
                testID="profile-payments-iban-input"
                value={field.value}
              />
            )}
          />
        </SeparatedStack>
      </SurfaceCard>

      <YStack>
        <PrimaryButton
          isPending={updatePaymentsMutation.isPending}
          onPress={handleSubmit((values) => {
            updatePaymentsMutation.mutate(
              {
                payoutAccount: toProfilePaymentsDraft(values),
              },
              {
                onSuccess: () => {
                  showSuccess(
                    t('tabScreens.profile.payments.saveLabel'),
                    t('tabScreens.profile.payments.saveSuccessToast'),
                  )
                },
                onError: () => {
                  showError(
                    t('tabScreens.profile.payments.saveLabel'),
                    t('tabScreens.profile.payments.saveErrorToast'),
                  )
                },
              },
            )
          })}
          testID="profile-payments-save-button"
        >
          {t('tabScreens.profile.payments.saveLabel')}
        </PrimaryButton>
      </YStack>
    </YStack>
  )
}

export function ProfilePaymentsScreen() {
  const { t } = useTranslation()
  const { data: profile, isError, isPending, refetch } = useProfileQuery()

  return (
    <ProfileDetailScreenFrame
      description={t('tabScreens.profile.payments.description')}
      testID="profile-payments-screen"
      title={t('tabScreens.profile.payments.title')}
    >
      {isError && !profile ? (
        <QueryErrorState
          onRetry={() => {
            void refetch()
          }}
          testID="profile-payments-screen-error-state"
        />
      ) : !profile || isPending ? (
        <ProfilePaymentsScreenSkeleton />
      ) : (
        <ProfilePaymentsForm
          fallbackAccountHolderName={profile.personal.name}
          payments={profile.payoutAccount}
        />
      )}
    </ProfileDetailScreenFrame>
  )
}
