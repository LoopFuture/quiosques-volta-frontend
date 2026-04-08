import { useRouter } from 'expo-router'
import { Platform } from 'react-native'
import { Controller, useForm } from 'react-hook-form'
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
import { WalletReceiptCard } from '../components/WalletReceiptCard'
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
import { formatWalletAmount, formatWalletPaymentAccount } from '../models'
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

function WalletTransferScreenContent({
  payoutAccount,
  walletBalanceCents,
}: {
  payoutAccount: {
    ibanMasked: string
    rail: 'sepa' | 'spin'
  } | null
  walletBalanceCents: number
}) {
  const router = useRouter()
  const { showError, showSuccess } = useActionToast()
  const { i18n, t } = useTranslation()
  const requestTransferMutation = useRequestWalletTransferMutation()
  const availableBalanceAmount = formatWalletAmount(
    walletBalanceCents,
    i18n.language,
  )
  const transferValidationCopy = {
    amountFieldHelper: t('tabScreens.wallet.transfer.amountFieldHelper', {
      amount: availableBalanceAmount,
    }),
    exceedsBalanceError: t('tabScreens.wallet.transfer.exceedsBalanceError', {
      amount: availableBalanceAmount,
    }),
    zeroAmountError: t('tabScreens.wallet.transfer.zeroAmountError'),
  }
  const { control, handleSubmit, reset, setValue, watch } =
    useForm<WalletTransferFormValues>({
      defaultValues: getWalletTransferFormDefaultValues(),
      mode: 'onChange',
      reValidateMode: 'onChange',
      resolver: createZodResolver(
        getWalletTransferFormSchema(walletBalanceCents, transferValidationCopy),
      ),
    })
  const transferAmount = watch('amount')
  const transferAmountError = getWalletTransferAmountError(
    transferAmount,
    walletBalanceCents,
    transferValidationCopy,
  )
  const isTransferAmountValid =
    transferAmount.length > 0 &&
    !transferAmountError &&
    !requestTransferMutation.isPending
  const transferAmountCents = parseTransferAmountCents(transferAmount)
  const selectedTransferAmount =
    transferAmount.length > 0 &&
    !transferAmountError &&
    transferAmountCents !== null
      ? formatWalletAmount(transferAmountCents, i18n.language)
      : t('tabScreens.wallet.transfer.amountPendingValue')
  const selectedPayoutMethodLabel = payoutAccount
    ? payoutAccount.rail === 'spin'
      ? t('tabScreens.wallet.transfer.payoutMethodSpin')
      : t('tabScreens.wallet.transfer.payoutMethodSepa')
    : '-'
  const selectedPayoutMethodHelper = payoutAccount
    ? payoutAccount.rail === 'spin'
      ? t('tabScreens.wallet.transfer.payoutOptionSpinCaption')
      : t('tabScreens.wallet.transfer.payoutOptionSepaCaption')
    : undefined
  const payoutDestination = payoutAccount
    ? formatWalletPaymentAccount(payoutAccount)
    : '-'
  const transferActionLabel =
    isTransferAmountValid && transferAmountCents !== null
      ? t('tabScreens.wallet.transfer.confirmActionAmountLabel', {
          amount: selectedTransferAmount,
        })
      : t('tabScreens.wallet.transfer.confirmActionLabel')

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
      <SurfaceCard gap="$4.5" p="$5" tone="accent">
        <YStack gap="$1.5">
          <Text
            color="$color10"
            fontSize={13}
            fontWeight="800"
            textTransform="uppercase"
          >
            {t('tabScreens.wallet.transfer.balanceTitle')}
          </Text>
          <Text fontSize={24} fontWeight="800">
            {t('tabScreens.wallet.transfer.description')}
          </Text>
          <Text color="$color11" fontSize={15} lineHeight={22}>
            {t('tabScreens.wallet.transfer.balanceCaption')}
          </Text>
        </YStack>

        <YStack gap="$4">
          <Controller
            control={control}
            name="amount"
            render={({ field }) => (
              <YStack gap="$2.5" items="center">
                <Text
                  color="$color10"
                  fontSize={13}
                  fontWeight="800"
                  textTransform="uppercase"
                >
                  {t('tabScreens.wallet.transfer.amountFieldLabel')}
                </Text>

                <XStack
                  gap="$2.5"
                  items="center"
                  justify="center"
                  style={{ maxWidth: 280 }}
                  width="100%"
                >
                  <Input
                    accessibilityLabel={t(
                      'tabScreens.wallet.transfer.amountFieldLabel',
                    )}
                    color="$color"
                    flex={1}
                    fontSize={52}
                    fontWeight="900"
                    height={72}
                    keyboardType="decimal-pad"
                    onBlur={field.onBlur}
                    onChangeText={(value) => {
                      field.onChange(normalizeTransferAmountInput(value))
                    }}
                    placeholder="0,00"
                    placeholderTextColor="$color10"
                    style={[
                      {
                        fontVariant: 'tabular-nums',
                        paddingBottom: 0,
                        paddingTop: 0,
                        textAlign: 'center',
                      },
                      Platform.OS === 'android' ? { paddingVertical: 0 } : null,
                    ]}
                    testID="wallet-transfer-amount-input"
                    textAlignVertical={
                      Platform.OS === 'android' ? 'center' : undefined
                    }
                    unstyled
                    value={field.value}
                  />
                  <Text color="$color10" fontSize={34} fontWeight="800">
                    €
                  </Text>
                </XStack>

                <ToneScope tone={transferAmountError ? 'error' : 'neutral'}>
                  <Text
                    color={transferAmountError ? '$color' : '$color11'}
                    fontSize={14}
                    style={{ textAlign: 'center' }}
                  >
                    {transferAmountError ??
                      transferValidationCopy.amountFieldHelper}
                  </Text>
                </ToneScope>
              </YStack>
            )}
          />

          <XStack items="center" justify="space-between" gap="$3">
            <YStack flex={1} gap="$1" style={{ minWidth: 0 }}>
              <Text color="$color10" fontSize={13} fontWeight="800">
                {t(
                  'tabScreens.wallet.overview.balanceCard.availableBalanceLabel',
                )}
              </Text>
              <Text fontSize={24} fontWeight="900">
                {availableBalanceAmount}
              </Text>
            </YStack>

            <PrimaryButton
              emphasis="outline"
              fullWidth={false}
              onPress={() => {
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
        </YStack>
      </SurfaceCard>

      <WalletReceiptCard
        footer={
          selectedPayoutMethodHelper ? (
            <YStack
              bg="$accent2"
              gap="$1.5"
              p="$3.5"
              rounded="$6"
              testID="wallet-transfer-review-note"
            >
              <StatusBadge tone="accent">
                {selectedPayoutMethodLabel}
              </StatusBadge>
              <Text color="$color11" fontSize={14} lineHeight={20}>
                {selectedPayoutMethodHelper}
              </Text>
            </YStack>
          ) : null
        }
        items={[
          {
            label: t('tabScreens.wallet.transfer.amountSummaryLabel'),
            value: selectedTransferAmount,
          },
          {
            label: t('tabScreens.wallet.transfer.destinationLabel'),
            value: payoutDestination,
          },
          {
            label: t('tabScreens.wallet.transfer.payoutMethodLabel'),
            value: selectedPayoutMethodLabel,
            helper: selectedPayoutMethodHelper,
          },
          {
            label: t('tabScreens.wallet.transfer.expectedArrivalLabel'),
            value: t('tabScreens.wallet.transfer.estimatedArrivalValue'),
          },
        ]}
        testID="wallet-transfer-review-card"
        title={t('tabScreens.wallet.transfer.reviewTitle')}
      />

      <PrimaryButton
        disabled={!isTransferAmountValid}
        isPending={requestTransferMutation.isPending}
        onPress={submitTransfer}
        testID="wallet-transfer-submit-button"
      >
        {transferActionLabel}
      </PrimaryButton>
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
      description=""
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
          payoutAccount={profile.payoutAccount}
          walletBalanceCents={walletOverviewState.balance.amountMinor}
        />
      )}
    </WalletDetailScreenFrame>
  )
}
