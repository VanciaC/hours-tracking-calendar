/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Privacy contact address shown on /confidentialite. */
  readonly VITE_PRIVACY_CONTACT?: string
}

interface ImportMetaEnv {
  readonly VITE_GRAPHQL_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
