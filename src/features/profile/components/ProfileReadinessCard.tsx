import { Check, CreditCard, LockKeyhole, Bell } from '@tamagui/lucide-icons'
import { Text, XStack, YStack } from 'tamagui'
import {
  PrimaryButton,
  StatusBadge,
  SurfaceCard,
  SurfaceSeparator,
  ToneScope,
} from '@/components/ui'
import type { Tone } from '@/components/ui'

export type ProfileReadinessItem = {
  id: string
  label: string
  tone: Tone
  value: string
}

type ProfileReadinessCardProps = {
  actions?: readonly {
    label: string
    onPress: () => void
  }[]
  badgeLabel: string
  badgeTone: Tone
  description: string
  items: ProfileReadinessItem[]
  title: string
}

function ReadinessIcon({ tone }: { tone: Tone }) {
  const iconTone = tone === 'warning' ? 'warning' : 'success'

  return (
    <ToneScope tone={iconTone}>
      <XStack
        bg="$background"
        height={36}
        items="center"
        justify="center"
        rounded={18}
        width={36}
      >
        <Check color="$color" size={18} strokeWidth={3} />
      </XStack>
    </ToneScope>
  )
}

function getItemIcon(id: string, tone: Tone) {
  const iconTone = tone === 'warning' ? 'warning' : 'accent'
  const icon =
    id === 'payments' ? (
      <CreditCard color="$color" size={16} />
    ) : id === 'security' ? (
      <LockKeyhole color="$color" size={16} />
    ) : (
      <Bell color="$color" size={16} />
    )

  return <ToneScope tone={iconTone}>{icon}</ToneScope>
}

export function ProfileReadinessCard({
  actions,
  badgeLabel,
  badgeTone,
  description,
  items,
  title,
}: ProfileReadinessCardProps) {
  return (
    <SurfaceCard gap="$4" p="$5" testID="profile-readiness-card" tone="accent">
      <YStack gap="$3">
        <StatusBadge tone={badgeTone}>{badgeLabel}</StatusBadge>
        <YStack gap="$1.5">
          <Text fontSize={26} fontWeight="900">
            {title}
          </Text>
          <Text color="$color11" fontSize={15}>
            {description}
          </Text>
        </YStack>
      </YStack>

      <YStack borderColor="$borderColor" borderWidth={1} rounded={22}>
        {items.map((item, index) => (
          <YStack key={item.id}>
            {index > 0 ? <SurfaceSeparator tone="accent" /> : null}
            <XStack gap="$3" items="center" px="$4" py="$3.5">
              <ReadinessIcon tone={item.tone} />

              <YStack flex={1} gap="$0.5" style={{ minWidth: 0 }}>
                <XStack gap="$2" items="center">
                  {getItemIcon(item.id, item.tone)}
                  <Text color="$color10" fontSize={13} fontWeight="800">
                    {item.label}
                  </Text>
                </XStack>

                <Text color="$color" fontSize={16} fontWeight="800">
                  {item.value}
                </Text>
              </YStack>
            </XStack>
          </YStack>
        ))}
      </YStack>

      {actions?.length ? (
        <YStack gap="$2">
          {actions.map((action, index) => (
            <PrimaryButton
              key={`${action.label}-${index}`}
              emphasis={index === 0 ? 'solid' : 'outline'}
              tone={index === 0 ? 'accent' : 'neutral'}
              onPress={action.onPress}
            >
              {action.label}
            </PrimaryButton>
          ))}
        </YStack>
      ) : null}
    </SurfaceCard>
  )
}
