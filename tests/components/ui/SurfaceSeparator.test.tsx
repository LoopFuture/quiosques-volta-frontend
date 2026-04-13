import { Separator } from 'tamagui'
import { SurfaceSeparator } from '@/components/ui/SurfaceSeparator'
import { renderWithTheme } from '@tests/support/test-utils'

describe('SurfaceSeparator', () => {
  it('uses the neutral dark border color by default', () => {
    const view = renderWithTheme(<SurfaceSeparator />, {
      defaultTheme: 'dark',
    })

    const separator = view.UNSAFE_getByType(Separator)

    expect(separator.props.borderColor).toBe('$color7')
  })
})
