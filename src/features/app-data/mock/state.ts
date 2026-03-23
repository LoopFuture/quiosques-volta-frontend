import { z } from 'zod/v4'
import {
  getBarcodeScreenState,
  type BarcodeResponse,
} from '@/features/barcode/models'
import {
  getProfileMockData,
  type ProfilePatchRequest,
  profilePhoneNumberSchema,
  type ProfileResponse,
} from '@/features/profile/models'
import {
  clearNotificationsResponseSchema,
  markNotificationsReadRequestSchema,
  markNotificationsReadResponseSchema,
  notificationListResponseSchema,
  pushInstallationResponseSchema,
  type ClearNotificationsResponse,
  type MarkNotificationsReadRequest,
  type MarkNotificationsReadResponse,
  type Notification,
  type NotificationListResponse,
  type PushInstallationResponse,
  type UpsertPushInstallationRequest,
} from '@/features/notifications/models'
import {
  collectionPointListResponseSchema,
  type CollectionPoint,
  type CollectionPointListResponse,
} from '@/features/map/models'
import {
  activityPreviewSchema,
  createTransferResponseSchema,
  walletResponseSchema,
  walletTransactionListResponseSchema,
  walletTransactionResponseSchema,
  walletTransactionSchema,
  type ActivityPreview,
  type CreateTransferResponse,
  type WalletResponse,
  type WalletTransaction,
  type WalletTransactionListResponse,
  type WalletTransactionResponse,
  type WalletTransferRequest,
} from '@/features/wallet/models'
import { homeResponseSchema, type HomeResponse } from '@/features/home/models'
import { notificationSchema } from '@/features/notifications/models'
import { collectionPointSchema } from '@/features/map/models'

type MockPushInstallationRecord = PushInstallationResponse & {
  token: string
}

type MockApiState = {
  barcode: BarcodeResponse
  barcodeVersion: number
  collectionPoints: CollectionPoint[]
  notifications: Notification[]
  payoutAccountInput: {
    iban: string
    spinEnabled: boolean
  }
  profile: ProfileResponse
  pushInstallations: Record<string, MockPushInstallationRecord>
  transactions: WalletTransaction[]
  walletBalanceMinor: number
}

type PaginationOptions = {
  cursor?: string
  pageSize?: number
}

const mockBarcodeTtlMs = 45_000

function createMockBarcodeResponse(version: number): BarcodeResponse {
  return getBarcodeScreenState({
    expiresAt: new Date(Date.now() + mockBarcodeTtlMs).toISOString(),
    reference: `VF-${String(version).padStart(4, '0')}-RTM-2026`,
  })
}

function hasBarcodeExpired(expiresAt: string, nowMs = Date.now()) {
  const expiresAtMs = Date.parse(expiresAt)

  return !Number.isFinite(expiresAtMs) || expiresAtMs <= nowMs
}

function maskIban(iban: string) {
  if (iban.length <= 8) {
    return iban
  }

  return `${iban.slice(0, 4)}${'*'.repeat(Math.max(0, iban.length - 9))}${iban.slice(-5)}`
}

function createSeedTransactions(
  payoutAccount: ProfileResponse['payoutAccount'],
) {
  return z.array(walletTransactionSchema).parse([
    {
      amount: {
        amountMinor: 30,
        currency: 'EUR',
      },
      creditDetails: {
        locationName: 'Pingo Doce - Afragide',
        packageCount: 6,
      },
      id: '11111111-1111-4111-8111-111111111111',
      occurredAt: '2026-03-14T14:30:00Z',
      status: 'completed',
      type: 'credit',
    },
    {
      amount: {
        amountMinor: -120,
        currency: 'EUR',
      },
      id: '22222222-2222-4222-8222-222222222222',
      occurredAt: '2026-03-14T13:10:00Z',
      status: 'processing',
      transferDetails: {
        expectedArrivalAt: '2026-03-15T13:10:00Z',
        payoutAccount,
        requestedAt: '2026-03-14T13:10:00Z',
      },
      type: 'transfer_debit',
    },
    {
      amount: {
        amountMinor: 45,
        currency: 'EUR',
      },
      creditDetails: {
        locationName: 'Lidl - Benfica',
        packageCount: 9,
      },
      id: '33333333-3333-4333-8333-333333333333',
      occurredAt: '2026-03-14T10:05:00Z',
      status: 'completed',
      type: 'credit',
    },
    {
      amount: {
        amountMinor: -200,
        currency: 'EUR',
      },
      id: '44444444-4444-4444-8444-444444444444',
      occurredAt: '2026-03-13T17:54:00Z',
      status: 'completed',
      transferDetails: {
        expectedArrivalAt: '2026-03-13T18:15:00Z',
        payoutAccount,
        requestedAt: '2026-03-13T17:54:00Z',
      },
      type: 'transfer_debit',
    },
  ])
}

