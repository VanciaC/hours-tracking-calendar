import { gql } from '@apollo/client'

export type CurrentUser = {
  id: string
  name: string
  email: string
}

export const ME_QUERY = gql`
  query Me {
    me {
      id
      name
      email
    }
  }
`

export type MeQueryData = {
  me: CurrentUser | null
}

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      accessToken
      expiresIn
    }
  }
`

export type LoginMutationData = {
  login: {
    accessToken: string
    expiresIn: number
  }
}

export type LoginMutationVariables = {
  email: string
  password: string
}