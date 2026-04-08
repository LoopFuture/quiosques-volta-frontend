import { useEffect, useRef, useState } from 'react'
import {
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Dialog,
  Spinner,
  Text,
  XStack,
  YStack,
  useTheme,
} from 'tamagui'
import {
  PrimaryButton,
  QueryErrorState,
  ScreenContainer,
  SkeletonBlock,
  StatusBadge,
  SurfaceCard,
  ToneScope,
} from '@/components/ui'
import { TabTopBar } from '@/features/app-shell/navigation/tab-header'
import { BarcodeQrCode } from '../components/BarcodeQrCode'
import { PersonalBarcodeCard } from '../components/PersonalBarcodeCard'
import { useBarcodeCountdown, useBarcodeScreenQuery } from '../hooks'
import { useQrPresentationBrightness } from '../hooks/useQrPresentationBrightness'

const INLINE_QR_SIZE = 168
const INLINE_QR_STAGE_MIN_HEIGHT = INLINE_QR_SIZE + 40
const INLINE_QR_ACTION_HEIGHT = 56

function BarcodeScreenSkeleton() {
  return (
    <SurfaceCard gap="$5" p="$5" testID="barcode-screen-skeleton">
      <YStack gap="$2">
        <SkeletonBlock height={18} width={84} />
        <SkeletonBlock height={36} width="62%" />
        <SkeletonBlock height={18} width="78%" />
      </YStack>
      <YStack gap="$3" items="center">
        <SkeletonBlock height={168} rounded={24} width={168} />
        <SkeletonBlock height={24} width="54%" />
      </YStack>
      <YStack gap="$3" width="100%">
        <SkeletonBlock height={14} width="32%" />
        <SkeletonBlock height={56} rounded={28} width="100%" />
      </YStack>
    </SurfaceCard>
  )
}

function BarcodeQrRefreshPlaceholder({
  description,
  size,
  testID,
}: {
  description: string
  size: number
  testID: string
}) {
  const theme = useTheme()

  return (
    <YStack
      bg="$background"
      gap="$3"
      items="center"
      justify="center"
      px="$4"
      py="$5"
      rounded={28}
      style={{
        maxWidth: Math.min(size + 96, 360),
        minHeight: size + 40,
        width: '100%',
      }}
      testID={testID}
    >
      <Spinner color={theme.color11.val} size="large" />
      <Text
        color="$color11"
        fontSize={15}
        lineHeight={21}
        style={{ maxWidth: 280, textAlign: 'center' }}
      >
        {description}
      </Text>
    </YStack>
  )
}

function BarcodeStatusLabel({
  borderless = false,
  label,
  testID,
  tone,
}: {
  borderless?: boolean
  label: string
  testID?: string
  tone: 'accent' | 'warning' | 'error'
}) {
  if (borderless) {
    return (
      <ToneScope tone={tone}>
        <Text
          color="$color"
          fontSize={13}
          fontWeight="800"
          style={{ alignSelf: 'flex-start' }}
          testID={testID}
        >
          {label}
        </Text>
      </ToneScope>
    )
  }

  return <StatusBadge tone={tone}>{label}</StatusBadge>
}

function BarcodeQrErrorStateSurface({
  actionLabel,
  description,
  onAction,
  size,
  testID,
  title,
}: {
  actionLabel: string
  description: string
  onAction: () => void
  size: number
  testID: string
  title: string
}) {
  return (
    <YStack
      bg="$background"
      borderColor="$borderColor"
      borderWidth={1}
      gap="$3"
      items="center"
      justify="center"
      px="$4"
      py="$5"
      rounded={24}
      style={{
        maxWidth: Math.min(size + 96, 320),
        minHeight: size + 40,
        width: '100%',
      }}
      testID={testID}
    >
      <StatusBadge tone="error">{title}</StatusBadge>
      <Text
        color="$color11"
        fontSize={15}
        lineHeight={21}
        style={{ maxWidth: 260, textAlign: 'center' }}
      >
        {description}
      </Text>
      <PrimaryButton
        emphasis="outline"
        fullWidth={false}
        onPress={onAction}
        tone="error"
      >
        {actionLabel}
      </PrimaryButton>
    </YStack>
  )
}