function createSeedNotifications(): Notification[] {
  return z.array(notificationSchema).parse([
    {
      body: 'Your transfer is being processed.',
      createdAt: '2026-03-14T13:24:00Z',
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      read: false,
      relatedResourceId: '22222222-2222-4222-8222-222222222222',
      title: 'Transfer update',
      type: 'transfer',
    },
    {
      body: 'You received new wallet credit from Pingo Doce - Afragide.',
      createdAt: '2026-03-14T14:30:00Z',
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      read: false,
      relatedResourceId: '11111111-1111-4111-8111-111111111111',
      title: 'Credit added',
      type: 'wallet',
    },
    {
      body: 'Review your account security settings.',
      createdAt: '2026-03-14T11:10:00Z',
      id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      read: true,
      relatedResourceId: null,
      title: 'Security reminder',
      type: 'system',
    },
  ])
}

function createSeedCollectionPoints(): CollectionPoint[] {
  return z.array(collectionPointSchema).parse([
    {
      acceptedMaterials: ['plastic', 'glass', 'aluminum'],
      address: 'Centro Comercial Colombo, Lisboa',
      coordinates: {
        lat: 38.7526,
        lng: -9.1884,
      },
      id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      name: 'Colombo',
      status: 'active',
    },
    {
      acceptedMaterials: ['plastic', 'aluminum'],
      address: 'Benfica, Lisboa',
      coordinates: {
        lat: 38.7483,
        lng: -9.2026,
      },
      id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
      name: 'Benfica',
      status: 'temporarily_unavailable',
    },
  ])
}

function createDefaultMockApiState(): MockApiState {
  const baseProfile = getProfileMockData()
  const profile = {
    ...baseProfile,
    payoutAccount: {
      ...baseProfile.payoutAccount,
      spinEnabled: false,
    },
  }
  const barcodeVersion = 1

  return {
    barcode: createMockBarcodeResponse(barcodeVersion),
    barcodeVersion,
    collectionPoints: createSeedCollectionPoints(),
    notifications: createSeedNotifications(),
    payoutAccountInput: {
      iban: 'PT5000031234567890123',
      spinEnabled: false,
    },
    profile,
    pushInstallations: {},
    transactions: createSeedTransactions(profile.payoutAccount),
    walletBalanceMinor: 470,
  }
}

let mockApiState = createDefaultMockApiState()

function getUnreadNotificationsCount() {
  return mockApiState.notifications.filter((notification) => !notification.read)
    .length
}

function normalizePageSize(pageSize: number | undefined) {
  if (!pageSize || !Number.isFinite(pageSize)) {
    return 50
  }

  return Math.max(1, Math.trunc(pageSize))
}

function normalizePageOffset(cursor: string | undefined) {
  if (!cursor) {
    return 0
  }

  const parsedCursor = Number.parseInt(cursor, 10)

  if (!Number.isFinite(parsedCursor) || parsedCursor < 0) {
    return 0
  }

  return parsedCursor
}

function paginateItems<T>(items: T[], options: PaginationOptions = {}) {
  const pageSize = normalizePageSize(options.pageSize)
  const offset = normalizePageOffset(options.cursor)
  const nextOffset = offset + pageSize
  const pagedItems = items.slice(offset, nextOffset)
  const hasNextPage = nextOffset < items.length

  return {
    items: pagedItems,
    pageInfo: {
      hasNextPage,
      nextCursor: hasNextPage ? String(nextOffset) : null,
    },
  }
}

function toActivityPreview(transaction: WalletTransaction): ActivityPreview {
  return activityPreviewSchema.parse({
    amount: transaction.amount,
    id: transaction.id,
    occurredAt: transaction.occurredAt,
    status: transaction.status,
    subtitle:
      transaction.type === 'credit'
        ? `${transaction.creditDetails?.packageCount ?? 0} packages returned`
        : (transaction.transferDetails?.expectedArrivalAt ?? null),
    title:
      transaction.type === 'credit'
        ? (transaction.creditDetails?.locationName ?? 'Wallet credit')
        : 'Transfer',
    type: transaction.type,
  })
}

