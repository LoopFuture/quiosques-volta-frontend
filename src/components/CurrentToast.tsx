import {
  CheckCircle2,
  CircleAlert,
  FlaskConical,
  Info,
  X,
} from '@tamagui/lucide-icons'
import { Toast, useToastState } from '@tamagui/toast'
import { XStack, YStack, useThemeName } from 'tamagui'
import { getPlatformShadowProps } from '@/components/ui/platformShadows'
import { ToneScope } from '@/components/ui/tone'
import { useNeutralBorderColor } from '@/components/ui/useNeutralBorderColor'
import {
  getAppToastTone,
  getAppToastVariant,
  type AppToastVariant,
} from '@/features/app-shell/toast'

function getToastIcon(variant: AppToastVariant) {
  switch (variant) {
    case 'error':
      return CircleAlert
    case 'hint':
      return Info
    case 'mock':
      return FlaskConical
    case 'success':
    default:
      return CheckCircle2
  }
}

type ActiveToast = Exclude<ReturnType<typeof useToastState>, null>

function ActiveToastCard({ currentToast }: { currentToast: ActiveToast }) {
  const themeName = useThemeName()
  const neutralBorderColor = useNeutralBorderColor()

  const variant = getAppToastVariant(currentToast.variant)
  const tone = getAppToastTone(variant)
  const isDarkTheme = themeName.startsWith('dark')
  const shadowProps = getPlatformShadowProps('surface', isDarkTheme)
  const Icon = getToastIcon(variant)

  return (
    <ToneScope tone={tone}>
      <Toast
        key={currentToast.id}
        bg="$background"
        borderColor={tone === 'neutral' ? neutralBorderColor : '$borderColor'}
        borderWidth={1}
        duration={currentToast.duration}
        enterStyle={{ opacity: 0, y: -12 }}
        exitStyle={{ opacity: 0, y: -8 }}
        px="$4"
        py="$3.5"
        rounded={28}
        style={{ alignSelf: 'stretch', minWidth: '100%', width: '100%' }}
        viewportName={currentToast.viewportName}
        {...shadowProps}
      >
        <Toast.Close
          bg="transparent"
          borderColor="transparent"
          p="$1"
          position="absolute"
          rounded={999}
          right="$2.5"
          top="$2.5"
          zIndex={1}
        >
          <X color="$color10" size={16} />
        </Toast.Close>

        <XStack gap="$3" items="flex-start" pr="$6">
          <YStack
            bg="$backgroundFocus"
            borderColor="$borderColor"
            borderWidth={1}
            items="center"
            justify="center"
            mt="$0.5"
            rounded={999}
            style={{ flexShrink: 0 }}
            width={36}
            height={36}
          >
            <Icon
              color={tone === 'neutral' ? '$color11' : '$color'}
              size={18}
            />
          </YStack>

          <YStack flex={1} gap="$1.5" style={{ minWidth: 0 }}>
            <Toast.Title
              fontSize={16}
              fontWeight="800"
              lineHeight={20}
              style={{ textAlign: 'left' }}
            >
              {currentToast.title}
            </Toast.Title>
            {!!currentToast.message && (
              <Toast.Description
                color="$color11"
                fontSize={14}
                lineHeight={20}
                style={{ textAlign: 'left' }}
              >
                {currentToast.message}
              </Toast.Description>
            )}
          </YStack>
        </XStack>
      </Toast>
    </ToneScope>
  )
}

export function CurrentToast() {
  const currentToast = useToastState()

  if (!currentToast || currentToast.isHandledNatively) return null

  return <ActiveToastCard currentToast={currentToast} />
}
