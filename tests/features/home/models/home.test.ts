import { getHomeGreetingDisplayName } from '@/features/home/models/home'

describe('home model helpers', () => {
  it('keeps a single-word greeting name unchanged', () => {
    expect(getHomeGreetingDisplayName('Volta')).toBe('Volta')
  })

  it('reduces multi-part names to first and last names', () => {
    expect(getHomeGreetingDisplayName('Joao Pedro Ferreira')).toBe(
      'Joao Ferreira',
    )
  })
})
