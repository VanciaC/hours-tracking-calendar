export interface RatePeriod {
  /** Gross hourly amount in cents. */
  amountCents: number
  /** ISO date (YYYY-MM-DD) from which the rate applies. */
  effectiveFrom: string
}

export interface WorkedDay {
  /** ISO date (YYYY-MM-DD). */
  date: string
  /** Net worked minutes. */
  durationMinutes: number
}

export interface PayEstimate {
  grossCents: number
  /** Worked days before the first known rate: not included in grossCents. */
  unpricedDays: number
}

/**
 * Rate in force on the given date (RG-07): the most recent one whose effective date is on or before it.
 * ISO dates compare correctly as strings, which avoids any timezone issue.
 */
export function rateAt(date: string, rates: readonly RatePeriod[]): RatePeriod | null {
  let current: RatePeriod | null = null

  for (const rate of rates) {
    if (rate.effectiveFrom <= date && (current === null || rate.effectiveFrom > current.effectiveFrom)) {
      current = rate
    }
  }

  return current
}

/** Gross pay for the given days, each priced at the rate in force on its date. */
export function estimateGrossPay(days: readonly WorkedDay[], rates: readonly RatePeriod[]): PayEstimate {
  // Accumulate minutes x cents, then divide and round once to avoid cumulative rounding errors.
  let centMinutes = 0
  let unpricedDays = 0

  for (const day of days) {
    const rate = rateAt(day.date, rates)

    if (rate === null) {
      unpricedDays++
      continue
    }

    centMinutes += day.durationMinutes * rate.amountCents
  }

  return { grossCents: Math.round(centMinutes / 60), unpricedDays }
}

/** 82875 -> "828,75 €" */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}