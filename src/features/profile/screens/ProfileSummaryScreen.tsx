import { useTranslation } from 'react-i18next'
import { YStack } from 'tamagui'
import { QueryErrorState, SkeletonBlock, SurfaceCard } from '@/components/ui'
import { ProfileHeroCard } from '../components/ProfileHeroCard'
import { ProfileDetailScreenFrame } from '../components/ProfileDetailScreenFrame'
import { useProfileQuery } from '../hooks'
import { getProfileSummarySections } from '../presentation'

function ProfileSummarySkeleton() {
  return (
    <YStack gap="$4" testID="profile-summary-screen-skeleton">
      <SurfaceCard gap="$4" p="$5" tone="accent">
        <YStack gap="$2">
          <SkeletonBlock height={16} width="34%" />
          <SkeletonBlock height={44} width="42%" />
          <SkeletonBlock height={14} width="48%" />
          <SkeletonBlock height={14} width="82%" />
        </YStack>
        <YStack borderColor="$borderColor" borderTopWidth={1} gap="$3" pt="$4">
          <SkeletonBlock height={22} width="100%" />
          <SkeletonBlock height={16} width="70%" />
          <SkeletonBlock height={22} width="100%" />
          <SkeletonBlock height={22} width="100%" />
        </YStack>
      </SurfaceCard>
    </YStack>
  )
}

export default function ProfileSummaryScreen() {
  const { i18n, t } = useTranslation()
  const {
    data: profile,
    isError,
    isPending,
    isRefetching,
    refetch,
  } = useProfileQuery()
  const summarySections = profile
    ? getProfileSummarySections(
        t,
        i18n.language,
        profile.stats,
        profile.memberSince,
      )
    : undefined

  const handleRefresh = () => {
    void refetch()
  }

  return (
    <ProfileDetailScreenFrame
      description={t('tabScreens.profile.summary.description')}
      onRefresh={handleRefresh}
      refreshing={isRefetching}
      testID="profile-summary-screen"
      title={t('tabScreens.profile.summary.title')}
    >
      {isError && !profile ? (
        <QueryErrorState
          onRetry={handleRefresh}
          testID="profile-summary-screen-error-state"
        />
      ) : !profile || !summarySections || isPending ? (
        <ProfileSummarySkeleton />
      ) : (
        <YStack gap="$4">
          <ProfileHeroCard
            detailStats={summarySections.hero.detailStats}
            headlineLabel={summarySections.hero.headlineLabel}
            headlineValue={summarySections.hero.headlineValue}
            supportingText={summarySections.hero.supportingText}
            title={summarySections.hero.title}
          />
        </YStack>
      )}
    </ProfileDetailScreenFrame>
  )
}
