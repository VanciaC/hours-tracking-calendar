/** Number of person colors, see the .person-N classes in styles/people.css. */
export const PERSON_COLOR_COUNT = 9

export interface TeamMember {
  id: string
  name: string
  /** Index of the .person-N class giving the person's color. */
  colorSlot: number
}

/** "Demo User" -> "DU" */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

/**
 * Gives each person a color from their rank by id. A newcomer always has a higher id,
 * so they never shift the colors of the people already there. The order is kept.
 */
export function toTeamMembers(people: readonly { id: string; name: string }[]): TeamMember[] {
  const ranks = new Map(
    [...people]
      .map((person) => person.id)
      .sort((a, b) => Number(a) - Number(b))
      .map((id, rank) => [id, rank]),
  )

  return people.map(({ id, name }) => ({
    id,
    name,
    colorSlot: (ranks.get(id) ?? 0) % PERSON_COLOR_COUNT,
  }))
}
