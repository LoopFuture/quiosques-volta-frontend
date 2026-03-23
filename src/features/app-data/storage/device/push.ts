import { clientStorage } from '../mmkv'

export const PUSH_INSTALLATION_ID_STORAGE_KEY = 'push.installationId'
export const pushPreferenceStorage = clientStorage

export function readPushInstallationId() {
  return pushPreferenceStorage.getString(PUSH_INSTALLATION_ID_STORAGE_KEY)
}

export function writePushInstallationId(installationId: string) {
  pushPreferenceStorage.set(PUSH_INSTALLATION_ID_STORAGE_KEY, installationId)
}
