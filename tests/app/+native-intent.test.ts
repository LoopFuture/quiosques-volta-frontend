import { redirectSystemPath } from '@/app/+native-intent'

describe('native intent redirects', () => {
  it('rewrites the Keycloak callback deep link to the auth route', () => {
    expect(
      redirectSystemPath({
        initial: false,
        path: 'voltafrontend://auth/callback?code=login-code&state=opaque',
      }),
    ).toBe('/auth?code=login-code&state=opaque')
  })

  it('leaves unrelated app routes unchanged', () => {
    expect(
      redirectSystemPath({
        initial: false,
        path: '/wallet',
      }),
    ).toBe('/wallet')
  })

  it('returns the original path when the native event path is empty or invalid', () => {
    expect(
      redirectSystemPath({
        initial: false,
        path: null,
      }),
    ).toBeNull()

    expect(
      redirectSystemPath({
        initial: false,
        path: 'voltafrontend://%',
      }),
    ).toBe('voltafrontend://%')

    expect(
      redirectSystemPath({
        initial: false,
        path: '%%%',
      }),
    ).toBe('%%%')
  })
})
