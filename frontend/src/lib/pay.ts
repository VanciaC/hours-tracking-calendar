import { format, parseISO, subDays } from 'date-fns'

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

export interface RateSpan {
  /** ISO date, inclusive */
  from: string
  /** ISO date, inclusive */
  to: string
  amountCents: number
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

/**
 * Rates in force between two dates, each with the period it covers within those bounds.
 * A rate has no end date: it lasts until the day before the next rate, or until `to`.
 */
export function rateSpansBetween(from: string, to: string, rates: readonly RatePeriod[]): RateSpan[] {
  const sorted = [...rates].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom))
  const spans: RateSpan[] = []

  sorted.forEach((rate, index) => {
    const next = sorted[index + 1]
    const start = rate.effectiveFrom > from ? rate.effectiveFrom : from
    const naturalEnd = next ? dayBefore(next.effectiveFrom) : to
    const end = naturalEnd < to ? naturalEnd : to

    // Rates fully replaced before `from`, or starting after `to`, give an empty span.
    if (start <= end) {
      spans.push({ from: start, to: end, amountCents: rate.amountCents })
    }
  })

  return spans
}

function dayBefore(isoDate: string): string {
  return format(subDays(parseISO(isoDate), 1), 'yyyy-MM-dd')
}