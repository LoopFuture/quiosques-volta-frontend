import {
  darkTabBarBackground,
  getTabBarBackground,
  lightTabBarBackground,
} from '@/themes'

describe('themes', () => {
  it('returns the correct tab bar background for light and dark themes', () => {
    expect(getTabBarBackground('light')).toBe(lightTabBarBackground)
    expect(getTabBarBackground('dark')).toBe(darkTabBarBackground)
    expect(getTabBarBackground('dark_alt')).toBe(darkTabBarBackground)
  })
})
