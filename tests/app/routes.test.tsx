import BarcodeRoute from '@/app/(tabs)/barcode'
import HomeRoute from '@/app/(tabs)/index'
import MapRoute from '@/app/(tabs)/map'
import ProfileRoute from '@/app/(tabs)/profile'
import WalletRoute from '@/app/(tabs)/wallet'
import NativeNotFoundRoute from '@/app/+not-found'
import AuthRoute from '@/app/auth'
import ProfileAppSettingsRoute from '@/app/profile/app-settings'
import ProfileHelpRoute from '@/app/profile/help'
import ProfilePaymentsRoute from '@/app/profile/payments'
import ProfilePersonalRoute from '@/app/profile/personal'
import ProfilePrivacyRoute from '@/app/profile/privacy'
import ProfileSummaryRoute from '@/app/profile/summary'
import SetupRoute from '@/app/setup'
import WalletMovementDetailRoute from '@/app/wallet/[movementId]'
import WalletMovementsRoute from '@/app/wallet/movements'
import WalletTransferRoute from '@/app/wallet/transfer'
import NotFoundScreen from '@/features/app-shell/screens/NotFoundScreen'
import AuthScreen from '@/features/auth/screens/AuthScreen'
import BarcodeScreen from '@/features/barcode/screens/BarcodeScreen'
import HomeScreen from '@/features/home/screens/HomeScreen'
import MapScreen from '@/features/map/screens/MapScreen'
import {
  ProfileAppSettingsScreen,
  ProfilePaymentsScreen,
  ProfilePersonalScreen,
  ProfilePrivacyScreen,
  ProfileSetupScreen,
} from '@/features/profile/screens/ProfileEditorScreens'
import ProfileHelpScreen from '@/features/profile/screens/ProfileHelpScreen'
import ProfileScreen from '@/features/profile/screens/ProfileScreen'
import ProfileSummaryScreen from '@/features/profile/screens/ProfileSummaryScreen'
import WalletMovementDetailScreen from '@/features/wallet/screens/WalletMovementDetailScreen'
import WalletMovementsScreen from '@/features/wallet/screens/WalletMovementsScreen'
import WalletScreen from '@/features/wallet/screens/WalletScreen'
import WalletTransferScreen from '@/features/wallet/screens/WalletTransferScreen'

describe('route entrypoints', () => {
  it('re-exports the current feature screens from app routes', () => {
    expect(HomeRoute).toBe(HomeScreen)
    expect(BarcodeRoute).toBe(BarcodeScreen)
    expect(MapRoute).toBe(MapScreen)
    expect(ProfileRoute).toBe(ProfileScreen)
    expect(WalletRoute).toBe(WalletScreen)
    expect(NativeNotFoundRoute).toBe(NotFoundScreen)
    expect(AuthRoute).toBe(AuthScreen)
    expect(SetupRoute).toBe(ProfileSetupScreen)
    expect(ProfileAppSettingsRoute).toBe(ProfileAppSettingsScreen)
    expect(ProfileHelpRoute).toBe(ProfileHelpScreen)
    expect(ProfilePaymentsRoute).toBe(ProfilePaymentsScreen)
    expect(ProfilePersonalRoute).toBe(ProfilePersonalScreen)
    expect(ProfilePrivacyRoute).toBe(ProfilePrivacyScreen)
    expect(ProfileSummaryRoute).toBe(ProfileSummaryScreen)
    expect(WalletMovementDetailRoute).toBe(WalletMovementDetailScreen)
    expect(WalletMovementsRoute).toBe(WalletMovementsScreen)
    expect(WalletTransferRoute).toBe(WalletTransferScreen)
  })
})
