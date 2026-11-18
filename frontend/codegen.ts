import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  overwrite: true,
  // The router's public schema: every service merged, exactly what the front can query.
  schema: 'http://router:4000/',
  // Operations are written in .graphql files; everything else is generated.
  documents: ['src/graphql/operations/**/*.graphql'],
  generates: {
    'src/graphql/__generated__/graphql.ts': {
      plugins: ['typescript-operations', 'typed-document-node'],
      config: {
        // Apollo Client always adds __typename to objects...
        nonOptionalTypename: true,
        // ...but not to the root Query and Mutation types.
        skipTypeNameForRoot: true,
        // Date travels as a YYYY-MM-DD string, DateTime as "YYYY-MM-DD HH:MM:SS".
        scalars: { Date: 'string', DateTime: 'string' },
        // Unknown scalars become `unknown` instead of `any`.
        defaultScalarType: 'unknown',
        // Enums as string unions ('SLOTS' | 'DURATION') rather than TypeScript enums.
        enumType: 'string-literal',
        // Type-only imports, required by the project's TypeScript settings.
        useTypeImports: true,
      },
    },
  },
}

export default config
