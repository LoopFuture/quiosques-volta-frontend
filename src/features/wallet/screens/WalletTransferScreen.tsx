import { useRouter } from 'expo-router'
import { Platform, useWindowDimensions } from 'react-native'
import {
  Controller,
  useForm,
  useFormState,
  useWatch,
  type Control,
} from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Input, Text, XStack, YStack } from 'tamagui'
import { createZodResolver } from '@/features/app-data/forms'
import {
  PrimaryButton,
  QueryErrorState,
  SkeletonBlock,
  StatusBadge,
  SurfaceCard,
  ToneScope,
} from '@/components/ui'
import { useActionToast } from '@/features/app-shell/hooks/useActionToast'
import { useProfileQuery } from '@/features/profile/hooks'
import { profileRoutes } from '@/features/profile/routes'
import { WalletDetailScreenFrame } from '../components/WalletDetailScreenFrame'
import {
  getWalletTransferAmountError,
  getWalletTransferFormDefaultValues,
  getWalletTransferFormSchema,
  normalizeTransferAmountInput,
  parseTransferAmountCents,
  serializeWalletTransferForm,
  type WalletTransferRequest,
  type WalletTransferFormValues,
} from '../forms'
import { formatWalletAmount } from '../models'
import {
  useRequestWalletTransferMutation,
  useWalletOverviewQuery,
} from '../hooks'
import { walletRoutes } from '../routes'

function formatTransferAmountInput(amountCents: number) {
  const euros = Math.floor(amountCents / 100)
  const cents = amountCents % 100

  return `${euros},${String(cents).padStart(2, '0')}`
}

function WalletTransferScreenSkeleton() {
  return (
    <YStack gap="$4">
      <SurfaceCard gap="$4" p="$5" testID="wallet-transfer-screen-skeleton">
        <YStack gap="$2">
          <SkeletonBlock height={12} width="34%" />
          <SkeletonBlock height={24} width="46%" />
          <SkeletonBlock height={16} width="62%" />
        </YStack>
        <SkeletonBlock height={88} rounded={28} width="100%" />
        <XStack gap="$3" justify="space-between">
          <SkeletonBlock height={42} rounded={999} width="38%" />
          <SkeletonBlock height={24} width="28%" />
        </XStack>
      </SurfaceCard>

      {Array.from({ length: 2 }).map((_, index) => (
        <SurfaceCard key={`wallet-transfer-payout-skeleton-${index}`}>
          <XStack gap="$3" items="center">
            <SkeletonBlock height={24} rounded={12} width={24} />
            <YStack flex={1} gap="$2">
              <SkeletonBlock height={16} width="44%" />
              <SkeletonBlock height={14} width="68%" />
            </YStack>
            <SkeletonBlock height={40} rounded={20} width={40} />
          </XStack>
        </SurfaceCard>
      ))}

      <SurfaceCard gap="$3">
        <SkeletonBlock height={18} width="36%" />
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock
            key={`wallet-transfer-review-skeleton-${index}`}
            height={18}
            width="100%"
          />
        ))}
      </SurfaceCard>
    </YStack>
  )
}

