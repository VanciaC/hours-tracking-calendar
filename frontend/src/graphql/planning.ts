import { gql } from '@apollo/client'
import type { ApolloCache, TypedDocumentNode } from '@apollo/client'
import type { EntryMode } from './calendar'
import type { ShiftDraft, HoursSource } from '../lib/workDay'

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

export interface EntryTemplateDetail {
  id: string
  label: string | null
  mode: EntryMode
  durationMinutes: number | null
  /** HH:MM */
  slots: { startTime: string; endTime: string; unpaidBreakMinutes: number }[]
  isDefault: boolean
}

export interface EntryTemplateInput {
  label: string
  mode: EntryMode
  durationMinutes: number | null
  slots: ShiftDraft[]
  isDefault: boolean
}

/** A template's hours, in the shape the hours form reads. */
export function templateHours(template: EntryTemplateDetail): HoursSource {
  return { mode: template.mode, durationMinutes: template.durationMinutes, shifts: template.slots }
}

const ENTRY_TEMPLATE_FIELDS = gql`
  fragment EntryTemplateFields on EntryTemplate {
    id
    label
    mode
    durationMinutes
    isDefault
    slots {
      startTime
      endTime
      unpaidBreakMinutes
    }
  }
`

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
  { me: { id: string; workDays: WorkDayDetail[]; entryTemplates: EntryTemplateDetail[] } | null },
  { date: string }
> = gql`
  query WorkDay($date: Date!) {
    me {
      id
      workDays(from: $date, to: $date) {
        ...WorkDayFields
      }
      entryTemplates {
        ...EntryTemplateFields
      }
    }
  }
  ${WORK_DAY_FIELDS}
  ${ENTRY_TEMPLATE_FIELDS}
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

export const ENTRY_TEMPLATES_QUERY: TypedDocumentNode<
  { me: { id: string; entryTemplates: EntryTemplateDetail[] } | null },
  Record<string, never>
> = gql`
  query EntryTemplates {
    me {
      id
      entryTemplates {
        ...EntryTemplateFields
      }
    }
  }
  ${ENTRY_TEMPLATE_FIELDS}
`

export const CREATE_ENTRY_TEMPLATE_MUTATION: TypedDocumentNode<
  { createEntryTemplate: EntryTemplateDetail },
  { input: EntryTemplateInput }
> = gql`
  mutation CreateEntryTemplate($input: EntryTemplateInput!) {
    createEntryTemplate(input: $input) {
      ...EntryTemplateFields
    }
  }
  ${ENTRY_TEMPLATE_FIELDS}
`

export const UPDATE_ENTRY_TEMPLATE_MUTATION: TypedDocumentNode<
  { updateEntryTemplate: EntryTemplateDetail },
  { id: string; input: EntryTemplateInput }
> = gql`
  mutation UpdateEntryTemplate($id: ID!, $input: EntryTemplateInput!) {
    updateEntryTemplate(id: $id, input: $input) {
      ...EntryTemplateFields
    }
  }
  ${ENTRY_TEMPLATE_FIELDS}
`

export const DELETE_ENTRY_TEMPLATE_MUTATION: TypedDocumentNode<
  { deleteEntryTemplate: Pick<EntryTemplateDetail, 'id'> },
  { id: string }
> = gql`
  mutation DeleteEntryTemplate($id: ID!) {
    deleteEntryTemplate(id: $id) {
      id
    }
  }
`

export const WORK_DAYS_RANGE_QUERY: TypedDocumentNode<
  {
    me: {
      id: string
      workDays: Pick<WorkDayDetail, 'id' | 'date' | 'durationMinutes'>[]
      entryTemplates: EntryTemplateDetail[]
    } | null
  },
  { from: string; to: string }
> = gql`
  query WorkDaysRange($from: Date!, $to: Date!) {
    me {
      id
      workDays(from: $from, to: $to) {
        id
        date
        durationMinutes
      }
      entryTemplates {
        ...EntryTemplateFields
      }
    }
  }
  ${ENTRY_TEMPLATE_FIELDS}
`

export const SAVE_WORK_DAYS_MUTATION: TypedDocumentNode<
  { saveWorkDays: Pick<WorkDayDetail, 'id' | 'date' | 'durationMinutes'>[] },
  { dates: string[]; hours: Omit<SaveWorkDayInput, 'date'> }
> = gql`
  mutation SaveWorkDays($dates: [Date!]!, $hours: WorkDayHoursInput!) {
    saveWorkDays(dates: $dates, hours: $hours) {
      id
      date
      durationMinutes
    }
  }
`