function BarcodeCountdownInlineStatus({
  formattedRemaining,
  t,
  testID,
}: {
  formattedRemaining: string
  t: ReturnType<typeof useTranslation>['t']
  testID: string
}) {
  return (
    <XStack
      accessibilityLabel={t('tabScreens.barcode.card.countdownA11yLabel')}
      accessibilityRole="timer"
      accessibilityValue={{
        text: t('tabScreens.barcode.card.countdownA11yValue', {
          time: formattedRemaining,
        }),
      }}
      accessible
      gap="$3"
      items="center"
      justify="space-between"
      px="$4"
      rounded={999}
      testID={testID}
      width="100%"
    >
      <Text
        color="$color10"
        fontSize={12}
        fontWeight="700"
        letterSpacing={0.8}
        textTransform="uppercase"
      >
        {t('tabScreens.barcode.card.validUntilLabel')}
      </Text>
      <Text color="$color12" fontSize={24} fontWeight="900" lineHeight={28}>
        {formattedRemaining}
      </Text>
    </XStack>
  )
}

export default function BarcodeScreen() {
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const expiredPayloadRefetchKeyRef = useRef<string | null>(null)
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { height, width } = useWindowDimensions()
  const theme = useTheme()
  const {
    data: barcodeScreenState,
    isError,
    isPending,
    isRefetching,
    refetch,
  } = useBarcodeScreenQuery()
  const barcodeCountdown = useBarcodeCountdown(barcodeScreenState)
  const barcodePayloadKey = barcodeScreenState
    ? `${barcodeScreenState.code}:${barcodeScreenState.expiresAt}`
    : null
  const modalQrSize = Math.floor(
    Math.max(208, Math.min(width - 80, height * 0.42, 336)),
  )
  const modalBottomPadding = Math.max(insets.bottom + 20, 28)
  const modalTopPadding = Math.max(insets.top, 16)
  const closeQrModal = () => setIsQrModalOpen(false)
  const openQrModal = () => setIsQrModalOpen(true)

  useQrPresentationBrightness(isQrModalOpen)

  const hasExpiredRefreshError = Boolean(
    barcodeScreenState &&
    barcodeCountdown.isExpired &&
    isError &&
    !isPending &&
    !isRefetching,
  )
  const isRefreshingExpiredCode = Boolean(
    barcodeScreenState && barcodeCountdown.isExpired && !hasExpiredRefreshError,
  )
  const isActiveBarcode = Boolean(
    barcodeScreenState && !barcodeCountdown.isExpired,
  )
  const expiredStateLabel = t('tabScreens.barcode.card.expiredLabel')
  const statusTone = isActiveBarcode
    ? 'accent'
    : isRefreshingExpiredCode
      ? 'warning'
      : 'error'
  const statusLabel = isActiveBarcode
    ? t('tabScreens.barcode.card.statusLabel')
    : isRefreshingExpiredCode
      ? t('tabScreens.barcode.card.refreshingLabel')
      : expiredStateLabel
  const shouldUseBorderlessRefreshStatus = isRefreshingExpiredCode

  useEffect(() => {
    if (
      !barcodePayloadKey ||
      !barcodeScreenState ||
      !barcodeCountdown.isExpired
    ) {
      return
    }

    if (expiredPayloadRefetchKeyRef.current === barcodePayloadKey) {
      return
    }

    expiredPayloadRefetchKeyRef.current = barcodePayloadKey
    void refetch()
  }, [
    barcodeCountdown.isExpired,
    barcodePayloadKey,
    barcodeScreenState,
    refetch,
  ])

  useEffect(() => {
    if (!isQrModalOpen || Platform.OS !== 'android') {
      return
    }

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        closeQrModal()
        return true
      },
    )

    return () => {
      subscription.remove()
    }
  }, [isQrModalOpen])

  const handleRetryExpiredBarcode = () => {
    void refetch()
  }

  const inlineQrNode = barcodeScreenState ? (
    <YStack
      items="center"
      justify="center"
      style={{ minHeight: INLINE_QR_STAGE_MIN_HEIGHT }}
      width="100%"
    >
      {isActiveBarcode ? (
        <Pressable
          accessibilityLabel={t('tabScreens.barcode.card.qrExpandLabel')}
          hitSlop={12}
          onPress={openQrModal}
          style={({ pressed }) => ({
            opacity: pressed ? 0.88 : 1,
          })}
        >
          <BarcodeQrCode
            size={INLINE_QR_SIZE}
            testID="barcode-inline-qr"
            value={barcodeScreenState.code}
          />
        </Pressable>
      ) : isRefreshingExpiredCode ? (
        <BarcodeQrRefreshPlaceholder
          description={t('tabScreens.barcode.card.refreshingDescription')}
          size={INLINE_QR_SIZE}
          testID="barcode-inline-refreshing-state"
        />
      ) : (
        <BarcodeQrErrorStateSurface
          actionLabel={t('tabScreens.barcode.card.retryLabel')}
          description={t('tabScreens.barcode.card.expiredDescription')}
          onAction={handleRetryExpiredBarcode}
          size={INLINE_QR_SIZE}
          testID="barcode-inline-expired-state"
          title={expiredStateLabel}
        />
      )}
    </YStack>
  ) : null

  const inlineAction = isActiveBarcode ? (
    <PrimaryButton
      accessibilityLabel={t('tabScreens.barcode.card.qrExpandLabel')}
      onPress={openQrModal}
      testID="barcode-qr-trigger"
    >
      {t('tabScreens.barcode.card.openFullscreenLabel')}
    </PrimaryButton>
  ) : isRefreshingExpiredCode ? (
    <YStack
      height={INLINE_QR_ACTION_HEIGHT}
      testID="barcode-inline-action-spacer"
      width="100%"
    />
  ) : null

  return (
    <>
      <ScreenContainer
        header={<TabTopBar routeName="barcode" />}
        onRefresh={() => {
          void refetch()
        }}
        refreshing={isRefetching}
        scrollable
        testID="barcode-screen"
      >
        {isError && !barcodeScreenState ? (
          <QueryErrorState
            description={t('tabScreens.barcode.errors.description')}
            onRetry={() => {
              void refetch()
            }}
            testID="barcode-screen-error-state"
            title={t('tabScreens.barcode.errors.title')}
          />
        ) : !barcodeScreenState || isPending ? (
          <BarcodeScreenSkeleton />
        ) : (
          <PersonalBarcodeCard
            action={inlineAction}
            barcode={inlineQrNode}
            code={barcodeScreenState.code}
            codeDisplay={null}
            description={t('tabScreens.barcode.card.description')}
            eyebrow={
              <BarcodeStatusLabel
                borderless={shouldUseBorderlessRefreshStatus}
                label={statusLabel}
                testID="barcode-inline-status-label"
                tone={statusTone}
              />
            }
            footer={
              <YStack gap="$3" width="100%">
                <BarcodeCountdownInlineStatus
                  formattedRemaining={barcodeCountdown.formattedRemaining}
                  t={t}
                  testID="barcode-inline-countdown"
                />
              </YStack>
            }
            title={t('tabScreens.barcode.card.title')}
          />
        )}
      </ScreenContainer>

      {barcodeScreenState ? (
        <Dialog modal open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
          <Dialog.Portal>
            <Dialog.Overlay
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
              fullscreen
              opacity={0.2}
              style={{ backgroundColor: theme.accent5.val }}
            />
            <Dialog.Content
              fullscreen
              onPointerDownOutside={closeQrModal}
              p={0}
              unstyled
            >
              <Dialog.Title display="none">
                {t('tabScreens.barcode.identity.title')}
              </Dialog.Title>
              <Dialog.Description display="none">
                {t('tabScreens.barcode.card.qrModalHint')}
              </Dialog.Description>

              <YStack bg="$background" flex={1} testID="barcode-qr-modal">
                <YStack
                  pointerEvents="none"
                  position="absolute"
                  rounded={132}
                  bg="$accent4"
                  opacity={0.14}
                  style={{ top: -72, right: -48, width: 264, height: 264 }}
                />
                <YStack
                  pointerEvents="none"
                  position="absolute"
                  rounded={108}
                  bg="$accent3"
                  opacity={0.12}
                  style={{ bottom: 112, left: -88, width: 216, height: 216 }}
                />

                <Pressable
                  accessible={false}
                  onPress={closeQrModal}
                  style={StyleSheet.absoluteFill}
                  testID="barcode-qr-overlay"
                />

                <YStack
                  flex={1}
                  pb={modalBottomPadding}
                  pt={modalTopPadding}
                  px="$4"
                  pointerEvents="box-none"
                >
                  <YStack
                    flex={1}
                    justify="space-between"
                    pointerEvents="box-none"
                  >
                    <YStack gap="$4" items="center" pointerEvents="box-none">
                      {isActiveBarcode ? (
                        <BarcodeQrCode
                          size={modalQrSize}
                          testID="barcode-modal-qr"
                          value={barcodeScreenState.code}
                        />
                      ) : isRefreshingExpiredCode ? (
                        <BarcodeQrRefreshPlaceholder
                          description={t(
                            'tabScreens.barcode.card.refreshingDescription',
                          )}
                          size={modalQrSize}
                          testID="barcode-modal-refreshing-state"
                        />
                      ) : (
                        <BarcodeQrErrorStateSurface
                          actionLabel={t('tabScreens.barcode.card.retryLabel')}
                          description={t(
                            'tabScreens.barcode.card.expiredDescription',
                          )}
                          onAction={handleRetryExpiredBarcode}
                          size={modalQrSize}
                          testID="barcode-modal-expired-state"
                          title={expiredStateLabel}
                        />
                      )}

                      {isActiveBarcode ? (
                        <YStack style={{ maxWidth: 420 }} width="100%">
                          <BarcodeCountdownInlineStatus
                            formattedRemaining={
                              barcodeCountdown.formattedRemaining
                            }
                            t={t}
                            testID="barcode-modal-countdown"
                          />
                        </YStack>
                      ) : null}

                      <YStack
                        gap="$2.5"
                        px="$1"
                        style={{
                          alignSelf: 'stretch',
                          marginTop: isActiveBarcode ? 8 : 0,
                        }}
                      >
                        <BarcodeStatusLabel
                          borderless={shouldUseBorderlessRefreshStatus}
                          label={
                            isActiveBarcode
                              ? t('tabScreens.barcode.identity.readyLabel')
                              : statusLabel
                          }
                          testID="barcode-modal-status-label"
                          tone={statusTone}
                        />
                        <Text fontSize={28} fontWeight="900" lineHeight={32}>
                          {t('tabScreens.barcode.identity.title')}
                        </Text>
                        <Text color="$color11" fontSize={16} lineHeight={22}>
                          {isActiveBarcode
                            ? t('tabScreens.barcode.card.qrModalHint')
                            : isRefreshingExpiredCode
                              ? t(
                                  'tabScreens.barcode.card.refreshingDescription',
                                )
                              : t('tabScreens.barcode.card.expiredDescription')}
                        </Text>
                      </YStack>
                    </YStack>

                    <YStack items="center" pb="$1" pointerEvents="box-none">
                      <Button
                        accessibilityLabel={t(
                          'tabScreens.barcode.card.qrModalCloseLabel',
                        )}
                        bg="$background"
                        borderColor="$color8"
                        borderWidth={1}
                        height={44}
                        onPress={closeQrModal}
                        px="$5"
                        pressStyle={{ opacity: 0.9 }}
                        rounded={999}
                        testID="barcode-qr-close"
                      >
                        <Text color="$color12" fontSize={15} fontWeight="800">
                          {t('tabScreens.barcode.card.qrModalCloseLabel')}
                        </Text>
                      </Button>
                    </YStack>
                  </YStack>
                </YStack>
              </YStack>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog>
      ) : null}
    </>
  )
}
