import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'

// URL du router Apollo (supergraph). Surchargeable via VITE_GRAPHQL_URL.
const uri = import.meta.env.VITE_GRAPHQL_URL ?? 'http://localhost:4000/'

export const apolloClient = new ApolloClient({
  link: new HttpLink({ uri }),
  cache: new InMemoryCache(),
})
