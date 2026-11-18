import { describe, expect, it } from 'vitest'
import { PERSON_COLOR_COUNT, initials, toTeamMembers } from '../people'

describe('initials', () => {
  it('keeps the first letter of the first two words', () => {
    expect(initials('Demo User')).toBe('DU')
    expect(initials('  alice   de la Tour ')).toBe('AD')
    expect(initials('Bruno')).toBe('B')
  })
})

describe('toTeamMembers', () => {
  it('gives colors by id rank and keeps the given order', () => {
    const members = toTeamMembers([
      { id: '12', name: 'Alice' },
      { id: '3', name: 'Bruno' },
    ])

    expect(members.map((member) => [member.name, member.colorSlot])).toEqual([
      ['Alice', 1],
      ['Bruno', 0],
    ])
  })

  it('does not change anyone else color when a newcomer arrives', () => {
    const before = toTeamMembers([
      { id: '3', name: 'Bruno' },
      { id: '12', name: 'Alice' },
    ])
    const after = toTeamMembers([
      { id: '3', name: 'Bruno' },
      { id: '12', name: 'Alice' },
      { id: '40', name: 'Chloé' },
    ])

    expect(after.slice(0, 2)).toEqual(before)
  })

  it('reuses the colors once they are all taken', () => {
    const people = Array.from({ length: PERSON_COLOR_COUNT + 1 }, (_, index) => ({
      id: String(index + 1),
      name: `P${index + 1}`,
    }))

    expect(toTeamMembers(people).at(-1)?.colorSlot).toBe(0)
  })
})
