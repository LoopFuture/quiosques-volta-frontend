import { z } from 'zod/v4'
import type { AppAuthSession } from './session'

const jwtPayloadSchema = z.object({
  email: z.string().trim().optional(),
  name: z.string().trim().optional(),
  preferred_username: z.string().trim().optional(),
  sub: z.string().trim().optional(),
})

const emailSchema = z.string().email()
const base64Alphabet =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

export type AppAuthIdentity = {
  email: string | null
  name: string | null
  userKey: string
}

function normalizeText(value?: string | null) {
  const normalized = value?.trim()

  return normalized ? normalized : null
}

function normalizeEmail(value?: string | null) {
  const normalized = normalizeText(value)

  if (!normalized || !emailSchema.safeParse(normalized).success) {
    return null
  }

  return normalized
}

function decodeBase64(base64Value: string) {
  let buffer = 0
  let bitCount = 0
  let decoded = ''

  for (const character of base64Value.replace(/=+$/g, '')) {
    const nextValue = base64Alphabet.indexOf(character)

    if (nextValue < 0) {
      return null
    }

    buffer = (buffer << 6) | nextValue
    bitCount += 6

    while (bitCount >= 8) {
      bitCount -= 8
      decoded += String.fromCharCode((buffer >> bitCount) & 0xff)
    }
  }

  return decoded
}

function decodeBase64Url(value: string) {
  const paddedValue = value
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=')
  const decodedValue = decodeBase64(paddedValue)

  if (!decodedValue) {
    return null
  }

  try {
    return decodeURIComponent(
      decodedValue
        .split('')
        .map(
          (character) =>
            `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`,
        )
        .join(''),
    )
  } catch {
    return decodedValue
  }
}

function parseJwtPayload(token?: string) {
  const payloadSegment = token?.split('.')[1]

  if (!payloadSegment) {
    return null
  }

  const decodedPayload = decodeBase64Url(payloadSegment)

  if (!decodedPayload) {
    return null
  }

  try {
    const parsedPayload = jwtPayloadSchema.safeParse(JSON.parse(decodedPayload))

    return parsedPayload.success ? parsedPayload.data : null
  } catch {
    return null
  }
}

export function getAuthSessionIdentity(
  session: AppAuthSession | null,
): AppAuthIdentity | null {
  if (!session) {
    return null
  }

  const preferredPayload = parseJwtPayload(session.idToken)
  const fallbackPayload = parseJwtPayload(session.accessToken)
  const email =
    normalizeEmail(preferredPayload?.email) ??
    normalizeEmail(fallbackPayload?.email)
  const name =
    normalizeText(preferredPayload?.name) ??
    normalizeText(preferredPayload?.preferred_username) ??
    normalizeText(fallbackPayload?.name) ??
    normalizeText(fallbackPayload?.preferred_username)
  const userKey =
    normalizeText(preferredPayload?.sub) ??
    normalizeText(fallbackPayload?.sub) ??
    email

  if (!userKey) {
    return null
  }

  return {
    email,
    name,
    userKey,
  }
}
