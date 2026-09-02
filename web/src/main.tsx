import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Open-source Chinese UI font (Noto Sans SC) + data/numbers font (IBM Plex Mono)
import '@fontsource-variable/noto-sans-sc/wght.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import './index.css'
import App from './App.tsx'
import { initWasm } from './lib/wasm'
import { SettingsProvider } from './lib/settingsContext'

// Initialize WASM before mounting React
initWasm().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </StrictMode>,
  )
})
