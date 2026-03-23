import { setupServer } from 'msw/native'
import { mockApiHandlers } from './handlers'

export const nativeMockApiServer = setupServer(...mockApiHandlers)
