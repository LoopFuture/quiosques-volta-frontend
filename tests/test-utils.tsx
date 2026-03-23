import type { ReactElement } from 'react'
import { render } from '@testing-library/react-native'
import { Provider } from '@/components/Provider'

export function renderWithProvider(ui: ReactElement) {
  return render(<Provider>{ui}</Provider>)
}
