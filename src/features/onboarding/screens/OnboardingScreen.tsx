import { useRef, useState } from 'react'
import {
  Animated,
  type FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  useWindowDimensions,
} from 'react-native'
import { MapPinned, QrCode, Recycle, Wallet } from '@tamagui/lucide-icons'
import type { TFunction } from 'i18next'
import { Button, Paragraph, Text, XStack, YStack } from 'tamagui'
import {
  PrimaryButton,
  ScreenContainer,
  StepProgress,
  SurfaceCard,
} from '@/components/ui'
import { StackTopBar } from '@/features/app-shell/navigation/tab-header'
import { useTranslation } from 'react-i18next'
import { type OnboardingSlide, type OnboardingSlideIconKey } from '../models'

type OnboardingScreenProps = {
  backLabel?: string
  onBackPress?: () => void
  onComplete: () => void
  title?: string
  variant?: 'full' | 'review'
}

const slideIconMap: Record<OnboardingSlideIconKey, unknown> = {
  barcode: QrCode,
  map: MapPinned,
  returns: Recycle,
  wallet: Wallet,
}

function getOnboardingSlides(t: TFunction): OnboardingSlide[] {
  return [
    {
      description: t('onboarding.slides.map.description'),
      detail: t('onboarding.slides.map.detail'),
      eyebrow: t('onboarding.slides.map.eyebrow'),
      iconKey: 'map',
      id: 'map',
      title: t('onboarding.slides.map.title'),
    },
    {
      description: t('onboarding.slides.machine.description'),
      detail: t('onboarding.slides.machine.detail'),
      eyebrow: t('onboarding.slides.machine.eyebrow'),
      iconKey: 'barcode',
      id: 'machine',
      title: t('onboarding.slides.machine.title'),
    },
    {
      description: t('onboarding.slides.purpose.description'),
      detail: t('onboarding.slides.purpose.detail'),
      eyebrow: t('onboarding.slides.purpose.eyebrow'),
      iconKey: 'returns',
      id: 'purpose',
      title: t('onboarding.slides.purpose.title'),
    },
    {
      description: t('onboarding.slides.wallet.description'),
      detail: t('onboarding.slides.wallet.detail'),
      eyebrow: t('onboarding.slides.wallet.eyebrow'),
      iconKey: 'wallet',
      id: 'wallet',
      title: t('onboarding.slides.wallet.title'),
    },
  ]
}

function OnboardingSlideCard({
  index,
  isCompactWidth,
  scrollX,
  slide,
  stretchToFill,
  width,
}: {
  index: number
  isCompactWidth: boolean
  scrollX: Animated.Value
  slide: OnboardingSlide
  stretchToFill: boolean
  width: number
}) {
  const Icon = slideIconMap[slide.iconKey] as typeof QrCode
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width]
  const opacity = scrollX.interpolate({
    extrapolate: 'clamp',
    inputRange,
    outputRange: [0.35, 1, 0.35],
  })
  const scale = scrollX.interpolate({
    extrapolate: 'clamp',
    inputRange,
    outputRange: [0.94, 1, 0.94],
  })

  return (
    <YStack
      flex={stretchToFill ? 1 : undefined}
      height={stretchToFill ? '100%' : undefined}
      px="$4"
      width={width}
    >
      <Animated.View
        style={{
          flex: stretchToFill ? 1 : undefined,
          height: stretchToFill ? '100%' : undefined,
          opacity,
          transform: [{ scale }],
        }}
      >
        <SurfaceCard
          flex={stretchToFill ? 1 : undefined}
          height={stretchToFill ? '100%' : undefined}
          justify="space-between"
          minHeight={stretchToFill ? undefined : 320}
          p="$5"
          testID={`onboarding-slide-${slide.id}`}
        >
          <YStack flex={1} gap="$4">
            <XStack items="flex-start" justify="space-between" gap="$4">
              <YStack flex={1} gap="$3">
                <YStack
                  bg="$accent3"
                  px="$3"
                  py="$2"
                  rounded={999}
                  self="flex-start"
                >
                  <Text
                    color="$accent11"
                    fontSize={12}
                    fontWeight="800"
                    letterSpacing={0.4}
                    textTransform="uppercase"
                  >
                    {slide.eyebrow}
                  </Text>
                </YStack>

                <Text
                  accessibilityRole="header"
                  color="$color12"
                  fontSize={isCompactWidth ? 22 : 24}
                  fontWeight="900"
                  letterSpacing={-0.2}
                  lineHeight={isCompactWidth ? 27 : 29}
                  style={{ maxWidth: '96%' }}
                >
                  {slide.title}
                </Text>
              </YStack>

              <YStack
                bg="$accent2"
                borderColor="$accent6"
                borderWidth={1}
                height={56}
                items="center"
                justify="center"
                rounded={18}
                width={56}
              >
                <Icon color="$accent10" size={24} />
              </YStack>
            </XStack>

            <Paragraph color="$color11" fontSize={18} lineHeight={26}>
              {slide.description}
            </Paragraph>

            <XStack gap="$3" items="flex-start">
              <YStack
                bg="$accent9"
                height={8}
                mt="$2"
                rounded={999}
                width={8}
              />
              <Paragraph
                color="$accent11"
                flex={1}
                fontSize={15}
                lineHeight={21}
              >
                {slide.detail}
              </Paragraph>
            </XStack>
          </YStack>
        </SurfaceCard>
      </Animated.View>
    </YStack>
  )
}

