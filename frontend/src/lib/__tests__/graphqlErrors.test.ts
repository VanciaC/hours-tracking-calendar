import { describe, expect, it } from 'vitest'
import { errorCode, invalidFields } from '../graphqlErrors'

describe('errorCode', () => {
  it('returns the first code found in the extensions', () => {
    const errors = [{ message: 'Validation' }, { message: 'Not verified', extensions: { code: 'EMAIL_NOT_VERIFIED' } }]

    expect(errorCode(errors)).toBe('EMAIL_NOT_VERIFIED')
  })

  it('returns null when no error has a code', () => {
    expect(errorCode([{ message: 'Boom' }])).toBeNull()
    expect(errorCode([])).toBeNull()
  })
})

describe('invalidFields', () => {
  it('lists the arguments rejected by validation', () => {
    const errors = [
      {
        message: 'Validation failed',
        extensions: { validation: { email: ['Taken.'], password: ['Too short.'] } },
      },
    ]

    expect(invalidFields(errors)).toEqual(['email', 'password'])
  })

  it('returns an empty list without validation errors', () => {
    expect(invalidFields([{ message: 'Boom', extensions: { code: 'X' } }])).toEqual([])
  })
})
