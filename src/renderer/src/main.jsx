import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './App.css'
import { applyInitialTheme } from './theme'
import { applyInitialAppearance } from './appearance'

applyInitialTheme()
applyInitialAppearance()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
