import { MOCK_API_DELAY_MS, resetMockApiState } from '@/features/app-data/mock'
import { MOCK_API_ORIGIN } from '@/features/app-data/api'

describe('mock api handlers', () => {
  beforeEach(() => {
    resetMockApiState()
  })

  it('serves stateful notification reads and resets back to the seeded records', async () => {
    const initialNotifications = (await fetch(
      `${MOCK_API_ORIGIN}/notifications`,
    ).then((response) => response.json())) as {
      items: {
        id: string
        read: boolean
      }[]
    }

    expect(
      initialNotifications.items.some((notification) => !notification.read),
    ).toBe(true)

    await fetch(`${MOCK_API_ORIGIN}/notifications/read`, {
      body: JSON.stringify({ markAll: true }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    const readNotifications = (await fetch(
      `${MOCK_API_ORIGIN}/notifications`,
    ).then((response) => response.json())) as {
      items: {
        id: string
        read: boolean
      }[]
    }

    expect(
      readNotifications.items.every((notification) => notification.read),
    ).toBe(true)

    resetMockApiState()

    const resetNotifications = (await fetch(
      `${MOCK_API_ORIGIN}/notifications`,
    ).then((response) => response.json())) as {
      items: {
        id: string
        read: boolean
      }[]
    }

    expect(
      resetNotifications.items.some((notification) => !notification.read),
    ).toBe(true)
  })

  it('keeps responses pending until the mock delay has elapsed', async () => {
    const startedAt = Date.now()

    await fetch(`${MOCK_API_ORIGIN}/home`).then((response) => response.json())

    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(MOCK_API_DELAY_MS)
  })
})
