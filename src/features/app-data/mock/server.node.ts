import path from 'node:path'
import { mockApiHandlers } from './handlers'

const mswPackageDir = path.dirname(require.resolve('msw/package.json'))
// Jest resolves the React Native export condition for "msw/node", which is null.
// Use the package's node build directly for the test server setup.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { setupServer } = require(path.join(mswPackageDir, 'lib/node/index.js'))

export const mockApiServer = setupServer(...mockApiHandlers)
