import { gql } from '@apollo/client'
import type { TypedDocumentNode } from '@apollo/client'
import type { HourlyRate } from './calendar'

export interface HourlyRateInput {
  amountCents: number
  /** ISO date, YYYY-MM-DD */
  effectiveFrom: string
}

export const HOURLY_RATES_QUERY: TypedDocumentNode<
  { me: { id: string; hourlyRates: HourlyRate[] } | null },
  Record<string, never>
> = gql`
  query HourlyRates {
    me {
      id
      hourlyRates {
        id
        amountCents
        effectiveFrom
      }
    }
  }
`

export const SET_HOURLY_RATE_MUTATION: TypedDocumentNode<
  { setHourlyRate: HourlyRate },
  HourlyRateInput
> = gql`
  mutation SetHourlyRate($amountCents: Int!, $effectiveFrom: Date!) {
    setHourlyRate(amountCents: $amountCents, effectiveFrom: $effectiveFrom) {
      id
      amountCents
      effectiveFrom
    }
  }
`

export const UPDATE_HOURLY_RATE_MUTATION: TypedDocumentNode<
  { updateHourlyRate: HourlyRate },
  HourlyRateInput & { id: string }
> = gql`
  mutation UpdateHourlyRate($id: ID!, $amountCents: Int!, $effectiveFrom: Date!) {
    updateHourlyRate(id: $id, amountCents: $amountCents, effectiveFrom: $effectiveFrom) {
      id
      amountCents
      effectiveFrom
    }
  }
`

export const DELETE_HOURLY_RATE_MUTATION: TypedDocumentNode<
  { deleteHourlyRate: Pick<HourlyRate, 'id'> },
  { id: string }
> = gql`
  mutation DeleteHourlyRate($id: ID!) {
    deleteHourlyRate(id: $id) {
      id
    }
  }
`