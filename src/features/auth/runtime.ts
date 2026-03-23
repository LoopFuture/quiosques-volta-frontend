let currentAuthAccessToken: string | null = null

export function getCurrentAuthAccessToken() {
  return currentAuthAccessToken
}

export function setCurrentAuthAccessToken(accessToken: string | null) {
  currentAuthAccessToken = accessToken
}
