import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client'
import { SetContextLink } from '@apollo/client/link/context'
import { session } from './auth/session'

// Same origin as the page: Vite (dev) or Caddy (production) forwards /graphql to the router.
const uri = import.meta.env.VITE_GRAPHQL_URL ?? '/graphql'

/** Adds "Authorization: Bearer <token>" to every request, renewing the token first when it is about to expire. */
const authLink = new SetContextLink(async (prevContext) => {
  const token = await session.getAccessToken()

  return {
    headers: {
      ...prevContext.headers,
      ...(token !== null ? { Authorization: `Bearer ${token}` } : {}),
    },
  }
})

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([authLink, new HttpLink({ uri })]),
  cache: new InMemoryCache(),
})
