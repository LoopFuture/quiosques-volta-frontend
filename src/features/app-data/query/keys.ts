export const appQueryKeys = {
  barcode: {
    all: ['barcode'] as const,
    screen: () => ['barcode', 'screen'] as const,
  },
  home: {
    all: ['home'] as const,
    state: () => ['home', 'state'] as const,
  },
  profile: {
    all: ['profile'] as const,
    state: () => ['profile', 'state'] as const,
  },
  wallet: {
    all: ['wallet'] as const,
    history: () => ['wallet', 'history'] as const,
    movement: (movementId: string) =>
      ['wallet', 'movement', movementId] as const,
    overview: () => ['wallet', 'overview'] as const,
    transfer: () => ['wallet', 'transfer'] as const,
  },
} as const

export const appMutationKeys = {
  profile: {
    completeSetup: () => ['profile', 'complete-setup'] as const,
    updatePayments: () => ['profile', 'update-payments'] as const,
    updatePersonal: () => ['profile', 'update-personal'] as const,
    updatePreferences: () => ['profile', 'update-preferences'] as const,
  },
  wallet: {
    requestTransfer: () => ['wallet', 'request-transfer'] as const,
  },
} as const
