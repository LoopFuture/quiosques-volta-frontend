import { http, HttpResponse } from 'msw'
import { z } from 'zod/v4'
import { MOCK_API_ORIGIN } from '@/features/app-data/api'
import { profilePatchRequestSchema } from '@/features/profile/models'
import { walletTransferRequestSchema } from '@/features/wallet/forms'
import {
  markNotificationsReadRequestSchema,
  upsertPushInstallationRequestSchema,
} from '@/features/notifications/models'
import {
  clearMockNotifications,
  deleteMockPushInstallation,
  getMockBarcodeScreenState,
  getMockHomeScreenState,
  getMockMapScreenSnapshot,
  getMockNotificationsState,
  getMockProfileState,
  getMockWalletHistoryState,
  getMockWalletMovementDetailState,
  getMockWalletOverviewState,
  markMockNotificationsRead,
  patchMockProfile,
  requestMockWalletTransfer,
  upsertMockPushInstallation,
} from './index'

function getMockApiUrl(path: string) {
  return new URL(path, MOCK_API_ORIGIN).toString()
}

const walletTransactionFilterSchema = z.object({
  cursor: z.string().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
})

const notificationFilterSchema = z.object({
  cursor: z.string().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  status: z.string().optional(),
})

export const mockApiHandlers = [
  http.get(getMockApiUrl('/home'), async () =>
    HttpResponse.json(await getMockHomeScreenState()),
  ),
  http.get(getMockApiUrl('/profile'), async () =>
    HttpResponse.json(await getMockProfileState()),
  ),
  http.patch(getMockApiUrl('/profile'), async ({ request }) =>
    HttpResponse.json(
      await patchMockProfile(
        profilePatchRequestSchema.parse(await request.json()),
      ),
    ),
  ),
  http.get(getMockApiUrl('/wallet'), async () =>
    HttpResponse.json(await getMockWalletOverviewState()),
  ),
  http.get(getMockApiUrl('/wallet/transactions'), async ({ request }) => {
    const query = walletTransactionFilterSchema.parse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    )

    return HttpResponse.json(
      await getMockWalletHistoryState({
        cursor: query.cursor,
        pageSize: query.pageSize,
      }),
    )
  }),
  http.get(
    getMockApiUrl('/wallet/transactions/:transactionId'),
    async ({ params }) =>
      HttpResponse.json(
        await getMockWalletMovementDetailState(String(params.transactionId)),
      ),
  ),
  http.post(getMockApiUrl('/wallet/transfers'), async ({ request }) =>
    HttpResponse.json(
      await requestMockWalletTransfer(
        walletTransferRequestSchema.parse(await request.json()),
      ),
      {
        status: 202,
      },
    ),
  ),
  http.get(getMockApiUrl('/notifications'), async ({ request }) => {
    const query = notificationFilterSchema.parse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    )

    return HttpResponse.json(
      await getMockNotificationsState({
        cursor: query.cursor,
        pageSize: query.pageSize,
      }),
    )
  }),
  http.post(getMockApiUrl('/notifications/read'), async ({ request }) =>
    HttpResponse.json(
      await markMockNotificationsRead(
        markNotificationsReadRequestSchema.parse(await request.json()),
      ),
    ),
  ),
  http.delete(getMockApiUrl('/notifications'), async () =>
    HttpResponse.json(await clearMockNotifications()),
  ),
  http.get(getMockApiUrl('/barcode'), async () =>
    HttpResponse.json(await getMockBarcodeScreenState()),
  ),
  http.get(getMockApiUrl('/v1/locations/collection-points'), async () =>
    HttpResponse.json(await getMockMapScreenSnapshot()),
  ),
  http.put(
    getMockApiUrl('/push/installations/:installationId'),
    async ({ params, request }) =>
      HttpResponse.json(
        await upsertMockPushInstallation({
          installationId: String(params.installationId),
          request: upsertPushInstallationRequestSchema.parse(
            await request.json(),
          ),
        }),
      ),
  ),
  http.delete(
    getMockApiUrl('/push/installations/:installationId'),
    async ({ params }) => {
      await deleteMockPushInstallation(String(params.installationId))

      return new HttpResponse(null, {
        status: 204,
      })
    },
  ),
]
