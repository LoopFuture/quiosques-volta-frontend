import type { ReactNode } from 'react'
import { useRouter } from 'expo-router'
import { Text, YStack } from 'tamagui'
import { StackTopBar } from '@/features/app-shell/navigation/tab-header'
import { ScreenContainer } from './ScreenContainer'

export type DetailScreenFrameProps = {
  backLabel: string
  children: ReactNode
  description: string
  footer?: ReactNode
  keyboardAware?: boolean
  onRefresh?: () => void
  refreshing?: boolean
  testID: string
  title: string
}

export function DetailScreenFrame({
  backLabel,
  children,
  description,
  footer,
  keyboardAware = false,
  onRefresh,
  refreshing = false,
  testID,
  title,
}: DetailScreenFrameProps) {
  const router = useRouter()

  return (
    <ScreenContainer
      decorativeBackground={false}
      keyboardAware={keyboardAware}
      footer={footer}
      header={
        <StackTopBar
          backLabel={backLabel}
          onBackPress={() => router.back()}
          title={title}
        />
      }
      bottomInset
      scrollable
      onRefresh={onRefresh}
      refreshing={refreshing}
      testID={testID}
    >
      <YStack gap="$4">
        {description ? (
          <Text color="$color11" fontSize={14}>
            {description}
          </Text>
        ) : null}
        {children}
      </YStack>
    </ScreenContainer>
  )
}
