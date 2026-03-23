import { getAuthSessionIdentity } from '@/features/auth/models/identity'

function createJwt(payload: Record<string, unknown>) {
  const encodeSegment = (value: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(value)).toString('base64url')

  return `${encodeSegment({ alg: 'none', typ: 'JWT' })}.${encodeSegment(payload)}.`
}

describe('auth identity models', () => {
  it('prefers id token claims and falls back to access token fields that are missing', () => {
    expect(
      getAuthSessionIdentity({
        accessToken: createJwt({
          email: 'fallback@sdr.pt',
          name: 'Fallback Name',
          sub: 'user-123',
        }),
        expiresAt: null,
        idToken: createJwt({
          email: 'primary@sdr.pt',
          preferred_username: 'Primary User',
        }),
      }),
    ).toEqual({
      email: 'primary@sdr.pt',
      name: 'Primary User',
      userKey: 'user-123',
    })
  })

  it('falls back to the email claim when sub is missing', () => {
    expect(
      getAuthSessionIdentity({
        accessToken: createJwt({
          email: 'ana.silva@sdr.pt',
        }),
        expiresAt: null,
      }),
    ).toEqual({
      email: 'ana.silva@sdr.pt',
      name: null,
      userKey: 'ana.silva@sdr.pt',
    })
  })

  it('returns null when neither token exposes a valid identity', () => {
    expect(
      getAuthSessionIdentity({
        accessToken: 'invalid-token',
        expiresAt: null,
        idToken: 'also-invalid',
      }),
    ).toBeNull()
  })
})
