import {
  getProfileSetupSeedState,
  profileResponseSchema,
} from '@/features/profile/models'

const profile = profileResponseSchema.parse({
  memberSince: '2023-04-15T00:00:00.000Z',
  onboarding: {
    completedAt: null,
    status: 'in_progress',
  },
  payoutAccount: null,
  personal: {
    email: 'joao.ferreira@volta.pt',
    name: 'Joao Ferreira',
    nif: '123456789',
    phoneNumber: '+351911223344',
  },
  preferences: null,
  stats: {
    completedTransfersCount: 0,
    creditsEarned: {
      amountMinor: 0,
      currency: 'EUR',
    },
    processingTransfersCount: 0,
    returnedPackagesCount: 0,
  },
})

describe('profile setup helpers', () => {
  it('falls back to null for blank identity names when no profile name exists', () => {
    const seededProfile = getProfileSetupSeedState({
      identity: {
        email: 'blank-name@volta.pt',
        name: '   ',
      },
      profile: profileResponseSchema.parse({
        ...profile,
        personal: {
          ...profile.personal,
          name: null,
        },
      }),
    }).profile

    expect(seededProfile.personal.name).toBeNull()
  })

  it('throws when no identity or profile email is available to seed the setup state', () => {
    expect(() =>
      getProfileSetupSeedState({
        identity: {
          email: null,
          name: null,
        },
        profile: {
          ...profile,
          personal: {
            ...profile.personal,
            email: undefined,
          },
        } as never,
      }),
    ).toThrow()
  })
})
