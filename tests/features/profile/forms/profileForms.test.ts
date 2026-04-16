import {
  getProfilePaymentsFormDefaultValues,
  getProfilePersonalFormDefaultValues,
} from '@/features/profile/forms'

describe('profile form helpers', () => {
  it('falls back to an empty payments account holder name when no source value exists', () => {
    expect(getProfilePaymentsFormDefaultValues(null)).toEqual({
      accountHolderName: '',
      iban: '',
    })
  })

  it('normalizes missing personal optional values to empty strings', () => {
    expect(
      getProfilePersonalFormDefaultValues({
        email: 'setup@volta.pt',
        name: null,
        nif: null,
        phoneNumber: null,
      }),
    ).toEqual({
      email: 'setup@volta.pt',
      name: '',
      nif: '',
      phoneNumber: '',
    })
  })
})
