import type { ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { ScrollViewProps, YStackProps } from 'tamagui'
import { ScrollView, YStack, useTheme } from 'tamagui'

export type ScreenContainerProps = {
  bottomInset?: boolean
  children: ReactNode
  contentProps?: YStackProps
  decorativeBackground?: boolean
  footer?: ReactNode
  header?: ReactNode
  keyboardAware?: boolean
  onRefresh?: () => void
  refreshing?: boolean
  scrollable?: boolean
  testID?: string
}

export function ScreenContainer({
  bottomInset = false,
  children,
  contentProps,
  decorativeBackground = true,
  footer,
  header,
  keyboardAware = false,
  onRefresh,
  refreshing = false,
  scrollable = false,
  testID,
}: ScreenContainerProps) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  const content = (
    <YStack
      flex={scrollable ? undefined : 1}
      gap="$6"
      px="$4"
      pt={header ? 0 : '$4'}
      pb="$6"
      {...contentProps}
    >
      {children}
    </YStack>
  )

  const screenBody = (
    <YStack flex={1} bg="$background">
      {decorativeBackground ? (
        <>
          <YStack
            pointerEvents="none"
            position="absolute"
            rounded={120}
            bg="$accent4"
            opacity={0.12}
            style={{ top: -72, right: -64, width: 240, height: 240 }}
          />
          <YStack
            pointerEvents="none"
            position="absolute"
            rounded={100}
            bg="$accent3"
            opacity={0.1}
            style={{ bottom: 160, left: -80, width: 200, height: 200 }}
          />
        </>
      ) : null}

      {header ? (
        <YStack px="$4" pt="$3" pb="$4">
          {header}
        </YStack>
      ) : null}

      {scrollable ? (
        <ScrollView
          contentContainerStyle={scrollContentStyle}
          flex={1}
          keyboardDismissMode={
            Platform.OS === 'ios' ? 'interactive' : 'on-drag'
          }
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                onRefresh={onRefresh}
                refreshing={refreshing}
                tintColor={theme.accent10.val}
              />
            ) : undefined
          }
          showsVerticalScrollIndicator={false}
          testID={testID ? `${testID}-scroll-view` : undefined}
        >
          {content}
        </ScrollView>
      ) : (
        <YStack flex={1}>{content}</YStack>
      )}

      {footer ? (
        <YStack px="$4" pb="$4">
          {footer}
        </YStack>
      ) : null}
    </YStack>
  )

  return (
    <YStack
      flex={1}
      bg="$background"
      pb={bottomInset ? insets.bottom : 0}
      pl={insets.left}
      pr={insets.right}
      pt={insets.top}
      testID={testID}
    >
      {keyboardAware ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {screenBody}
        </KeyboardAvoidingView>
      ) : (
        screenBody
      )}
    </YStack>
  )
}

const scrollContentStyle = {
  flexGrow: 1,
} as NonNullable<ScrollViewProps['contentContainerStyle']>
