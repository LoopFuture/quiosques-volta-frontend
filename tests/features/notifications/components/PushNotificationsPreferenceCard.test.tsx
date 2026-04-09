import { fireEvent, screen } from '@testing-library/react-native'
import { PushNotificationsPreferenceCard } from '@/features/notifications/components/PushNotificationsPreferenceCard'
import { mockWindowDimensions } from '@tests/support/react-native'
import { renderWithProvider } from '@tests/support/test-utils'

const copy = {
  deniedHelper: 'Permission denied',
  deviceRequiredHelper: 'Device required',
  idleHelper: 'Idle helper',
  openSettingsLabel: 'Open settings',
  pendingHelper: 'Pending helper',
  readyHelper: 'Ready helper',
  registrationErrorHelper: 'Registration error helper',
  settingsHelper: 'Settings helper',
  tokenValue: ({ token }: { token: string }) => `token:${token}`,
} as const

describe('push notifications preference card', () => {
  it('shows the ready state, token copy, and forwards toggle changes', () => {
    const onCheckedChange = jest.fn()

    renderWithProvider(
      <PushNotificationsPreferenceCard
        canAskAgain
        checked
        copy={copy}
        expoPushToken="ExponentPushToken[token]"
        isPhysicalDevice
        label="Push notifications"
        onCheckedChange={onCheckedChange}
        permissionStatus="granted"
        registrationErrorCode={null}
      />,
    )

    expect(screen.getByText('Ready helper')).toBeTruthy()
    expect(screen.getByText('token:ExponentPushToken[token]')).toBeTruthy()

    fireEvent.press(screen.getByLabelText('Push notifications'))

    expect(onCheckedChange).toHaveBeenCalledWith(false)
  })

  it('shows the settings recovery path when notifications are blocked', () => {
    const onCheckedChange = jest.fn()
    const onOpenSettings = jest.fn()

    renderWithProvider(
      <PushNotificationsPreferenceCard
        canAskAgain={false}
        checked
        copy={copy}
        expoPushToken={null}
        isPhysicalDevice
        label="Push notifications"
        onCheckedChange={onCheckedChange}
        onOpenSettings={onOpenSettings}
        permissionStatus="denied"
        registrationErrorCode={null}
      />,
    )

    expect(screen.getByText('Settings helper')).toBeTruthy()
    expect(screen.getByText('Open settings')).toBeTruthy()

    fireEvent.press(screen.getByText('Open settings'))

    expect(onOpenSettings).toHaveBeenCalled()
  })

  it('shows denied, device-required, and registration-error helper branches', () => {
    const view = renderWithProvider(
      <PushNotificationsPreferenceCard
        canAskAgain
        checked={false}
        copy={copy}
        expoPushToken={null}
        isPhysicalDevice
        label="Push notifications"
        onCheckedChange={jest.fn()}
        permissionStatus="denied"
        registrationErrorCode={null}
      />,
    )

    expect(screen.getByText('Permission denied')).toBeTruthy()

    view.unmount()
    renderWithProvider(
      <PushNotificationsPreferenceCard
        canAskAgain
        checked={false}
        copy={copy}
        expoPushToken={null}
        isPhysicalDevice={false}
        label="Push notifications"
        onCheckedChange={jest.fn()}
        permissionStatus="undetermined"
        registrationErrorCode="device-required"
      />,
    )

    expect(screen.getByText('Device required')).toBeTruthy()

    renderWithProvider(
      <PushNotificationsPreferenceCard
        canAskAgain
        checked={false}
        copy={copy}
        expoPushToken={null}
        isPhysicalDevice
        label="Push notifications"
        onCheckedChange={jest.fn()}
        permissionStatus="undetermined"
        registrationErrorCode="missing-project-id"
      />,
    )

    expect(screen.getByText('Registration error helper')).toBeTruthy()
  })

  it('shows the pending state and supports compact unframed rendering', () => {
    const widthSpy = mockWindowDimensions({ width: 320 })

    renderWithProvider(
      <PushNotificationsPreferenceCard
        canAskAgain
        checked={false}
        copy={copy}
        expoPushToken={null}
        framed={false}
        isPending
        isPhysicalDevice
        label="Push notifications"
        onCheckedChange={jest.fn()}
        permissionStatus="undetermined"
        registrationErrorCode={null}
        testID="push-card"
      />,
    )

    expect(screen.getByTestId('push-card')).toBeTruthy()
    expect(screen.getByText('Pending helper')).toBeTruthy()
    expect(screen.queryByText('Open settings')).toBeNull()

    widthSpy.mockRestore()
  })

  it('shows the idle helper when no permission flow has started', () => {
    renderWithProvider(
      <PushNotificationsPreferenceCard
        canAskAgain
        checked={false}
        copy={copy}
        expoPushToken={null}
        isPhysicalDevice
        label="Push notifications"
        onCheckedChange={jest.fn()}
        permissionStatus="undetermined"
        registrationErrorCode={null}
      />,
    )

    expect(screen.getByText('Idle helper')).toBeTruthy()
  })
})
