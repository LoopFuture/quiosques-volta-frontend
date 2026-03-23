export const appQueryKeys = {
  barcode: {
    all: ['barcode'] as const,
    screen: () => ['barcode', 'screen'] as const,
  },
  home: {
    all: ['home'] as const,
    state: () => ['home', 'state'] as const,
  },
  map: {
    all: ['map'] as const,
    screen: () => ['map', 'screen'] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    feed: () => ['notifications', 'feed'] as const,
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
  notifications: {
    clearAll: () => ['notifications', 'clear-all'] as const,
    markAllRead: () => ['notifications', 'mark-all-read'] as const,
    markRead: () => ['notifications', 'mark-read'] as const,
  },
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
