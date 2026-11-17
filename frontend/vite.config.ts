import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Same origin as in production, where Caddy plays this role: the refresh cookie
    // and the API share the front end's address, with no CORS involved.
    proxy: {
      // The router serves GraphQL on "/", not on "/graphql".
      '/graphql': { target: 'http://router:4000', rewrite: () => '/' },
      '/auth': { target: 'http://auth-service:8000' },
    },
  },
})
