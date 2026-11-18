/** Values of the ?vue= URL parameter of the team schedule. The day is the default. */
export type PlanningView = 'jour' | 'semaine' | 'mois'

const STORAGE_KEY = 'htc.planningView'

function isPlanningView(value: string | null): value is PlanningView {
  return value === 'jour' || value === 'semaine' || value === 'mois'
}

/**
 * Remembers the team schedule view for the rest of the tab's session, so going to the users
 * list and back keeps it. sessionStorage: forgotten when the tab closes.
 */
export function rememberPlanningView(view: PlanningView): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, view)
  } catch {
    // Storage disabled (some private modes): the schedule simply opens on the day.
  }
}

export function rememberedPlanningView(): PlanningView {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY)
    return isPlanningView(value) ? value : 'jour'
  } catch {
    return 'jour'
  }
}

/** Back to the default day view, e.g. after signing in: each session starts fresh. */
export function forgetPlanningView(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage disabled: nothing was remembered anyway.
  }
}

/** The view written in the URL, or the remembered one when the URL says nothing. */
export function parsePlanningView(value: string | null): PlanningView {
  return isPlanningView(value) ? value : rememberedPlanningView()
}