function WalletTransferSummarySection({
  control,
  expectedArrivalValue,
  fallbackAccountHolderName,
  hasPayoutAccount,
  isPending,
  onSubmit,
  payoutAccount,
  t,
}: {
  control: Control<WalletTransferFormValues>
  expectedArrivalValue: string
  fallbackAccountHolderName?: string
  hasPayoutAccount: boolean
  isPending: boolean
  onSubmit: () => void
  payoutAccount: {
    accountHolderName?: string
    ibanMasked: string
    rail: 'sepa'
  } | null
  t: ReturnType<typeof useTranslation>['t']
}) {
  const { i18n } = useTranslation()
  const { isValid } = useFormState({ control })
  const transferAmount = useWatch({
    control,
    name: 'amount',
    defaultValue: '',
  })
  const transferAmountCents = parseTransferAmountCents(transferAmount)
  const payoutAccountHolderName =
    payoutAccount?.accountHolderName ?? fallbackAccountHolderName
  const payoutDestination = payoutAccount
    ? payoutAccount.ibanMasked
    : t('tabScreens.wallet.transfer.destinationMissingValue')
  const selectedTransferAmount =
    transferAmount.length > 0 && transferAmountCents !== null && isValid
      ? formatWalletAmount(transferAmountCents, i18n.language)
      : t('tabScreens.wallet.transfer.amountPendingValue')
  const canSubmitTransfer = hasPayoutAccount && isValid && !isPending
  const transferActionLabel = canSubmitTransfer
    ? t('tabScreens.wallet.transfer.confirmActionAmountLabel', {
        amount: selectedTransferAmount,
      })
    : t('tabScreens.wallet.transfer.confirmActionLabel')
  const reviewDescription = canSubmitTransfer
    ? t('tabScreens.wallet.transfer.reviewReadyDescription', {
        amount: selectedTransferAmount,
        destination: payoutAccountHolderName
          ? `${payoutAccountHolderName} (${payoutDestination})`
          : payoutDestination,
      })
    : t('tabScreens.wallet.transfer.reviewDescription')

  return (
    <>
      <SurfaceCard
        gap="$3"
        p="$4"
        testID="wallet-transfer-review-card"
        tone="accent"
      >
        <YStack gap="$0.5">
          <Text
            color="$color10"
            fontSize={13}
            fontWeight="800"
            textTransform="uppercase"
          >
            {t('tabScreens.wallet.transfer.reviewTitle')}
          </Text>
          <Text fontSize={18} fontWeight="800">
            {transferActionLabel}
          </Text>
          <Text color="$color11" fontSize={13} lineHeight={18}>
            {reviewDescription}
          </Text>
        </YStack>

        <YStack gap="$2">
          {payoutAccountHolderName ? (
            <XStack gap="$3" items="center" justify="space-between">
              <Text color="$color10" flex={1} fontSize={14} fontWeight="700">
                {t('tabScreens.wallet.transfer.accountHolderLabel')}
              </Text>
              <Text
                fontSize={14}
                fontWeight="700"
                style={{ flexShrink: 1, textAlign: 'right' }}
              >
                {payoutAccountHolderName}
              </Text>
            </XStack>
          ) : null}

          <XStack gap="$3" items="center" justify="space-between">
            <Text color="$color10" flex={1} fontSize={14} fontWeight="700">
              {t('tabScreens.wallet.transfer.amountSummaryLabel')}
            </Text>
            <Text fontSize={18} fontWeight="900" style={{ textAlign: 'right' }}>
              {selectedTransferAmount}
            </Text>
          </XStack>

          <XStack gap="$3" items="center" justify="space-between">
            <Text color="$color10" flex={1} fontSize={14} fontWeight="700">
              {t('tabScreens.wallet.transfer.destinationLabel')}
            </Text>
            <Text
              fontSize={14}
              fontWeight="700"
              style={{ flexShrink: 1, textAlign: 'right' }}
            >
              {payoutDestination}
            </Text>
          </XStack>

          <XStack gap="$3" items="center" justify="space-between">
            <Text color="$color10" flex={1} fontSize={14} fontWeight="700">
              {t('tabScreens.wallet.transfer.expectedArrivalLabel')}
            </Text>
            <Text fontSize={14} fontWeight="700" style={{ textAlign: 'right' }}>
              {expectedArrivalValue}
            </Text>
          </XStack>
        </YStack>
      </SurfaceCard>

      <PrimaryButton
        disabled={!canSubmitTransfer}
        isPending={isPending}
        onPress={onSubmit}
        pendingLabel={t('tabScreens.wallet.transfer.pendingActionLabel')}
        testID="wallet-transfer-submit-button"
      >
        {transferActionLabel}
      </PrimaryButton>
    </>
  )
}

