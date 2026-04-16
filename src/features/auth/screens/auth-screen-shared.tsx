import { useWindowDimensions } from 'react-native'
import type { TFunction } from 'i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Paragraph, SizableText, Text, XStack, YStack, useTheme } from 'tamagui'
import AppLogo from '@/assets/images/logo.svg'
import { useAppPreferences } from '@/hooks/useAppPreferences'

export function getUnlockErrorMessage(
  reason: 'cancelled' | 'failed' | 'not-available' | 'not-enrolled',
  t: TFunction<'app'>,
) {
  if (reason === 'not-available') {
    return t('auth.lock.notAvailableError')
  }

  if (reason === 'not-enrolled') {
    return t('auth.lock.notEnrolledError')
  }

  if (reason === 'cancelled') {
    return t('auth.lock.cancelledError')
  }

  return t('auth.lock.failedError')
}

export function getPinUnlockErrorMessage(
  reason: 'failed' | 'invalid-pin' | 'not-configured' | 'too-many-attempts',
  t: TFunction<'app'>,
) {
  if (reason === 'invalid-pin') {
    return t('auth.lock.invalidPinError')
  }

  if (reason === 'not-configured') {
    return t('auth.lock.pinNotConfiguredError')
  }

  if (reason === 'too-many-attempts') {
    return t('auth.lock.tooManyPinAttemptsError')
  }

  return t('auth.lock.pinFailedError')
}

export function useAuthSurfaceMetrics() {
  const theme = useTheme()
  const { resolvedTheme } = useAppPreferences()
  const insets = useSafeAreaInsets()
  const { fontScale, width } = useWindowDimensions()
  const prefersExpandedTextLayout = fontScale > 1.15
  const isCompactWidth = width < 360 || prefersExpandedTextLayout

  return {
    heroLogoColor:
      resolvedTheme === 'dark' ? theme.accent10.val : theme.color12.val,
    heroLogoSize: isCompactWidth ? 88 : 104,
    heroTitleFontSize: isCompactWidth ? 40 : 56,
    insets,
    prefersExpandedTextLayout,
    subtitleMaxWidth: Math.max(Math.min(width - 32, 360), 240),
  }
}

export function AuthHeader({
  description,
  heroLogoColor,
  heroLogoSize,
  heroTitleFontSize,
  prefersExpandedTextLayout,
  subtitleMaxWidth,
  titleLeading,
  titleTrailing,
}: {
  description: string
  heroLogoColor: string
  heroLogoSize: number
  heroTitleFontSize: number
  prefersExpandedTextLayout: boolean
  subtitleMaxWidth: number
  titleLeading: string
  titleTrailing: string
}) {
  return (
    <YStack gap="$6" items="center">
      <YStack items="center" justify="center" pt={8}>
        <AppLogo
          color={heroLogoColor}
          height={heroLogoSize}
          width={heroLogoSize}
        />
      </YStack>

      <YStack gap="$3" items="center">
        <XStack
          gap="$2"
          flexWrap="wrap"
          justify="center"
          style={{ maxWidth: subtitleMaxWidth }}
        >
          <Text
            fontSize={heroTitleFontSize}
            fontWeight="900"
            letterSpacing={-2}
            style={{ textAlign: 'center' }}
          >
            {titleLeading}
          </Text>
          <Text
            color="$accent10"
            fontSize={heroTitleFontSize}
            fontWeight="900"
            letterSpacing={-2}
            style={{ textAlign: 'center' }}
          >
            {titleTrailing}
          </Text>
        </XStack>

        <Paragraph
          color="$color11"
          size={prefersExpandedTextLayout ? '$7' : '$8'}
          style={{ maxWidth: subtitleMaxWidth, textAlign: 'center' }}
        >
          {description}
        </Paragraph>
      </YStack>
    </YStack>
  )
}

export function AuthActionDivider({ label }: { label: string }) {
  return (
    <XStack gap="$3" items="center">
      <YStack bg="$borderColor" flex={1} height={1} />
      <SizableText
        color="$color10"
        fontSize={12}
        fontWeight="700"
        textTransform="uppercase"
      >
        {label}
      </SizableText>
      <YStack bg="$borderColor" flex={1} height={1} />
    </XStack>
  )
}
