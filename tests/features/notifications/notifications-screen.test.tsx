import { act, fireEvent, screen, waitFor } from '@testing-library/react-native'
import { Pressable, Text } from 'react-native'
import { http, HttpResponse } from 'msw'
import * as mockApi from '@/features/app-data/mock'
import { MOCK_API_ORIGIN } from '@/features/app-data/api'
import { mockApiServer } from '@/features/app-data/mock/server.node'
import NotificationsScreen from '@/app/notifications'
import { useAppPreferences } from '@/hooks/useAppPreferences'
import { renderWithProvider, resolveMockApi } from '../../support/test-utils'

const mockShowToast = jest.fn()

jest.mock('expo-router', () => {
  const { createExpoRouterMock } = jest.requireActual(
    '../../support/expo-router-mock',
  )

  return createExpoRouterMock()
})

jest.mock('@tamagui/toast', () => {
  const { createTamaguiToastMock } = jest.requireActual(
    '../../support/tamagui-toast-mock',
  )

  return createTamaguiToastMock({
    getShowToast: () => mockShowToast,
  })
})

const { __mockRouterPush: mockRouterPush } = jest.requireMock('expo-router')

function SwitchNotificationsLanguageButton() {
  const { setLanguageMode } = useAppPreferences()

  return (
    <Pressable onPress={() => setLanguageMode('en')}>
      <Text>Switch notifications language</Text>
    </Pressable>
  )
}

