import { useTranslation } from 'react-i18next'
import { YStack } from 'tamagui'
import { QueryErrorState, SkeletonBlock, SurfaceCard } from '@/components/ui'
import { ProfileHeroCard } from '../components/ProfileHeroCard'
import { ProfileDetailScreenFrame } from '../components/ProfileDetailScreenFrame'
import { ProfileSummaryTotalsCard } from '../components/ProfileSummaryTotalsCard'
import { useProfileQuery } from '../hooks'
import { getProfileSummarySections } from '../presentation'

function ProfileSummarySkeleton() {
  return (
    <YStack gap="$4" testID="profile-summary-screen-skeleton">
      <SurfaceCard gap="$4" p="$5" tone="accent">
        <YStack gap="$2">
          <SkeletonBlock height={16} width="34%" />
          <SkeletonBlock height={14} width="82%" />
        </YStack>
        <YStack borderColor="$borderColor" borderTopWidth={1} gap="$3" pt="$4">
          <SkeletonBlock height={24} width="100%" />
          <SkeletonBlock height={20} width="100%" />
          <SkeletonBlock height={16} width="70%" />
          <SkeletonBlock height={20} width="100%" />
          <SkeletonBlock height={20} width="100%" />
        </YStack>
      </SurfaceCard>
      <SurfaceCard gap="$3.5" p="$4.5">
        <YStack gap="$1.5">
          <SkeletonBlock height={20} width="28%" />
          <SkeletonBlock height={14} width="72%" />
        </YStack>
        <YStack gap="$2">
          {Array.from({ length: 3 }).map((_, index) => (
            <YStack
              key={`profile-summary-totals-skeleton-${index}`}
              gap="$2"
              py="$2.5"
            >
              <SkeletonBlock height={14} width={index === 0 ? '34%' : '46%'} />
              <SkeletonBlock height={20} width={index === 1 ? '18%' : '24%'} />
              {index === 1 ? <SkeletonBlock height={12} width="78%" /> : null}
            </YStack>
          ))}
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
            headlineLabel={summarySections.hero.headlineLabel}
            headlineValue={summarySections.hero.headlineValue}
            supportingText={summarySections.hero.supportingText}
            title={summarySections.hero.title}
          />
          <ProfileSummaryTotalsCard
            description={summarySections.totals.description}
            stats={summarySections.totals.stats}
            title={summarySections.totals.title}
          />
        </YStack>
      )}
    </ProfileDetailScreenFrame>
  )
}
