import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client'
import { SetContextLink } from '@apollo/client/link/context'
import { tokenStorage } from './auth/tokenStorage'

// URL of the Apollo Router (supergraph). Can be overridden with VITE_GRAPHQL_URL.
const uri = import.meta.env.VITE_GRAPHQL_URL ?? 'http://localhost:4000/'

/** Adds "Authorization: Bearer <token>" to every request when the user is logged in. */
const authLink = new SetContextLink((prevContext) => {
  const token = tokenStorage.get()

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