describe('notifications screen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
    jest.useRealTimers()
  })

  it('renders the seeded notifications and bulk actions', async () => {
    renderWithProvider(<NotificationsScreen />)

    expect(screen.getByTestId('notifications-screen-skeleton')).toBeTruthy()

    await resolveMockApi()

    expect(screen.getByTestId('notifications-screen')).toBeTruthy()
    expect(screen.getByText('Notificações')).toBeTruthy()
    expect(screen.getByText('Marcar tudo como lido')).toBeTruthy()
    expect(screen.getByText('Limpar tudo')).toBeTruthy()
    expect(screen.getByText('Transfer update')).toBeTruthy()
    expect(screen.getByLabelText('Transfer update, Não lida')).toBeTruthy()
    expect(screen.getByLabelText('Security reminder, Lida')).toBeTruthy()
  })

  it('marks a notification as read and routes to its destination', async () => {
    renderWithProvider(<NotificationsScreen />)

    await resolveMockApi()

    fireEvent.press(screen.getByLabelText('Transfer update, Não lida'))

    await resolveMockApi(2)

    expect(mockRouterPush).toHaveBeenCalledWith({
      params: { movementId: '22222222-2222-4222-8222-222222222222' },
      pathname: '/wallet/[movementId]',
    })
    expect(screen.getByLabelText('Transfer update, Lida')).toBeTruthy()
    expect(screen.queryByLabelText('Transfer update, Não lida')).toBeNull()
  })

  it('marks every unread notification as read', async () => {
    renderWithProvider(<NotificationsScreen />)

    await resolveMockApi()

    fireEvent.press(screen.getByText('Marcar tudo como lido'))

    await resolveMockApi(2)

    expect(screen.queryByText('Nova')).toBeNull()
    expect(screen.getByLabelText('Credit added, Lida')).toBeTruthy()
    expect(screen.getByLabelText('Transfer update, Lida')).toBeTruthy()
    expect(mockShowToast).toHaveBeenCalledWith(
      'Marcar tudo como lido',
      expect.objectContaining({
        duration: 3500,
        message: 'As notificações foram marcadas como lidas.',
        variant: 'success',
      }),
    )
  })

  it('clears the notifications list', async () => {
    renderWithProvider(<NotificationsScreen />)

    await resolveMockApi()

    fireEvent.press(screen.getByText('Limpar tudo'))

    await resolveMockApi(2)

    expect(screen.getByText('Ainda não tens alertas')).toBeTruthy()
    expect(
      screen.getByText(
        'Quando houver crédito, transferências ou avisos da conta, mostramos aqui.',
      ),
    ).toBeTruthy()
    expect(screen.queryByText('Transfer update')).toBeNull()
    expect(mockShowToast).toHaveBeenCalledWith(
      'Limpar tudo',
      expect.objectContaining({
        duration: 3500,
        message: 'As notificações foram removidas.',
        variant: 'success',
      }),
    )
  })

  it('retranslates notification content when the app language changes', async () => {
    renderWithProvider(
      <>
        <NotificationsScreen />
        <SwitchNotificationsLanguageButton />
      </>,
    )

    await resolveMockApi()

    fireEvent.press(screen.getByLabelText('Transfer update, Não lida'))
    await resolveMockApi(2)
    fireEvent.press(screen.getByText('Switch notifications language'))

    await resolveMockApi()

    expect(screen.getByText('Notifications')).toBeTruthy()
    expect(screen.getByText('Transfer update')).toBeTruthy()
    expect(screen.getByLabelText('Transfer update, Read')).toBeTruthy()
    expect(screen.queryByText('Transferência em processamento')).toBeNull()
  })

  it('refreshes the list when new mock data arrives', async () => {
    renderWithProvider(<NotificationsScreen />)

    await resolveMockApi()
    const clearNotifications = mockApi.clearMockNotifications()

    await resolveMockApi()
    await clearNotifications

    expect(screen.queryByText('Não tens notificações')).toBeNull()

    await act(async () => {
      screen.getByTestId('notifications-list').props.onRefresh()
      await Promise.resolve()
    })

    expect(screen.getByTestId('notifications-list').props.refreshing).toBe(true)
    expect(
      screen.getByTestId('notifications-list').props.refreshControl.props
        .refreshing,
    ).toBe(true)

    await resolveMockApi(2)

    expect(screen.getByText('Ainda não tens alertas')).toBeTruthy()
  })

  it('loads more notifications when the list reaches the end', async () => {
    mockApiServer.use(
      http.get(`${MOCK_API_ORIGIN}/notifications`, ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor')

        if (cursor === '2') {
          return HttpResponse.json({
            items: [
              {
                body: 'Review your account security settings.',
                createdAt: '2026-03-14T11:10:00Z',
                id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
                read: true,
                relatedResourceId: null,
                title: 'Security reminder',
                type: 'system',
              },
            ],
            pageInfo: {
              hasNextPage: false,
              nextCursor: null,
            },
            unreadCount: 2,
          })
        }

        return HttpResponse.json({
          items: [
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
          ],
          pageInfo: {
            hasNextPage: true,
            nextCursor: '2',
          },
          unreadCount: 2,
        })
      }),
    )

    renderWithProvider(<NotificationsScreen />)

    await resolveMockApi()

    expect(screen.queryByText('Security reminder')).toBeNull()

    await act(async () => {
      screen.getByTestId('notifications-list').props.onEndReached()
      await Promise.resolve()
    })

    await resolveMockApi(2)

    expect(screen.getByText('Security reminder')).toBeTruthy()
  })

  it('shows a retry state when the notifications query fails', async () => {
    let hasFailed = false

    mockApiServer.use(
      http.get(`${MOCK_API_ORIGIN}/notifications`, async () =>
        hasFailed
          ? HttpResponse.json(await mockApi.getMockNotificationsState())
          : (() => {
              hasFailed = true

              return HttpResponse.json(
                {
                  message: 'notifications failed',
                },
                {
                  status: 500,
                },
              )
            })(),
      ),
    )

    renderWithProvider(<NotificationsScreen />)

    await resolveMockApi(2)

    expect(screen.getByTestId('notifications-screen-error-state')).toBeTruthy()
    expect(screen.getByText('Alertas indisponíveis')).toBeTruthy()

    fireEvent.press(screen.getByText('Tentar novamente'))

    await resolveMockApi(2)

    await waitFor(() => {
      expect(screen.getByTestId('notifications-list')).toBeTruthy()
    })
  })

  it('restores notification state when an optimistic mutation fails', async () => {
    mockApiServer.use(
      http.post(`${MOCK_API_ORIGIN}/notifications/read`, () =>
        HttpResponse.json(
          {
            message: 'mark all failed',
          },
          {
            status: 500,
          },
        ),
      ),
    )

    renderWithProvider(<NotificationsScreen />)

    await resolveMockApi()
    fireEvent.press(screen.getByText('Marcar tudo como lido'))

    await resolveMockApi(2)

    expect(screen.getByLabelText('Transfer update, Não lida')).toBeTruthy()
    expect(screen.getAllByText('Nova').length).toBeGreaterThan(0)
    expect(mockShowToast).toHaveBeenCalledWith(
      'Marcar tudo como lido',
      expect.objectContaining({
        duration: 5000,
        message: 'Não foi possível marcar as notificações agora.',
        variant: 'error',
      }),
    )
  })
})