export default function OnboardingScreen({
  backLabel,
  onBackPress,
  onComplete,
  title,
  variant = 'full',
}: OnboardingScreenProps) {
  const { t } = useTranslation()
  const slides = getOnboardingSlides(t)
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null)
  const scrollX = useRef(new Animated.Value(0)).current
  const [activeIndex, setActiveIndex] = useState(0)
  const { width } = useWindowDimensions()
  const pageWidth = Math.max(width, 1)
  const isCompactWidth = width < 360
  const isLastSlide = activeIndex === slides.length - 1
  const isReviewMode = variant === 'review'
  const footerHelper = isLastSlide
    ? isReviewMode
      ? t('onboarding.actions.closeHelper')
      : t('onboarding.actions.finishHelper')
    : t('onboarding.actions.progressHelper')

  function handleScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = Math.round(
      event.nativeEvent.contentOffset.x /
        Math.max(event.nativeEvent.layoutMeasurement.width, 1),
    )

    setActiveIndex(Math.max(0, Math.min(nextIndex, slides.length - 1)))
  }

  function handleNext() {
    if (isLastSlide) {
      onComplete()
      return
    }

    const nextIndex = activeIndex + 1

    setActiveIndex(nextIndex)
    flatListRef.current?.scrollToOffset?.({
      animated: true,
      offset: nextIndex * pageWidth,
    })
  }

  const footerContent = (
    <YStack gap="$2" pt="$4">
      <Paragraph
        color="$color10"
        fontSize={13}
        lineHeight={18}
        style={{ textAlign: 'center' }}
      >
        {footerHelper}
      </Paragraph>
      <PrimaryButton
        onPress={handleNext}
        testID={
          isLastSlide
            ? isReviewMode
              ? 'onboarding-close-button'
              : 'onboarding-get-started-button'
            : 'onboarding-next-button'
        }
      >
        {isLastSlide
          ? isReviewMode
            ? t('onboarding.actions.closeLabel')
            : t('onboarding.actions.getStartedLabel')
          : t('onboarding.actions.nextLabel')}
      </PrimaryButton>
      {!isReviewMode ? (
        <Button
          chromeless
          onPress={onComplete}
          pressStyle={{ opacity: 0.7 }}
          testID="onboarding-later-button"
        >
          <Button.Text color="$color10" fontWeight="700">
            {t('onboarding.actions.laterLabel')}
          </Button.Text>
        </Button>
      ) : null}
    </YStack>
  )

  return (
    <ScreenContainer
      bottomInset
      decorativeBackground={false}
      header={
        backLabel && onBackPress && title ? (
          <StackTopBar
            backLabel={backLabel}
            onBackPress={onBackPress}
            title={title}
          />
        ) : undefined
      }
      contentProps={{
        gap: '$3',
        px: '$0',
        pb: '$4',
        pt: '$3',
      }}
      footer={footerContent}
      scrollable
      testID="onboarding-screen"
    >
      <YStack gap="$4" px="$4">
        <Text
          color="$color10"
          fontSize={13}
          fontWeight="800"
          letterSpacing={0.5}
          textTransform="uppercase"
        >
          {t('onboarding.eyebrow')}
        </Text>
        <YStack gap="$2.5">
          <Text
            accessibilityRole="header"
            color="$color12"
            fontSize={isCompactWidth ? 30 : 34}
            fontWeight="900"
            letterSpacing={-0.4}
            lineHeight={isCompactWidth ? 34 : 38}
            style={{ maxWidth: '92%' }}
          >
            {t('onboarding.title')}
          </Text>
          <Paragraph
            color="$color11"
            fontSize={17}
            lineHeight={24}
            style={{ maxWidth: '94%' }}
          >
            {t('onboarding.description')}
          </Paragraph>
          <Text color="$accent11" fontSize={14} fontWeight="700">
            {t('onboarding.estimate')}
          </Text>
        </YStack>
        <YStack gap="$2">
          <StepProgress
            currentStep={activeIndex + 1}
            label={t('onboarding.progressLabel')}
            totalSteps={slides.length}
            valueLabel={t('onboarding.progressValue', {
              currentStep: activeIndex + 1,
              totalSteps: slides.length,
            })}
          />
        </YStack>
      </YStack>

      <YStack>
        <Animated.FlatList
          ref={flatListRef}
          bounces={false}
          contentContainerStyle={{ flexGrow: 1 }}
          data={slides}
          getItemLayout={(_, index) => ({
            index,
            length: pageWidth,
            offset: pageWidth * index,
          })}
          horizontal
          key={pageWidth}
          keyExtractor={(slide) => slide.id}
          onMomentumScrollEnd={handleScrollEnd}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true },
          )}
          decelerationRate="fast"
          pagingEnabled
          renderItem={({ index, item }) => (
            <OnboardingSlideCard
              index={index}
              isCompactWidth={isCompactWidth}
              scrollX={scrollX}
              slide={item}
              stretchToFill={false}
              width={pageWidth}
            />
          )}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
          testID="onboarding-list"
        />
      </YStack>
    </ScreenContainer>
  )
}
