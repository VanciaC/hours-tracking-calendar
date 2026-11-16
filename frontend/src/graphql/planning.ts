import { gql } from '@apollo/client'
import type { ApolloCache, TypedDocumentNode } from '@apollo/client'
import type { EntryMode } from './calendar'
import type { ShiftDraft } from '../lib/workDay'

export interface ShiftDetail {
  id: string
  /** HH:MM:SS */
  startTime: string
  /** HH:MM:SS */
  endTime: string
  unpaidBreakMinutes: number
}

export interface WorkDayDetail {
  id: string
  date: string
  mode: EntryMode
  durationMinutes: number
  note: string | null
  shifts: ShiftDetail[]
}

export interface SaveWorkDayInput {
  date: string
  mode: EntryMode
  durationMinutes: number | null
  shifts: ShiftDraft[]
  note: string | null
}

const WORK_DAY_FIELDS = gql`
  fragment WorkDayFields on WorkDay {
    id
    date
    mode
    durationMinutes
    note
    shifts {
      id
      startTime
      endTime
      unpaidBreakMinutes
    }
  }
`

export const WORK_DAY_QUERY: TypedDocumentNode<
  { me: { id: string; workDays: WorkDayDetail[] } | null },
  { date: string }
> = gql`
  query WorkDay($date: Date!) {
    me {
      id
      workDays(from: $date, to: $date) {
        ...WorkDayFields
      }
    }
  }
  ${WORK_DAY_FIELDS}
`

export const SAVE_WORK_DAY_MUTATION: TypedDocumentNode<
  { saveWorkDay: WorkDayDetail },
  { input: SaveWorkDayInput }
> = gql`
  mutation SaveWorkDay($input: SaveWorkDayInput!) {
    saveWorkDay(input: $input) {
      ...WorkDayFields
    }
  }
  ${WORK_DAY_FIELDS}
`

export const DELETE_WORK_DAY_MUTATION: TypedDocumentNode<
  { deleteWorkDay: Pick<WorkDayDetail, 'id'> },
  { id: string }
> = gql`
  mutation DeleteWorkDay($id: ID!) {
    deleteWorkDay(id: $id) {
      id
    }
  }
`

/**
 * Drops every cached list of the user's work days (one per visited month or day),
 * so each of them is fetched again the next time it is displayed.
 */
export function evictWorkDays(cache: ApolloCache, userId: string): void {
  cache.evict({ id: cache.identify({ __typename: 'User', id: userId }), fieldName: 'workDays' })
  cache.gc()
}