function WalletTransferScreenContent({
  fallbackAccountHolderName,
  minimumTransferCents,
  payoutAccount,
  walletBalanceCents,
}: {
  fallbackAccountHolderName?: string
  minimumTransferCents: number
  payoutAccount: {
    accountHolderName?: string
    ibanMasked: string
    rail: 'sepa'
  } | null
  walletBalanceCents: number
}) {
  const router = useRouter()
  const { showError, showSuccess } = useActionToast()
  const { i18n, t } = useTranslation()
  const { fontScale } = useWindowDimensions()
  const requestTransferMutation = useRequestWalletTransferMutation()
  const availableBalanceAmount = formatWalletAmount(
    walletBalanceCents,
    i18n.language,
  )
  const minimumTransferAmount = formatWalletAmount(
    minimumTransferCents,
    i18n.language,
  )
  const transferValidationCopy = {
    amountFieldHelper: t('tabScreens.wallet.transfer.amountFieldHelper', {
      minimumAmount: minimumTransferAmount,
      amount: availableBalanceAmount,
    }),
    exceedsBalanceError: t('tabScreens.wallet.transfer.exceedsBalanceError', {
      amount: availableBalanceAmount,
    }),
    minimumAmountError: t('tabScreens.wallet.transfer.minimumAmountError', {
      amount: minimumTransferAmount,
    }),
    zeroAmountError: t('tabScreens.wallet.transfer.zeroAmountError'),
  }
  const { control, handleSubmit, reset, setValue } =
    useForm<WalletTransferFormValues>({
      defaultValues: getWalletTransferFormDefaultValues(),
      mode: 'onChange',
      reValidateMode: 'onChange',
      resolver: createZodResolver(
        getWalletTransferFormSchema(
          minimumTransferCents,
          walletBalanceCents,
          transferValidationCopy,
        ),
      ),
    })
  const hasPayoutAccount = Boolean(payoutAccount)
  const payoutAccountHolderName =
    payoutAccount?.accountHolderName ?? fallbackAccountHolderName
  const payoutDestination = payoutAccount
    ? payoutAccount.ibanMasked
    : t('tabScreens.wallet.transfer.destinationMissingValue')
  const payoutDestinationStatusDescription = hasPayoutAccount
    ? t('tabScreens.wallet.transfer.destinationReadyHelper')
    : t('tabScreens.wallet.transfer.destinationMissingDescription')
  const payoutDestinationActionDescription = hasPayoutAccount
    ? null
    : t('tabScreens.wallet.transfer.destinationMissingHelper')
  const expectedArrivalValue = hasPayoutAccount
    ? t('tabScreens.wallet.transfer.estimatedArrivalValue')
    : t('tabScreens.wallet.transfer.destinationSetupRequiredValue')
  const supportStateCopy = !hasPayoutAccount
    ? {
        actionLabel: t('tabScreens.wallet.transfer.addDestinationActionLabel'),
        description: t(
          'tabScreens.wallet.transfer.destinationMissingSupportDescription',
        ),
        title: t('tabScreens.wallet.transfer.destinationMissingSupportTitle'),
      }
    : requestTransferMutation.isError
      ? {
          actionLabel: t(
            'tabScreens.wallet.transfer.reviewDestinationActionLabel',
          ),
          description: t('tabScreens.wallet.transfer.requestFailedDescription'),
          title: t('tabScreens.wallet.transfer.requestFailedTitle'),
        }
      : null

  const handleManagePayoutAccount = () => {
    if (requestTransferMutation.isError) {
      requestTransferMutation.reset()
    }

    router.push(profileRoutes.payments)
  }

  const submitTransfer = handleSubmit((values) => {
    const request: WalletTransferRequest = serializeWalletTransferForm(values)

    requestTransferMutation.mutate(request, {
      onSuccess: (response) => {
        showSuccess(
          t('tabScreens.wallet.transfer.actionLabel'),
          t('tabScreens.wallet.transfer.successToast'),
        )
        reset(getWalletTransferFormDefaultValues())
        router.replace(walletRoutes.movementDetail(response.transferId))
      },
      onError: () => {
        showError(
          t('tabScreens.wallet.transfer.actionLabel'),
          t('tabScreens.wallet.transfer.errorToast'),
        )
      },
    })
  })

  return (
    <YStack gap="$4">
      <SurfaceCard gap="$4" p="$4.5" tone="accent">
        <YStack gap="$1.5">
          <Text
            color="$color10"
            fontSize={13}
            fontWeight="800"
            textTransform="uppercase"
          >
            {t('tabScreens.wallet.transfer.balanceTitle')}
          </Text>
          <Text fontSize={24} fontWeight="900">
            {t('tabScreens.wallet.transfer.description')}
          </Text>
          <Text color="$color11" fontSize={14} lineHeight={20}>
            {t('tabScreens.wallet.transfer.balanceCaption')}
          </Text>
        </YStack>

        <YStack gap="$3.5">
          <Controller
            control={control}
            name="amount"
            render={({ field }) => {
              const transferAmountError = getWalletTransferAmountError(
                field.value,
                minimumTransferCents,
                walletBalanceCents,
                transferValidationCopy,
              )
              const helperText =
                transferAmountError ?? transferValidationCopy.amountFieldHelper
              const helperTextId = 'wallet-transfer-amount-helper'
              const isLargeText = fontScale > 1.15

              return (
                <YStack
                  bg="$background"
                  borderColor={transferAmountError ? '$color8' : '$borderColor'}
                  borderWidth={1}
                  gap="$2.5"
                  p="$4"
                  rounded="$7"
                >
                  <YStack gap="$1.5">
                    <Text
                      color="$color10"
                      fontSize={13}
                      fontWeight="800"
                      textTransform="uppercase"
                    >
                      {t('tabScreens.wallet.transfer.amountFieldLabel')}
                    </Text>
                    <XStack
                      gap="$3"
                      items="center"
                      style={{ minWidth: 0 }}
                      width="100%"
                    >
                      <Text
                        color="$color10"
                        fontSize={isLargeText ? 28 : 34}
                        fontWeight="800"
                      >
                        €
                      </Text>
                      <Input
                        aria-describedby={helperTextId}
                        accessibilityHint={helperText}
                        accessibilityLabel={t(
                          'tabScreens.wallet.transfer.amountFieldLabel',
                        )}
                        color="$color"
                        flex={1}
                        fontSize={isLargeText ? 44 : 52}
                        fontWeight="900"
                        height={isLargeText ? 84 : 72}
                        keyboardType="decimal-pad"
                        onBlur={field.onBlur}
                        onChangeText={(value) => {
                          if (requestTransferMutation.isError) {
                            requestTransferMutation.reset()
                          }

                          field.onChange(normalizeTransferAmountInput(value))
                        }}
                        placeholder="0,00"
                        placeholderTextColor="$color10"
                        style={[
                          {
                            fontVariant: 'tabular-nums',
                            paddingBottom: 0,
                            paddingTop: 0,
                          },
                          Platform.OS === 'android'
                            ? { paddingVertical: 0 }
                            : null,
                        ]}
                        testID="wallet-transfer-amount-input"
                        textAlignVertical={
                          Platform.OS === 'android' ? 'center' : undefined
                        }
                        unstyled
                        value={field.value}
                      />
                    </XStack>
                  </YStack>

                  <XStack items="center" justify="space-between" gap="$3">
                    <YStack flex={1} gap="$1" style={{ minWidth: 0 }}>
                      <Text color="$color10" fontSize={13} fontWeight="800">
                        {t(
                          'tabScreens.wallet.overview.balanceCard.availableBalanceLabel',
                        )}
                      </Text>
                      <Text fontSize={22} fontWeight="900">
                        {availableBalanceAmount}
                      </Text>
                    </YStack>

                    <PrimaryButton
                      emphasis="outline"
                      fullWidth={false}
                      onPress={() => {
                        if (requestTransferMutation.isError) {
                          requestTransferMutation.reset()
                        }

                        setValue(
                          'amount',
                          formatTransferAmountInput(walletBalanceCents),
                          {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          },
                        )
                      }}
                      tone="neutral"
                    >
                      {t('tabScreens.wallet.transfer.fullBalanceActionLabel')}
                    </PrimaryButton>
                  </XStack>

                  <ToneScope tone={transferAmountError ? 'error' : 'neutral'}>
                    <Text
                      accessibilityLiveRegion="polite"
                      color={transferAmountError ? '$color' : '$color11'}
                      fontSize={14}
                      lineHeight={20}
                      nativeID={helperTextId}
                    >
                      {helperText}
                    </Text>
                  </ToneScope>
                </YStack>
              )
            }}
          />

          <YStack
            bg="$color1"
            borderColor="$borderColor"
            borderWidth={1}
            gap="$2.5"
            p="$3.5"
            rounded="$7"
          >
            <YStack gap="$0.5">
              <Text color="$color10" fontSize={13} fontWeight="800">
                {t('tabScreens.wallet.transfer.destinationCardEyebrow')}
              </Text>
              {payoutAccountHolderName ? (
                <YStack gap="$0.5">
                  <Text color="$color10" fontSize={12} fontWeight="700">
                    {t('tabScreens.wallet.transfer.accountHolderLabel')}
                  </Text>
                  <Text fontSize={15} fontWeight="800">
                    {payoutAccountHolderName}
                  </Text>
                </YStack>
              ) : null}
              <YStack gap="$0.5">
                <Text color="$color10" fontSize={12} fontWeight="700">
                  {t('tabScreens.wallet.transfer.destinationLabel')}
                </Text>
                <Text fontSize={15} fontWeight="800">
                  {payoutDestination}
                </Text>
              </YStack>
              <Text color="$color11" fontSize={14} lineHeight={21}>
                {payoutDestinationStatusDescription}
              </Text>
              {payoutDestinationActionDescription ? (
                <Text
                  color="$color10"
                  fontSize={13}
                  fontWeight="700"
                  lineHeight={18}
                >
                  {payoutDestinationActionDescription}
                </Text>
              ) : null}
            </YStack>

            <PrimaryButton
              emphasis="outline"
              fullWidth={false}
              onPress={handleManagePayoutAccount}
              tone="neutral"
            >
              {t(
                hasPayoutAccount
                  ? 'tabScreens.wallet.transfer.reviewDestinationActionLabel'
                  : 'tabScreens.wallet.transfer.addDestinationActionLabel',
              )}
            </PrimaryButton>
          </YStack>
        </YStack>
      </SurfaceCard>

      <WalletTransferSummarySection
        control={control}
        expectedArrivalValue={expectedArrivalValue}
        fallbackAccountHolderName={fallbackAccountHolderName}
        hasPayoutAccount={hasPayoutAccount}
        isPending={requestTransferMutation.isPending}
        onSubmit={submitTransfer}
        payoutAccount={payoutAccount}
        t={t}
      />

      {supportStateCopy ? (
        <SurfaceCard
          gap="$3"
          p="$4.5"
          testID="wallet-transfer-support-state"
          tone="error"
        >
          <YStack gap="$1.5">
            <StatusBadge tone="error">{supportStateCopy.title}</StatusBadge>
            <Text fontSize={18} fontWeight="800">
              {supportStateCopy.description}
            </Text>
            {!hasPayoutAccount ? (
              <Text color="$color11" fontSize={14} lineHeight={20}>
                {t('tabScreens.wallet.transfer.destinationMissingReturnHelper')}
              </Text>
            ) : null}
          </YStack>

          <PrimaryButton
            emphasis="outline"
            fullWidth={false}
            onPress={handleManagePayoutAccount}
            tone="error"
          >
            {supportStateCopy.actionLabel}
          </PrimaryButton>
        </SurfaceCard>
      ) : null}
    </YStack>
  )
}

