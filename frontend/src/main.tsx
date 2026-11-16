import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ApolloProvider } from '@apollo/client/react'
import App from './App'
import './styles/tokens.css'
import './styles/index.css'
import { BrowserRouter } from 'react-router'
import { apolloClient } from './apollo'
import '@fontsource-variable/inter'
import { ThemeProvider } from './theme/ThemeProvider'
import './i18n'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ApolloProvider client={apolloClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ApolloProvider>
    </ThemeProvider>
  </StrictMode>,
)
