import { useTranslation } from 'react-i18next'
import { YStack } from 'tamagui'
import { useActionToast } from '@/features/app-shell/hooks/useActionToast'
import { useAppPreferences } from '@/hooks/useAppPreferences'
import { ProfileDetailScreenFrame } from '../components/ProfileDetailScreenFrame'
import {
  PreferenceCard,
  SettingsSectionHeader,
} from '../components/ProfilePreferenceControls'
import {
  getProfileAppearanceOptions,
  getProfileLanguageOptions,
} from '../presentation'

export function ProfileAppSettingsScreen() {
  const { languageMode, setLanguageMode, setThemeMode, themeMode } =
    useAppPreferences()
  const { t } = useTranslation()
  const { showSuccess } = useActionToast()

  return (
    <ProfileDetailScreenFrame
      description={t('tabScreens.profile.appSettings.description')}
      testID="profile-app-settings-screen"
      title={t('tabScreens.profile.appSettings.title')}
    >
      <YStack gap="$4">
        <SettingsSectionHeader
          helperText={t('tabScreens.profile.appSettings.sectionHelper')}
          title={t('tabScreens.profile.appSettings.sectionTitle')}
        />

        <PreferenceCard
          description={t(
            'tabScreens.profile.appSettings.appearance.description',
          )}
          label={t('tabScreens.profile.appSettings.appearance.title')}
          onValueChange={(value) => {
            setThemeMode(value)
            showSuccess(
              t('tabScreens.profile.appSettings.appearance.title'),
              t('tabScreens.profile.appSettings.savedToast'),
            )
          }}
          options={getProfileAppearanceOptions(t)}
          value={themeMode}
        />

        <PreferenceCard
          description={t('tabScreens.profile.appSettings.language.description')}
          label={t('tabScreens.profile.appSettings.language.title')}
          onValueChange={(value) => {
            setLanguageMode(value)
            showSuccess(
              t('tabScreens.profile.appSettings.language.title'),
              t('tabScreens.profile.appSettings.savedToast'),
            )
          }}
          options={getProfileLanguageOptions(t)}
          value={languageMode}
        />
      </YStack>
    </ProfileDetailScreenFrame>
  )
}
