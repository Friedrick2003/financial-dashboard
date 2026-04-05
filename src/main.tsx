import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Enable mock API in development mode
if (import.meta.env.DEV) {
  import('./lib/mockApi').then(({ setupMockApi }) => {
    setupMockApi();
  }).catch(console.error);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