function syncOnboardingStatus(profile: ProfileResponse) {
  const hasCompletedSetup =
    profile.personal.name.length > 0 &&
    profile.personal.email.length > 0 &&
    profile.personal.nif.length === 9 &&
    profilePhoneNumberSchema.safeParse(profile.personal.phoneNumber).success &&
    mockApiState.payoutAccountInput.iban.length > 0

  return {
    ...profile,
    onboarding: {
      completedAt: hasCompletedSetup ? '2026-03-14T15:00:00Z' : null,
      status: hasCompletedSetup
        ? ('completed' as const)
        : ('in_progress' as const),
    },
  }
}

export function resetMockApiState() {
  mockApiState = createDefaultMockApiState()
}

export function readHomeResponse(): HomeResponse {
  return homeResponseSchema.parse({
    greeting: {
      displayName: mockApiState.profile.personal.name,
      memberSince: mockApiState.profile.memberSince,
    },
    recentActivity: mockApiState.transactions
      .slice(0, 2)
      .map(toActivityPreview),
    stats: mockApiState.profile.stats,
    transferEligibility: {
      canTransfer: mockApiState.walletBalanceMinor > 0,
      maximumTransfer: {
        amountMinor: mockApiState.walletBalanceMinor,
        currency: 'EUR',
      },
      minimumTransfer: {
        amountMinor: 1,
        currency: 'EUR',
      },
      reason:
        mockApiState.walletBalanceMinor > 0 ? null : 'Insufficient balance.',
    },
    unreadNotificationsCount: getUnreadNotificationsCount(),
    walletBalance: {
      amountMinor: mockApiState.walletBalanceMinor,
      currency: 'EUR',
    },
  })
}

export function readProfileResponse(): ProfileResponse {
  return mockApiState.profile
}

export function patchProfileResponse(
  patch: ProfilePatchRequest,
): ProfileResponse {
  if (patch.personal) {
    mockApiState.profile = {
      ...mockApiState.profile,
      personal: {
        ...mockApiState.profile.personal,
        ...patch.personal,
      },
    }
  }

  if (patch.preferences) {
    mockApiState.profile = {
      ...mockApiState.profile,
      preferences: {
        ...mockApiState.profile.preferences,
        ...patch.preferences,
      },
    }
  }

  if (patch.payoutAccount) {
    mockApiState.payoutAccountInput = patch.payoutAccount
    mockApiState.profile = {
      ...mockApiState.profile,
      payoutAccount: {
        ibanMasked: maskIban(patch.payoutAccount.iban),
        spinEnabled: patch.payoutAccount.spinEnabled,
      },
    }
    mockApiState.transactions = mockApiState.transactions.map((transaction) =>
      transaction.type === 'transfer_debit'
        ? {
            ...transaction,
            transferDetails: {
              ...transaction.transferDetails,
              payoutAccount: mockApiState.profile.payoutAccount,
              requestedAt:
                transaction.transferDetails?.requestedAt ??
                transaction.occurredAt,
            },
          }
        : transaction,
    )
  }

  mockApiState.profile = syncOnboardingStatus(mockApiState.profile)

  return mockApiState.profile
}

export function readWalletResponse(): WalletResponse {
  return walletResponseSchema.parse({
    balance: {
      amountMinor: mockApiState.walletBalanceMinor,
      currency: 'EUR',
    },
    recentTransactions: mockApiState.transactions
      .slice(0, 3)
      .map(toActivityPreview),
    stats: mockApiState.profile.stats,
    transferEligibility: {
      canTransfer: mockApiState.walletBalanceMinor > 0,
      maximumTransfer: {
        amountMinor: mockApiState.walletBalanceMinor,
        currency: 'EUR',
      },
      minimumTransfer: {
        amountMinor: 1,
        currency: 'EUR',
      },
      reason:
        mockApiState.walletBalanceMinor > 0 ? null : 'Insufficient balance.',
    },
  })
}

export function readWalletTransactions(
  options?: PaginationOptions,
): WalletTransactionListResponse {
  const paginatedTransactions = paginateItems(
    mockApiState.transactions,
    options,
  )

  return walletTransactionListResponseSchema.parse({
    items: paginatedTransactions.items,
    pageInfo: paginatedTransactions.pageInfo,
  })
}

export function readWalletTransaction(
  transactionId: string,
): WalletTransactionResponse {
  const transaction =
    mockApiState.transactions.find((item) => item.id === transactionId) ?? null

  if (!transaction) {
    throw new Error(`Unknown mock transaction: ${transactionId}`)
  }

  return walletTransactionResponseSchema.parse({
    transaction,
  })
}

