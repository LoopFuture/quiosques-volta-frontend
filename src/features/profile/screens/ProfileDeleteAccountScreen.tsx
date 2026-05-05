import { useId, useState } from 'react'
import { useRouter, type Href } from 'expo-router'
import { Check } from '@tamagui/lucide-icons'
import { useTranslation } from 'react-i18next'
import { Checkbox, Label, Text, XStack, YStack, useThemeName } from 'tamagui'
import { PrimaryButton, SurfaceCard } from '@/components/ui'
import { useAuthSession } from '@/features/auth/hooks/useAuthSession'
import { authRoutes } from '@/features/auth/routes'
import { useActionToast } from '@/features/app-shell/hooks/useActionToast'
import { brandBlack, brandWhite } from '@/themes'
import { ProfileDetailScreenFrame } from '../components/ProfileDetailScreenFrame'
import { useDeleteProfileAccountMutation } from '../hooks'

const DELETE_ACCOUNT_NOTICE_KEYS = [
  'retentionNotice',
  'transferNotice',
  'donationNotice',
  'recoveryNotice',
] as const

export function ProfileDeleteAccountScreen() {
  const router = useRouter()
  const { t } = useTranslation()
  const { showError } = useActionToast()
  const { signOut } = useAuthSession()
  const deleteAccountMutation = useDeleteProfileAccountMutation()
  const [isConfirmed, setIsConfirmed] = useState(false)
  const confirmationCheckboxId = useId()
  const themeName = useThemeName()
  const isDarkTheme = themeName.startsWith('dark')
  const uncheckedBorderColor = isDarkTheme ? '$color10' : '$color9'
  const uncheckedBackgroundColor = isDarkTheme ? '$color2' : '$background'
  const checkedBorderColor = isDarkTheme ? '$accent10' : '$accent10'
  const checkedBackgroundColor = isDarkTheme ? '$accent4' : '$accent2'
  const iconColor = isDarkTheme ? brandWhite : brandBlack

  return (
    <ProfileDetailScreenFrame
      description={t('tabScreens.profile.deleteAccount.description')}
      testID="profile-delete-account-screen"
      title={t('tabScreens.profile.deleteAccount.title')}
    >
      <YStack gap="$4">
        <SurfaceCard gap="$3" tone="error">
          <Text color="$accent11" fontSize={13} fontWeight="800">
            {t('tabScreens.profile.deleteAccount.warningLabel')}
          </Text>
          <YStack gap="$3">
            {DELETE_ACCOUNT_NOTICE_KEYS.map((noticeKey) => (
              <XStack
                key={noticeKey}
                gap="$3"
                items="flex-start"
                testID={`profile-delete-account-notice-${noticeKey}`}
              >
                <Text color="$accent11" fontSize={18} fontWeight="900">
                  •
                </Text>
                <Text color="$color" flex={1} fontSize={15} lineHeight={22}>
                  {t(`tabScreens.profile.deleteAccount.${noticeKey}`)}
                </Text>
              </XStack>
            ))}
          </YStack>
        </SurfaceCard>

        <SurfaceCard>
          <XStack gap="$3" items="center">
            <Checkbox
              bg={
                isConfirmed ? checkedBackgroundColor : uncheckedBackgroundColor
              }
              borderColor={
                isConfirmed ? checkedBorderColor : uncheckedBorderColor
              }
              borderWidth={2}
              checked={isConfirmed}
              focusStyle={{
                borderColor: '$accent8',
                outlineColor: '$accent7',
                outlineWidth: 2,
              }}
              id={confirmationCheckboxId}
              onCheckedChange={(checked) => setIsConfirmed(checked === true)}
              pressStyle={{
                background: checkedBackgroundColor,
                borderColor: checkedBorderColor,
                opacity: 0.92,
                scale: 0.98,
              }}
              rounded={14}
              size="$6"
              testID="profile-delete-account-checkbox"
            >
              <Checkbox.Indicator>
                <Check
                  color="$color"
                  size={20}
                  stroke={iconColor}
                  strokeWidth={4}
                />
              </Checkbox.Indicator>
            </Checkbox>

            <Label
              flex={1}
              fontSize={15}
              htmlFor={confirmationCheckboxId}
              lineHeight={22}
            >
              {t('tabScreens.profile.deleteAccount.confirmationLabel')}
            </Label>
          </XStack>
        </SurfaceCard>

        <PrimaryButton
          disabled={!isConfirmed}
          isPending={deleteAccountMutation.isPending}
          onPress={() => {
            deleteAccountMutation.mutate(undefined, {
              onError: () => {
                showError(
                  t('tabScreens.profile.deleteAccount.buttonLabel'),
                  t('tabScreens.profile.deleteAccount.errorToast'),
                )
              },
              onSuccess: () => {
                void (async () => {
                  await signOut()
                  router.replace(authRoutes.index as Href)
                })()
              },
            })
          }}
          testID="profile-delete-account-button"
          tone="error"
        >
          {t('tabScreens.profile.deleteAccount.buttonLabel')}
        </PrimaryButton>
      </YStack>
    </ProfileDetailScreenFrame>
  )
}