export default function WalletTransferScreen() {
  const { t } = useTranslation()
  const {
    data: walletOverviewState,
    isError: isWalletError,
    isPending: isWalletPending,
    refetch: refetchWallet,
  } = useWalletOverviewQuery()
  const {
    data: profile,
    isError: isProfileError,
    isPending: isProfilePending,
    refetch: refetchProfile,
  } = useProfileQuery()

  const handleRetry = () => {
    void refetchWallet()
    void refetchProfile()
  }

  return (
    <WalletDetailScreenFrame
      description={t('tabScreens.wallet.transfer.frameDescription')}
      keyboardAware
      testID="wallet-transfer-screen"
      title={t('tabScreens.wallet.transfer.title')}
    >
      {(isWalletError || isProfileError) &&
      (!walletOverviewState || !profile) ? (
        <QueryErrorState
          onRetry={handleRetry}
          testID="wallet-transfer-screen-error-state"
        />
      ) : isWalletPending ||
        isProfilePending ||
        !walletOverviewState ||
        !profile ? (
        <WalletTransferScreenSkeleton />
      ) : (
        <WalletTransferScreenContent
          fallbackAccountHolderName={profile.personal.name ?? undefined}
          minimumTransferCents={
            walletOverviewState.transferEligibility.minimumTransfer.amountMinor
          }
          payoutAccount={profile.payoutAccount}
          walletBalanceCents={walletOverviewState.balance.amountMinor}
        />
      )}
    </WalletDetailScreenFrame>
  )
}
