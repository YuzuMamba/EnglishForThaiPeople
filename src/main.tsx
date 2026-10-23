import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource-variable/nunito'
// Thai is the UI language, so every weight the design uses must exist for it —
// a weight that is missing here gets faux-bolded by the browser and reads muddy.
import '@fontsource/noto-sans-thai/400.css'
import '@fontsource/noto-sans-thai/500.css'
import '@fontsource/noto-sans-thai/600.css'
import '@fontsource/noto-sans-thai/700.css'
import '@fontsource/noto-sans-thai/800.css'
import '@fontsource/noto-sans-thai/900.css'
import './styles/global.css'
import App from './App'
import { useApp, stashRescue } from './core/store'

// `?demo=1` seeds a mid-journey account so every screen has life in it.
// It DESTROYS whatever was there, so the original is stashed to a rescue key
// first and stays restorable from Settings — a demo link should never be able
// to cost someone their history.
if (new URLSearchParams(location.search).get('demo')) {
  try {
    const existing = localStorage.getItem('chaienglish-v1')
    if (existing) stashRescue('demo-overwrite', existing)
    localStorage.removeItem('chaienglish-v1')
  } catch { /* sandboxed embed */ }
  useApp.getState().seedDemo()
  const screen = new URLSearchParams(location.search).get('screen')
  if (screen) useApp.getState().go(screen as never)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
