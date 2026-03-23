import * as ReactNative from 'react-native'

const originalPlatformOS = ReactNative.Platform.OS

export const defaultWindowDimensions = {
  fontScale: 1,
  height: 844,
  scale: 3,
  width: 390,
}

export function setPlatformOS(os: typeof ReactNative.Platform.OS) {
  Object.defineProperty(ReactNative.Platform, 'OS', {
    configurable: true,
    value: os,
  })
}

export function restorePlatformOS() {
  setPlatformOS(originalPlatformOS)
}

export function mockWindowDimensions(
  overrides: Partial<typeof defaultWindowDimensions> = {},
) {
  return jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({
    ...defaultWindowDimensions,
    ...overrides,
  })
}
