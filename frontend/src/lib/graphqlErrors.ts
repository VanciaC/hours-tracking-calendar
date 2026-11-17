import { CombinedGraphQLErrors } from '@apollo/client'
import type { GraphQLFormattedError } from 'graphql'

type GraphQLErrors = ReadonlyArray<GraphQLFormattedError>

/** GraphQL errors returned by the API, or an empty list for a network error or no error. */
export function graphQLErrors(error: unknown): GraphQLErrors {
  return CombinedGraphQLErrors.is(error) ? error.errors : []
}

/** First code set by the services in extensions.code (e.g. "EMAIL_NOT_VERIFIED"), or null. */
export function errorCode(errors: GraphQLErrors): string | null {
  for (const error of errors) {
    const code = error.extensions?.code
    if (typeof code === 'string') {
      return code
    }
  }

  return null
}

/** Arguments rejected by Lighthouse validation (extensions.validation), e.g. ["email"]. */
export function invalidFields(errors: GraphQLErrors): string[] {
  return errors.flatMap((error) => {
    const validation = error.extensions?.validation
    return validation !== null && typeof validation === 'object' ? Object.keys(validation) : []
  })
}
