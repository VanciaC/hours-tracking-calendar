import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@apollo/client';

export type EntryMode = 'DURATION' | 'SLOTS';

export interface CalendarWorkDay {
  id: string;
  /** ISO date, YYYY-MM-DD */
  date: string;
  mode: EntryMode;
  /** Net worked minutes, whatever the entry mode. */
  durationMinutes: number;
  note: string | null;
}

export interface HourlyRate {
  id: string;
  /** Gross amount in cents. */
  amountCents: number;
  /** ISO date, YYYY-MM-DD */
  effectiveFrom: string;
}

export interface CalendarData {
  me: {
    id: string;
    workDays: CalendarWorkDay[];
    hourlyRates: HourlyRate[];
  } | null;
}

export interface CalendarVariables {
  /** ISO date, inclusive */
  from: string;
  /** ISO date, inclusive */
  to: string;
}

export const CALENDAR_QUERY: TypedDocumentNode<CalendarData, CalendarVariables> = gql`
  query Calendar($from: Date!, $to: Date!) {
    me {
      id
      workDays(from: $from, to: $to) {
        id
        date
        mode
        durationMinutes
        note
      }
      hourlyRates {
        id
        amountCents
        effectiveFrom
      }
    }
  }
`;