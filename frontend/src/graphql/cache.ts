import type { ApolloCache } from '@apollo/client'

/**
 * Drops every cached list of the user's work days (one per visited month or day),
 * so each of them is fetched again the next time it is displayed.
 */
export function evictWorkDays(cache: ApolloCache, userId: string): void {
  cache.evict({ id: cache.identify({ __typename: 'User', id: userId }), fieldName: 'workDays' })
  cache.gc()
}
