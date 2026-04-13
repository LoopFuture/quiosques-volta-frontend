import * as Crypto from 'expo-crypto'
import * as SecureStore from 'expo-secure-store'
import { z } from 'zod/v4'

export const APP_PIN_LENGTH = 4

const APP_PIN_STORAGE_KEY = 'auth.pinCredential'
const appPinSchema = z.object({
  hash: z.string().min(1),
  salt: z.string().min(1),
  version: z.literal(1),
})

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  keychainService: 'volta-auth',
}

function isValidAppPin(pin: string) {
  return /^\d{4}$/.test(pin)
}

async function hashPin({ pin, salt }: { pin: string; salt: string }) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${pin}`,
  )
}

async function readStoredAppPinCredential() {
  const rawCredential = await SecureStore.getItemAsync(
    APP_PIN_STORAGE_KEY,
    secureStoreOptions,
  )

  if (!rawCredential) {
    return null
  }

  let parsedCredential: ReturnType<typeof appPinSchema.safeParse> | undefined

  try {
    parsedCredential = appPinSchema.safeParse(JSON.parse(rawCredential))
  } catch {
    await clearStoredAppPin()
    return null
  }

  if (!parsedCredential.success) {
    await clearStoredAppPin()
    return null
  }

  return parsedCredential.data
}

export async function hasStoredAppPin() {
  const credential = await readStoredAppPinCredential()

  return credential !== null
}

export async function clearStoredAppPin() {
  await SecureStore.deleteItemAsync(APP_PIN_STORAGE_KEY, secureStoreOptions)
}

export async function saveStoredAppPin(pin: string) {
  if (!isValidAppPin(pin)) {
    throw new Error('App PIN must be exactly four digits.')
  }

  const salt = Crypto.randomUUID()
  const hash = await hashPin({
    pin,
    salt,
  })

  await SecureStore.setItemAsync(
    APP_PIN_STORAGE_KEY,
    JSON.stringify({
      hash,
      salt,
      version: 1,
    }),
    secureStoreOptions,
  )
}

export async function verifyStoredAppPin(pin: string) {
  if (!isValidAppPin(pin)) {
    return false
  }

  const credential = await readStoredAppPinCredential()

  if (!credential) {
    return false
  }

  const hash = await hashPin({
    pin,
    salt: credential.salt,
  })

  return hash === credential.hash
}
