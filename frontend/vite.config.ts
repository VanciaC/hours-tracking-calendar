import { defineConfig, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Passes on the address typed in the browser (demo.localhost:5173): the services read
 * the company from it. In production, Caddy sets this header itself.
 */
const forwardBrowserHost: Pick<ProxyOptions, 'configure'> = {
  configure: (proxy) => {
    proxy.on('proxyReq', (proxyReq, req) => {
      if (req.headers.host) {
        proxyReq.setHeader('X-Forwarded-Host', req.headers.host)
      }
    })
  },
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // One subdomain per company: demo.localhost, dupont.localhost...
    allowedHosts: ['.localhost'],
    // Same origin as in production, where Caddy plays this role: the refresh cookie
    // and the API share the front end's address, with no CORS involved.
    proxy: {
      // The router serves GraphQL on "/", not on "/graphql".
      '/graphql': { target: 'http://router:4000', rewrite: () => '/', ...forwardBrowserHost },
      '/auth': { target: 'http://auth-service:8000', ...forwardBrowserHost },
    },
  },
})