export function createWalletTransfer(
  request: WalletTransferRequest,
): CreateTransferResponse {
  const amountMinor = request.amount.amountMinor
  const usesSpin = request.payoutRail === 'spin'
  const nextTransferId = `${mockApiState.transactions.length + 1}`.padStart(
    12,
    '0',
  )
  const transferId = `ffff${nextTransferId.slice(0, 4)}-ffff-4fff-8fff-${nextTransferId}`
  const occurredAt = '2026-03-14T15:00:00Z'

  mockApiState.walletBalanceMinor = Math.max(
    0,
    mockApiState.walletBalanceMinor - amountMinor,
  )
  mockApiState.transactions = [
    walletTransactionSchema.parse({
      amount: {
        amountMinor: -amountMinor,
        currency: 'EUR',
      },
      id: transferId,
      occurredAt,
      status: 'processing',
      transferDetails: {
        expectedArrivalAt: '2026-03-15T15:00:00Z',
        payoutAccount: {
          ...mockApiState.profile.payoutAccount,
          spinEnabled: usesSpin,
        },
        requestedAt: occurredAt,
      },
      type: 'transfer_debit',
    }),
    ...mockApiState.transactions,
  ]
  mockApiState.profile = {
    ...mockApiState.profile,
    stats: {
      ...mockApiState.profile.stats,
      processingTransfersCount:
        mockApiState.profile.stats.processingTransfersCount + 1,
    },
  }

  return createTransferResponseSchema.parse({
    balanceAfter: {
      amountMinor: mockApiState.walletBalanceMinor,
      currency: 'EUR',
    },
    createdAt: occurredAt,
    status: 'processing',
    transferId,
  })
}

export function readNotifications(
  options?: PaginationOptions,
): NotificationListResponse {
  const paginatedNotifications = paginateItems(
    mockApiState.notifications,
    options,
  )

  return notificationListResponseSchema.parse({
    items: paginatedNotifications.items,
    pageInfo: paginatedNotifications.pageInfo,
    unreadCount: getUnreadNotificationsCount(),
  })
}

export function markNotificationsRead(
  request: MarkNotificationsReadRequest,
): MarkNotificationsReadResponse {
  const parsedRequest = markNotificationsReadRequestSchema.parse(request)

  mockApiState.notifications = mockApiState.notifications.map((notification) =>
    'markAll' in parsedRequest
      ? {
          ...notification,
          read: true,
        }
      : parsedRequest.ids.includes(notification.id)
        ? {
            ...notification,
            read: true,
          }
        : notification,
  )

  return markNotificationsReadResponseSchema.parse({
    unreadCount: getUnreadNotificationsCount(),
  })
}

export function clearNotifications(): ClearNotificationsResponse {
  const clearedCount = mockApiState.notifications.length
  mockApiState.notifications = []

  return clearNotificationsResponseSchema.parse({
    clearedCount,
    unreadCount: 0,
  })
}

export function readBarcodeResponse() {
  if (hasBarcodeExpired(mockApiState.barcode.expiresAt)) {
    mockApiState.barcodeVersion += 1
    mockApiState.barcode = createMockBarcodeResponse(
      mockApiState.barcodeVersion,
    )
  }

  return mockApiState.barcode
}

export function readCollectionPoints(): CollectionPointListResponse {
  return collectionPointListResponseSchema.parse({
    items: mockApiState.collectionPoints,
  })
}

export function upsertPushInstallation({
  installationId,
  request,
}: {
  installationId: string
  request: UpsertPushInstallationRequest
}) {
  const timestamp = '2026-03-14T15:00:00Z'
  const existingInstallation = mockApiState.pushInstallations[installationId]

  const nextInstallation = pushInstallationResponseSchema.parse({
    appVersion: request.appVersion ?? null,
    buildNumber: request.buildNumber ?? null,
    deviceModel: request.deviceModel ?? null,
    installationId,
    platform: request.platform,
    provider: request.provider,
    registeredAt: existingInstallation?.registeredAt ?? timestamp,
    status: 'active',
    updatedAt: timestamp,
  })

  mockApiState.pushInstallations[installationId] = {
    ...nextInstallation,
    token: request.token,
  }

  return nextInstallation
}

export function deletePushInstallation(installationId: string) {
  delete mockApiState.pushInstallations[installationId]
}
