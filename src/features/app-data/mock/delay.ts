export const MOCK_API_DELAY_MS = 250

export function waitForMockApi(delayMs = MOCK_API_DELAY_MS) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, delayMs)
  })
}
