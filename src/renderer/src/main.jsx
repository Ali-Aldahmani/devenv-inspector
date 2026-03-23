import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './App.css'

const savedTheme = localStorage.getItem('devenv-theme')
if (savedTheme === 'light') {
  document.documentElement.classList.add('light-mode')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
