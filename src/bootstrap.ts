import 'react-native-url-polyfill/auto'
import 'web-streams-polyfill/polyfill'
import {
  initializeMonitoring,
  recordDiagnosticEvent,
} from '@/features/app-data/monitoring'
import { initializeMockApiServer } from '@/features/app-data/mock/bootstrap'

initializeMonitoring()

try {
  initializeMockApiServer()
} catch (error) {
  recordDiagnosticEvent({
    captureError: true,
    domain: 'api',
    error,
    operation: 'mock-api-server',
    phase: 'bootstrap',
    status: 'error',
  })

  throw error
}
